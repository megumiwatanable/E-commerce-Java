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
import com.ecommerce.order.repository.CartRepository;
import com.ecommerce.order.repository.OrderItemRepository;
import com.ecommerce.order.repository.OrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("OrderService Unit Tests")
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private OrderItemRepository orderItemRepository;

    @Mock
    private CartRepository cartRepository;

    @Mock
    private ProductClient productClient;

    @Mock
    private InventoryClient inventoryClient;

    private OrderService orderService;

    private Cart testCart;
    private Order testOrder;

    @BeforeEach
    void setUp() {
        // Create a minimal no-op event producer to avoid mocking concrete classes
        // (Java 24 blocks Mockito from mocking concrete classes)
        com.ecommerce.order.kafka.OrderEventProducer noopProducer =
            new com.ecommerce.order.kafka.OrderEventProducer(null, new com.fasterxml.jackson.databind.ObjectMapper());
        orderService = new OrderService(orderRepository, orderItemRepository, cartRepository, noopProducer, productClient, inventoryClient);

        lenient().when(inventoryClient.getInventory(anyLong())).thenAnswer(invocation -> {
            InventoryClient.InventoryData data = new InventoryClient.InventoryData();
            data.setAvailableQuantity(100);
            data.setStockStatus("IN_STOCK");
            InventoryClient.InventoryResponse response = new InventoryClient.InventoryResponse();
            response.setSuccess(true);
            response.setData(data);
            return response;
        });

        lenient().when(productClient.getProduct(anyLong())).thenAnswer(invocation -> {
            Long id = invocation.getArgument(0);
            if (id == 999L) return null;
            ProductClient.ProductData data = new ProductClient.ProductData();
            data.setId(id);
            data.setName(id == 1L ? "Test Product" : "Test Product " + id);
            data.setSku(id == 1L ? "ELEC-001" : "SKU-" + id);
            data.setFinalPrice(BigDecimal.valueOf(100));
            data.setStatus("ACTIVE");
            ProductClient.ProductResponse response = new ProductClient.ProductResponse();
            response.setSuccess(true);
            response.setData(data);
            return response;
        });

        testCart = new Cart(1L);
        testCart.setId(1L);
        CartItem cartItem = new CartItem(1L, "Test Product", "ELEC-001",
                2, BigDecimal.valueOf(100), "http://image.jpg");
        cartItem.setId(1L);
        cartItem.setCart(testCart);
        testCart.getItems().add(cartItem);

        testOrder = new Order();
        testOrder.setId(1L);
        testOrder.setOrderNumber("ORD-20260101-ABC123");
        testOrder.setCustomerId(1L);
        testOrder.setTotalAmount(BigDecimal.valueOf(200));
        testOrder.setTaxAmount(BigDecimal.valueOf(36));
        testOrder.setShippingAmount(BigDecimal.ZERO);
        testOrder.setFinalAmount(BigDecimal.valueOf(236));
        testOrder.setOrderStatus(Order.OrderStatus.PENDING);
        testOrder.setPaymentStatus(Order.PaymentStatus.PENDING);
        testOrder.setShippingAddress("123 Test St, Test City, TS 12345");
        OrderItem testOrderItem = new OrderItem(1L, "Test Product", "ELEC-001",
                2, BigDecimal.valueOf(100));
        testOrderItem.setId(1L);
        testOrderItem.setOrder(testOrder);
        testOrder.setItems(List.of(testOrderItem));
    }

    // ===== CART TESTS =====

    @Test
    @DisplayName("Get Cart - Existing Cart Returns Items")
    void getCart_Existing_Success() {
        when(cartRepository.findByCustomerId(1L)).thenReturn(Optional.of(testCart));
        var result = orderService.getCart(1L);
        assertNotNull(result);
        assertEquals(1, result.getItems().size());
        assertEquals(2, result.getTotalItems());
    }

    @Test
    @DisplayName("Get Cart - Creates New Empty Cart")
    void getCart_New_CreatesEmptyCart() {
        when(cartRepository.findByCustomerId(2L)).thenReturn(Optional.empty());
        when(cartRepository.save(any(Cart.class))).thenAnswer(i -> {
            Cart c = i.getArgument(0); c.setId(2L); return c;
        });
        var result = orderService.getCart(2L);
        assertNotNull(result);
        assertEquals(0, result.getItems().size());
    }

    @Test
    @DisplayName("Add To Cart - New Product")
    void addToCart_NewProduct_Success() {
        when(cartRepository.findByCustomerId(1L)).thenReturn(Optional.of(testCart));
        when(cartRepository.save(any(Cart.class))).thenAnswer(i -> i.getArgument(0));
        CartDTO.AddItemRequest req = new CartDTO.AddItemRequest();
        req.setProductId(2L); req.setQuantity(1);
        var result = orderService.addToCart(1L, req);
        assertEquals(2, result.getItems().size());
    }

    @Test
    @DisplayName("Add To Cart - Existing Product Increases Qty")
    void addToCart_ExistingProduct_IncreasesQuantity() {
        when(cartRepository.findByCustomerId(1L)).thenReturn(Optional.of(testCart));
        when(cartRepository.save(any(Cart.class))).thenAnswer(i -> i.getArgument(0));
        CartDTO.AddItemRequest req = new CartDTO.AddItemRequest();
        req.setProductId(1L); req.setQuantity(1);
        var result = orderService.addToCart(1L, req);
        assertEquals(1, result.getItems().size());
        assertEquals(3, result.getItems().get(0).getQuantity());
    }

    @Test
    @DisplayName("Add To Cart - Product Not Found")
    void addToCart_ProductNotFound_Throws() {
        when(cartRepository.findByCustomerId(1L)).thenReturn(Optional.of(testCart));
        CartDTO.AddItemRequest req = new CartDTO.AddItemRequest();
        req.setProductId(999L); req.setQuantity(1);
        assertThrows(ResourceNotFoundException.class, () -> orderService.addToCart(1L, req));
    }

    @Test
    @DisplayName("Remove Cart Item")
    void removeCartItem_Success() {
        when(cartRepository.findByCustomerId(1L)).thenReturn(Optional.of(testCart));
        when(cartRepository.save(any(Cart.class))).thenAnswer(i -> i.getArgument(0));
        orderService.removeCartItem(1L, 1L);
        assertTrue(testCart.getItems().isEmpty());
    }

    @Test
    @DisplayName("Clear Cart")
    void clearCart_Success() {
        when(cartRepository.findByCustomerId(1L)).thenReturn(Optional.of(testCart));
        when(cartRepository.save(any(Cart.class))).thenAnswer(i -> i.getArgument(0));
        orderService.clearCart(1L);
        assertTrue(testCart.getItems().isEmpty());
    }

    // ===== ORDER CREATION =====

    @Test
    @DisplayName("Create Order - Success")
    void createOrder_Success() {
        when(cartRepository.findByCustomerId(1L)).thenReturn(Optional.of(testCart));
        when(orderRepository.save(any(Order.class))).thenAnswer(i -> { Order o = i.getArgument(0); o.setId(2L); return o; });
        when(orderItemRepository.saveAll(any())).thenAnswer(i -> i.getArgument(0));
        when(cartRepository.save(any(Cart.class))).thenAnswer(i -> i.getArgument(0));

        OrderDTO.CreateOrderRequest req = new OrderDTO.CreateOrderRequest();
        req.setShippingAddress("123 Test St");
        OrderDTO.OrderItemRequest item = new OrderDTO.OrderItemRequest();
        item.setProductId(1L); item.setQuantity(2);
        req.setItems(List.of(item));

        var result = orderService.createOrder(1L, req);
        assertNotNull(result.getOrderNumber());
        assertTrue(result.getOrderNumber().startsWith("ORD-"));
        assertEquals("PENDING", result.getOrderStatus());
        assertTrue(testCart.getItems().isEmpty()); // Cart cleared
    }

    @Test
    @DisplayName("Create Order - Empty Items Throws")
    void createOrder_EmptyItems_Throws() {
        OrderDTO.CreateOrderRequest req = new OrderDTO.CreateOrderRequest();
        req.setShippingAddress("123 Test St"); req.setItems(List.of());
        assertThrows(InsufficientInventoryException.class, () -> orderService.createOrder(1L, req));
    }

    @Test
    @DisplayName("Create Order - Invalid Product Throws")
    void createOrder_InvalidProduct_Throws() {
        // No cart stub needed - exception thrown before cart lookup
        OrderDTO.CreateOrderRequest req = new OrderDTO.CreateOrderRequest();
        req.setShippingAddress("123 Test St");
        OrderDTO.OrderItemRequest item = new OrderDTO.OrderItemRequest();
        item.setProductId(999L); item.setQuantity(1);
        req.setItems(List.of(item));
        assertThrows(ResourceNotFoundException.class, () -> orderService.createOrder(1L, req));
    }

    // ===== GET ORDER =====

    @Test
    @DisplayName("Get Order By ID - Success")
    void getOrderById_Success() {
        when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));
        var result = orderService.getOrderById(1L);
        assertEquals("PENDING", result.getOrderStatus());
    }

    @Test
    @DisplayName("Get Order By ID - Not Found")
    void getOrderById_NotFound_Throws() {
        when(orderRepository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> orderService.getOrderById(99L));
    }

    @Test
    @DisplayName("Get Customer Orders - Returns Page")
    void getCustomerOrders_Success() {
        when(orderRepository.findByCustomerIdOrderByCreatedAtDesc(eq(1L), any()))
                .thenReturn(new PageImpl<>(List.of(testOrder)));
        var result = orderService.getCustomerOrders(1L, 0, 10);
        assertEquals(1, result.getContent().size());
    }

    // ===== CANCEL ORDER =====

    @Test
    @DisplayName("Cancel PENDING Order - Success")
    void cancelOrder_Pending_Success() {
        when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));
        when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArgument(0));
        var result = orderService.cancelOrder(1L, 1L);
        assertEquals("CANCELLED", result.getOrderStatus());
    }

    @Test
    @DisplayName("Cancel CONFIRMED Order - Success")
    void cancelOrder_Confirmed_Success() {
        testOrder.setOrderStatus(Order.OrderStatus.CONFIRMED);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));
        when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArgument(0));
        var result = orderService.cancelOrder(1L, 1L);
        assertEquals("CANCELLED", result.getOrderStatus());
    }

    @Test
    @DisplayName("Cancel SHIPPED Order - Throws")
    void cancelOrder_Shipped_Throws() {
        testOrder.setOrderStatus(Order.OrderStatus.SHIPPED);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));
        OrderStateException ex = assertThrows(OrderStateException.class, () -> orderService.cancelOrder(1L, 1L));
        assertEquals("INVALID_ORDER_STATE", ex.getErrorCode());
    }

    @Test
    @DisplayName("Cancel Order - Wrong Customer")
    void cancelOrder_WrongCustomer_Throws() {
        when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));
        assertThrows(ResourceNotFoundException.class, () -> orderService.cancelOrder(1L, 99L));
    }

    // ===== STATUS TRANSITIONS =====

    @Test
    @DisplayName("PENDING to CONFIRMED")
    void updateStatus_PendingToConfirmed() {
        when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));
        when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArgument(0));
        assertEquals("CONFIRMED", orderService.updateOrderStatus(1L, "CONFIRMED").getOrderStatus());
    }

    @Test
    @DisplayName("Invalid: DELIVERED to PENDING")
    void updateStatus_InvalidTransition_Throws() {
        testOrder.setOrderStatus(Order.OrderStatus.DELIVERED);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));
        assertThrows(OrderStateException.class, () -> orderService.updateOrderStatus(1L, "PENDING"));
    }

    @Test
    @DisplayName("PROCESSING to SHIPPED")
    void updateStatus_ProcessingToShipped() {
        testOrder.setOrderStatus(Order.OrderStatus.PROCESSING);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));
        when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArgument(0));
        assertEquals("SHIPPED", orderService.updateOrderStatus(1L, "SHIPPED").getOrderStatus());
    }

    @Test
    @DisplayName("SHIPPED to OUT_FOR_DELIVERY")
    void updateStatus_ShippedToOutForDelivery() {
        testOrder.setOrderStatus(Order.OrderStatus.SHIPPED);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));
        when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArgument(0));
        assertEquals("OUT_FOR_DELIVERY", orderService.updateOrderStatus(1L, "OUT_FOR_DELIVERY").getOrderStatus());
    }

    @Test
    @DisplayName("OUT_FOR_DELIVERY to DELIVERED")
    void updateStatus_OutForDeliveryToDelivered() {
        testOrder.setOrderStatus(Order.OrderStatus.OUT_FOR_DELIVERY);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));
        when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArgument(0));
        assertEquals("DELIVERED", orderService.updateOrderStatus(1L, "DELIVERED").getOrderStatus());
    }
}
