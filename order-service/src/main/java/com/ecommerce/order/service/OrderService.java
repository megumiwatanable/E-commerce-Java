package com.ecommerce.order.service;

import com.ecommerce.order.client.ProductClient;
import com.ecommerce.order.client.InventoryClient;
import com.ecommerce.order.dto.CartDTO;
import com.ecommerce.order.dto.OrderDTO;
import com.ecommerce.order.entity.Cart;
import com.ecommerce.order.entity.CartItem;
import com.ecommerce.order.entity.Order;
import com.ecommerce.order.entity.OrderItem;
import com.ecommerce.order.exception.InsufficientInventoryException;
import com.ecommerce.order.exception.OrderStateException;
import com.ecommerce.order.exception.ResourceNotFoundException;
import com.ecommerce.order.kafka.OrderEventProducer;
import com.ecommerce.order.repository.CartRepository;
import com.ecommerce.order.repository.OrderItemRepository;
import com.ecommerce.order.repository.OrderRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class OrderService {

    private static final Logger logger = LoggerFactory.getLogger(OrderService.class);
    private static final BigDecimal TAX_RATE = new BigDecimal("0.18"); // 18% GST
    private static final BigDecimal SHIPPING_COST = new BigDecimal("9.99");
    private static final BigDecimal FREE_SHIPPING_THRESHOLD = new BigDecimal("100.00");

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final CartRepository cartRepository;
    private final OrderEventProducer eventProducer;
    private final ProductClient productClient;
    private final InventoryClient inventoryClient;

    public OrderService(OrderRepository orderRepository, OrderItemRepository orderItemRepository,
                        CartRepository cartRepository, OrderEventProducer eventProducer,
                        ProductClient productClient, InventoryClient inventoryClient) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.cartRepository = cartRepository;
        this.eventProducer = eventProducer;
        this.productClient = productClient;
        this.inventoryClient = inventoryClient;
    }

    // ============ CART METHODS ============

    public CartDTO getCart(Long customerId) {
        Cart cart = cartRepository.findByCustomerId(customerId)
                .orElseGet(() -> {
                    Cart newCart = new Cart(customerId);
                    return cartRepository.save(newCart);
                });
        return mapCartToDTO(cart);
    }

    public CartDTO addToCart(Long customerId, CartDTO.AddItemRequest request) {
        Cart cart = cartRepository.findByCustomerId(customerId)
                .orElseGet(() -> cartRepository.save(new Cart(customerId)));

        ProductInfo product = getActiveProduct(request.getProductId());
        // Check if item already exists in cart
        Optional<CartItem> existingItem = cart.getItems().stream()
                .filter(item -> item.getProductId().equals(request.getProductId()))
                .findFirst();

        int desiredQuantity = request.getQuantity()
                + existingItem.map(CartItem::getQuantity).orElse(0);
        ensureAvailable(request.getProductId(), desiredQuantity);

        if (existingItem.isPresent()) {
            existingItem.get().setQuantity(existingItem.get().getQuantity() + request.getQuantity());
        } else {
            CartItem cartItem = new CartItem(
                    product.id, product.name, product.sku,
                    request.getQuantity(), product.price, product.imageUrl
            );
            cartItem.setCart(cart);
            cart.getItems().add(cartItem);
        }

        cart = cartRepository.save(cart);
        logger.info("Item added to cart for customer: {} - Product: {}", customerId, product.name);
        return mapCartToDTO(cart);
    }

    public CartDTO updateCartItem(Long customerId, Long productId, CartDTO.UpdateQuantityRequest request) {
        Cart cart = cartRepository.findByCustomerId(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart not found"));

        CartItem cartItem = cart.getItems().stream()
                .filter(item -> item.getProductId().equals(productId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Item not found in cart"));

        if (request.getQuantity() <= 0) {
            cart.getItems().remove(cartItem);
        } else {
            ensureAvailable(productId, request.getQuantity());
            cartItem.setQuantity(request.getQuantity());
        }

        cart = cartRepository.save(cart);
        return mapCartToDTO(cart);
    }

    public void removeCartItem(Long customerId, Long productId) {
        Cart cart = cartRepository.findByCustomerId(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart not found"));

        cart.getItems().removeIf(item -> item.getProductId().equals(productId));
        cartRepository.save(cart);
        logger.info("Item removed from cart for customer: {} - Product: {}", customerId, productId);
    }

    public void clearCart(Long customerId) {
        Cart cart = cartRepository.findByCustomerId(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart not found"));
        cart.getItems().clear();
        cartRepository.save(cart);
    }

    public CartDTO updateBillingAddress(Long customerId, CartDTO.BillingAddressRequest request) {
        Cart cart = cartRepository.findByCustomerId(customerId)
                .orElseGet(() -> cartRepository.save(new Cart(customerId)));
        cart.setBillingAddress(request.getBillingAddress());
        return mapCartToDTO(cartRepository.save(cart));
    }

    // ============ ORDER METHODS ============

    @Transactional
    public OrderDTO createOrder(Long customerId, OrderDTO.CreateOrderRequest request) {
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new InsufficientInventoryException("Order must contain at least one item");
        }

        // Validate and calculate order
        BigDecimal totalAmount = BigDecimal.ZERO;
        List<OrderItem> orderItems = new ArrayList<>();

        for (OrderDTO.OrderItemRequest itemRequest : request.getItems()) {
            ProductInfo product = getActiveProduct(itemRequest.getProductId());

            OrderItem orderItem = new OrderItem(
                    product.id, product.name, product.sku,
                    itemRequest.getQuantity(), product.price
            );
            orderItems.add(orderItem);
            totalAmount = totalAmount.add(orderItem.getTotalPrice());
        }

        // Calculate taxes and shipping
        BigDecimal taxAmount = totalAmount.multiply(TAX_RATE).setScale(2, RoundingMode.HALF_UP);
        BigDecimal shippingAmount = totalAmount.compareTo(FREE_SHIPPING_THRESHOLD) >= 0 ?
                BigDecimal.ZERO : SHIPPING_COST;
        BigDecimal finalAmount = totalAmount.add(taxAmount).add(shippingAmount);

        // Create order
        Order order = new Order();
        order.setOrderNumber(generateOrderNumber());
        order.setCustomerId(customerId);
        if (customerId == null) {
            if (request.getGuestEmail() == null || request.getGuestEmail().isBlank()
                    || request.getGuestPhone() == null || request.getGuestPhone().isBlank()) {
                throw new IllegalArgumentException("Email and phone are required for guest checkout");
            }
            order.setGuestEmail(request.getGuestEmail());
            order.setGuestPhone(request.getGuestPhone());
        }
        order.setTotalAmount(totalAmount);
        order.setTaxAmount(taxAmount);
        order.setShippingAmount(shippingAmount);
        order.setFinalAmount(finalAmount);
        order.setShippingAddress(request.getShippingAddress());
        order.setOrderStatus(Order.OrderStatus.PENDING);
        order.setPaymentStatus(Order.PaymentStatus.PENDING);

        order = orderRepository.save(order);

        // Set order reference on items
        for (OrderItem item : orderItems) {
            item.setOrder(order);
        }
        order.setItems(orderItems);
        orderItemRepository.saveAll(orderItems);

        // Publish order created event for each item
        for (OrderItem item : orderItems) {
            eventProducer.publishOrderCreatedEvent(order.getId(), order.getOrderNumber(),
                    customerId, item.getProductId(), item.getQuantity(), order.getFinalAmount());
        }

        logger.info("Order created: {} with total: {}", order.getOrderNumber(), order.getFinalAmount());

        // Clear the cart
        Cart cart = customerId == null ? null : cartRepository.findByCustomerId(customerId).orElse(null);
        if (cart != null) {
            cart.getItems().clear();
            cartRepository.save(cart);
        }

        return mapOrderToDTO(order);
    }

    public OrderDTO getOrderById(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));
        return mapOrderToDTO(order);
    }

    public OrderDTO getOrderByNumber(String orderNumber) {
        Order order = orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderNumber));
        return mapOrderToDTO(order);
    }

    public OrderDTO getGuestOrder(String checkoutToken) {
        Order order = orderRepository.findByCheckoutToken(checkoutToken)
                .orElseThrow(() -> new ResourceNotFoundException("Guest order not found"));
        return mapOrderToDTO(order);
    }

    public Page<OrderDTO> getCustomerOrders(Long customerId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return orderRepository.findByCustomerIdOrderByCreatedAtDesc(customerId, pageable)
                .map(this::mapOrderToDTO);
    }

    public Page<OrderDTO> getAllOrders(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return orderRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(this::mapOrderToDTO);
    }

    public Page<OrderDTO> getOrdersByStatus(String status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Order.OrderStatus orderStatus = Order.OrderStatus.valueOf(status);
        return orderRepository.findByOrderStatus(orderStatus, pageable)
                .map(this::mapOrderToDTO);
    }

    public List<OrderDTO.OrderItemDTO> getOrderItems(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));
        return orderItemRepository.findByOrderId(orderId).stream()
                .map(this::mapOrderItemToDTO)
                .toList();
    }

    @Transactional
    public OrderDTO cancelOrder(Long orderId, Long customerId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        // Validate ownership
        if (!order.getCustomerId().equals(customerId)) {
            throw new ResourceNotFoundException("Order not found");
        }

        // Validate cancellation is allowed
        if (!canCancel(order.getOrderStatus())) {
            throw new OrderStateException(
                "Order cannot be cancelled in " + order.getOrderStatus() + " status");
        }

        order.setOrderStatus(Order.OrderStatus.CANCELLED);
        order = orderRepository.save(order);

        // Publish cancellation events for inventory release
        for (OrderItem item : order.getItems()) {
            eventProducer.publishOrderCancelledEvent(order.getId(), order.getOrderNumber(),
                    customerId, item.getProductId(), item.getQuantity());
        }

        logger.info("Order cancelled: {}", order.getOrderNumber());
        return mapOrderToDTO(order);
    }

    @Transactional
    public OrderDTO updateOrderStatus(Long orderId, String newStatus) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        Order.OrderStatus status = Order.OrderStatus.valueOf(newStatus);

        if (!isValidTransition(order.getOrderStatus(), status)) {
            throw new OrderStateException(
                String.format("Cannot transition from %s to %s", order.getOrderStatus(), status));
        }

        order.setOrderStatus(status);
        order = orderRepository.save(order);

        // Publish status event
        String eventType = "ORDER_" + status.name();
        eventProducer.publishOrderStatusEvent(order.getId(), order.getOrderNumber(),
                order.getCustomerId(), eventType);

        logger.info("Order {} status updated to {}", order.getOrderNumber(), status);
        return mapOrderToDTO(order);
    }

    // Dashboard statistics
    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalOrders", orderRepository.count());
        stats.put("pendingOrders", orderRepository.countByOrderStatus(Order.OrderStatus.PENDING));
        stats.put("confirmedOrders", orderRepository.countByOrderStatus(Order.OrderStatus.CONFIRMED));
        stats.put("shippedOrders", orderRepository.countByOrderStatus(Order.OrderStatus.SHIPPED));
        stats.put("deliveredOrders", orderRepository.countByOrderStatus(Order.OrderStatus.DELIVERED));
        stats.put("cancelledOrders", orderRepository.countByOrderStatus(Order.OrderStatus.CANCELLED));
        stats.put("failedOrders", orderRepository.countByOrderStatus(Order.OrderStatus.FAILED));
        return stats;
    }

    // ============ HELPER METHODS ============

    private String generateOrderNumber() {
        return "ORD-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"))
                + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
    }

    private boolean canCancel(Order.OrderStatus status) {
        return status == Order.OrderStatus.PENDING || status == Order.OrderStatus.CONFIRMED;
    }

    private boolean isValidTransition(Order.OrderStatus from, Order.OrderStatus to) {
        return switch (from) {
            case PENDING -> to == Order.OrderStatus.CONFIRMED || to == Order.OrderStatus.CANCELLED;
            case CONFIRMED -> to == Order.OrderStatus.PROCESSING || to == Order.OrderStatus.CANCELLED;
            case PROCESSING -> to == Order.OrderStatus.SHIPPED || to == Order.OrderStatus.CANCELLED;
            case SHIPPED -> to == Order.OrderStatus.OUT_FOR_DELIVERY;
            case OUT_FOR_DELIVERY -> to == Order.OrderStatus.DELIVERED;
            case DELIVERED, CANCELLED, FAILED -> false;
        };
    }

    private OrderDTO mapOrderToDTO(Order order) {
        OrderDTO dto = new OrderDTO();
        dto.setId(order.getId());
        dto.setOrderNumber(order.getOrderNumber());
        dto.setCustomerId(order.getCustomerId());
        dto.setGuestEmail(order.getGuestEmail());
        dto.setGuestPhone(order.getGuestPhone());
        dto.setTotalAmount(order.getTotalAmount());
        dto.setDiscountAmount(order.getDiscountAmount());
        dto.setTaxAmount(order.getTaxAmount());
        dto.setShippingAmount(order.getShippingAmount());
        dto.setFinalAmount(order.getFinalAmount());
        dto.setShippingAddress(order.getShippingAddress());
        dto.setBillingAddress(order.getBillingAddress());
        dto.setPaymentStatus(order.getPaymentStatus().name());
        dto.setOrderStatus(order.getOrderStatus().name());
        dto.setCreatedAt(order.getCreatedAt());

        if (order.getItems() != null) {
            dto.setItems(order.getItems().stream()
                    .map(this::mapOrderItemToDTO)
                    .toList());
        }

        return dto;
    }

    private OrderDTO.OrderItemDTO mapOrderItemToDTO(OrderItem item) {
        OrderDTO.OrderItemDTO dto = new OrderDTO.OrderItemDTO();
        dto.setId(item.getId());
        dto.setProductId(item.getProductId());
        dto.setProductName(item.getProductName());
        dto.setSku(item.getSku());
        dto.setQuantity(item.getQuantity());
        dto.setUnitPrice(item.getUnitPrice());
        dto.setTotalPrice(item.getTotalPrice());
        return dto;
    }

    private CartDTO mapCartToDTO(Cart cart) {
        CartDTO dto = new CartDTO();
        dto.setId(cart.getId());
        dto.setCustomerId(cart.getCustomerId());
        dto.setSubtotal(cart.getSubtotal());
        dto.setTotalItems(cart.getTotalItems());
        dto.setBillingAddress(cart.getBillingAddress());
        dto.setItems(cart.getItems().stream().map(item -> {
            CartDTO.CartItemDTO itemDTO = new CartDTO.CartItemDTO();
            itemDTO.setId(item.getId());
            itemDTO.setProductId(item.getProductId());
            itemDTO.setProductName(item.getProductName());
            itemDTO.setSku(item.getSku());
            itemDTO.setQuantity(item.getQuantity());
            itemDTO.setUnitPrice(item.getUnitPrice());
            itemDTO.setSubtotal(item.getSubtotal());
            itemDTO.setImageUrl(item.getImageUrl());
            applyInventory(itemDTO);
            return itemDTO;
        }).toList());
        return dto;
    }

    private void ensureAvailable(Long productId, Integer requestedQuantity) {
        try {
            InventoryClient.InventoryResponse response = inventoryClient.getInventory(productId);
            Integer available = response == null || response.getData() == null
                    ? 0 : response.getData().getAvailableQuantity();
            if (!response.isSuccess() || available == null || available < requestedQuantity) {
                throw new InsufficientInventoryException("Product is out of stock or only " + available + " item(s) remain");
            }
        } catch (InsufficientInventoryException e) {
            throw e;
        } catch (Exception e) {
            throw new InsufficientInventoryException("Inventory is unavailable for this product");
        }
    }

    private void applyInventory(CartDTO.CartItemDTO item) {
        try {
            InventoryClient.InventoryResponse response = inventoryClient.getInventory(item.getProductId());
            if (response != null && response.isSuccess() && response.getData() != null) {
                item.setAvailableQuantity(response.getData().getAvailableQuantity());
                item.setStockStatus(response.getData().getAvailableQuantity() != null
                        && response.getData().getAvailableQuantity() >= item.getQuantity() ? "IN_STOCK" : "OUT_OF_STOCK");
                return;
            }
        } catch (Exception ignored) {
            logger.warn("Could not load inventory for cart product {}", item.getProductId());
        }
        item.setAvailableQuantity(0);
        item.setStockStatus("OUT_OF_STOCK");
    }

    private ProductInfo getActiveProduct(Long productId) {
        try {
            ProductClient.ProductResponse response = productClient.getProduct(productId);
            ProductClient.ProductData product = response == null ? null : response.getData();
            if (product == null || !response.isSuccess() || !"ACTIVE".equals(product.getStatus())) {
                throw new ResourceNotFoundException("Product is not available: " + productId);
            }
            return new ProductInfo(product.getId(), product.getName(), product.getSku(),
                    product.getFinalPrice(), product.getImageUrl());
        } catch (ResourceNotFoundException ex) {
            throw ex;
        } catch (Exception ex) {
            logger.error("Failed to load product {} from Product Service", productId, ex);
            throw new ResourceNotFoundException("Product not found with id: " + productId);
        }
    }

    private record ProductInfo(Long id, String name, String sku, BigDecimal price, String imageUrl) {}
}
