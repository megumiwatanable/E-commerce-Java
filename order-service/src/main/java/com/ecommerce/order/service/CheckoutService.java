package com.ecommerce.order.service;

import com.ecommerce.order.client.InventoryClient;
import com.ecommerce.order.client.PaymentClient;
import com.ecommerce.order.client.ProductClient;
import com.ecommerce.order.dto.CheckoutDTO;
import com.ecommerce.order.entity.Order;
import com.ecommerce.order.entity.OrderItem;
import com.ecommerce.order.exception.InsufficientInventoryException;
import com.ecommerce.order.exception.OrderStateException;
import com.ecommerce.order.exception.ResourceNotFoundException;
import com.ecommerce.order.kafka.OrderEventProducer;
import com.ecommerce.order.repository.OrderItemRepository;
import com.ecommerce.order.repository.OrderRepository;
import feign.FeignException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class CheckoutService {
    private static final Logger logger = LoggerFactory.getLogger(CheckoutService.class);
    private static final BigDecimal TAX_RATE = new BigDecimal("0.18");
    private static final BigDecimal SHIPPING_COST = new BigDecimal("9.99");
    private static final BigDecimal FREE_SHIPPING_THRESHOLD = new BigDecimal("100.00");

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductClient productClient;
    private final InventoryClient inventoryClient;
    private final PaymentClient paymentClient;
    private final OrderEventProducer eventProducer;
    private final OrderService orderService;

    public CheckoutService(OrderRepository orderRepository, OrderItemRepository orderItemRepository,
                           ProductClient productClient,
                           InventoryClient inventoryClient, PaymentClient paymentClient,
                           OrderEventProducer eventProducer, OrderService orderService) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.productClient = productClient;
        this.inventoryClient = inventoryClient;
        this.paymentClient = paymentClient;
        this.eventProducer = eventProducer;
        this.orderService = orderService;
    }

    public synchronized CheckoutDTO.PlaceOrderResponse placeOrder(Long customerId,
                                                                   CheckoutDTO.PlaceOrderRequest request) {
        var existing = orderRepository.findByIdempotencyKey(request.getIdempotencyKey());
        if (existing.isPresent()) {
            Order order = existing.get();
            if (order.getOrderStatus() == Order.OrderStatus.FAILED) {
                throw new OrderStateException("The previous checkout attempt failed. Please submit again.");
            }
            return new CheckoutDTO.PlaceOrderResponse(
                    orderService.getOrderById(order.getId()), order.getCheckoutToken(), null);
        }

        List<OrderItem> items = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;
        for (CheckoutDTO.Item requestedItem : request.getItems()) {
            ProductClient.ProductData product = loadProduct(requestedItem.getProductId());
            OrderItem item = new OrderItem(product.getId(), product.getName(), product.getSku(),
                    requestedItem.getQuantity(), product.getFinalPrice());
            items.add(item);
            subtotal = subtotal.add(item.getTotalPrice());
        }

        BigDecimal tax = subtotal.multiply(TAX_RATE).setScale(2, RoundingMode.HALF_UP);
        BigDecimal shipping = subtotal.compareTo(FREE_SHIPPING_THRESHOLD) >= 0
                ? BigDecimal.ZERO : SHIPPING_COST;

        Order order = new Order();
        order.setOrderNumber(generateOrderNumber());
        order.setCustomerId(customerId);
        order.setGuestEmail(request.getEmail().trim());
        order.setGuestPhone(request.getPhone().trim());
        order.setCheckoutToken(customerId == null ? UUID.randomUUID().toString().replace("-", "") : null);
        order.setIdempotencyKey(request.getIdempotencyKey());
        order.setShippingAddress(request.getShippingAddress().formatted());
        order.setBillingAddress(request.getBillingAddress().formatted());
        order.setTotalAmount(subtotal);
        order.setTaxAmount(tax);
        order.setShippingAmount(shipping);
        order.setFinalAmount(subtotal.add(tax).add(shipping));
        order.setPaymentStatus(Order.PaymentStatus.PENDING);
        order.setOrderStatus(Order.OrderStatus.PENDING);
        order = orderRepository.save(order);

        for (OrderItem item : items) item.setOrder(order);
        orderItemRepository.saveAll(items);
        order.setItems(items);

        List<OrderItem> reserved = new ArrayList<>();
        try {
            for (OrderItem item : items) {
                inventoryClient.reserve(new InventoryClient.StockRequest(item.getProductId(), item.getQuantity()));
                reserved.add(item);
            }

            PaymentClient.PaymentResponse payment = paymentClient.process(
                    customerId == null ? null : customerId.toString(),
                    new PaymentClient.PaymentRequest(order.getId(), order.getFinalAmount(), request.getPaymentMethod()));
            if (payment == null || !payment.isSuccess() || payment.getData() == null
                    || !"COMPLETED".equals(payment.getData().getStatus())) {
                throw new OrderStateException("Payment could not be completed");
            }

            order.setPaymentStatus(Order.PaymentStatus.COMPLETED);
            order.setOrderStatus(Order.OrderStatus.PROCESSING);
            orderRepository.save(order);
            for (OrderItem item : reserved) {
                try {
                    inventoryClient.deduct(new InventoryClient.StockRequest(item.getProductId(), item.getQuantity()));
                } catch (Exception inventoryCommitError) {
                    logger.error("Payment completed but inventory commit must be retried for order {}, product {}",
                            order.getOrderNumber(), item.getProductId(), inventoryCommitError);
                }
            }

            eventProducer.publishOrderStatusEvent(order.getId(), order.getOrderNumber(),
                    customerId, "ORDER_PROCESSING");
            return new CheckoutDTO.PlaceOrderResponse(orderService.getOrderById(order.getId()),
                    order.getCheckoutToken(), payment.getData().getPaymentReference());
        } catch (RuntimeException exception) {
            releaseReserved(reserved);
            order.setPaymentStatus(Order.PaymentStatus.FAILED);
            order.setOrderStatus(Order.OrderStatus.FAILED);
            orderRepository.save(order);
            if (exception instanceof FeignException.FeignClientException) {
                throw new InsufficientInventoryException("A product is no longer available in the requested quantity");
            }
            throw exception;
        }
    }

    private ProductClient.ProductData loadProduct(Long productId) {
        try {
            ProductClient.ProductResponse response = productClient.getProduct(productId);
            if (response == null || !response.isSuccess() || response.getData() == null
                    || !"ACTIVE".equals(response.getData().getStatus())) {
                throw new ResourceNotFoundException("Product is not available: " + productId);
            }
            return response.getData();
        } catch (FeignException e) {
            throw new ResourceNotFoundException("Product is not available: " + productId);
        }
    }

    private void releaseReserved(List<OrderItem> reserved) {
        for (OrderItem item : reserved) {
            try {
                inventoryClient.release(new InventoryClient.StockRequest(item.getProductId(), item.getQuantity()));
            } catch (Exception releaseError) {
                logger.error("Could not release inventory for failed order, product {}",
                        item.getProductId(), releaseError);
            }
        }
    }

    private String generateOrderNumber() {
        return "ORD-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"))
                + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
    }
}
