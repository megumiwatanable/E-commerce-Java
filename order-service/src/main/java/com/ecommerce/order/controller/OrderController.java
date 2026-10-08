package com.ecommerce.order.controller;

import com.ecommerce.order.dto.ApiResponse;
import com.ecommerce.order.dto.OrderDTO;
import com.ecommerce.order.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<OrderDTO>> createOrder(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @Valid @RequestBody OrderDTO.CreateOrderRequest request) {
        Long customerId = userId == null ? null : Long.parseLong(userId);
        OrderDTO order = orderService.createOrder(customerId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Order created successfully", order));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OrderDTO>> getOrderById(@PathVariable Long id) {
        OrderDTO order = orderService.getOrderById(id);
        return ResponseEntity.ok(ApiResponse.success("Order retrieved", order));
    }

    @GetMapping("/number/{orderNumber}")
    public ResponseEntity<ApiResponse<OrderDTO>> getOrderByNumber(@PathVariable String orderNumber) {
        OrderDTO order = orderService.getOrderByNumber(orderNumber);
        return ResponseEntity.ok(ApiResponse.success("Order retrieved", order));
    }

    @GetMapping("/guest/{checkoutToken}")
    public ResponseEntity<ApiResponse<OrderDTO>> getGuestOrder(@PathVariable String checkoutToken) {
        return ResponseEntity.ok(ApiResponse.success("Order retrieved",
                orderService.getGuestOrder(checkoutToken)));
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<ApiResponse<Page<OrderDTO>>> getCustomerOrders(
            @PathVariable Long customerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<OrderDTO> orders = orderService.getCustomerOrders(customerId, page, size);
        return ResponseEntity.ok(ApiResponse.success("Orders retrieved", orders));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<OrderDTO>>> getAllOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status) {
        Page<OrderDTO> orders;
        if (status != null && !status.isEmpty()) {
            orders = orderService.getOrdersByStatus(status, page, size);
        } else {
            orders = orderService.getAllOrders(page, size);
        }
        return ResponseEntity.ok(ApiResponse.success("Orders retrieved", orders));
    }

    @GetMapping("/{id}/items")
    public ResponseEntity<ApiResponse<List<OrderDTO.OrderItemDTO>>> getOrderItems(@PathVariable Long id) {
        List<OrderDTO.OrderItemDTO> items = orderService.getOrderItems(id);
        return ResponseEntity.ok(ApiResponse.success("Order items retrieved", items));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<OrderDTO>> cancelOrder(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") String userId) {
        OrderDTO order = orderService.cancelOrder(id, Long.parseLong(userId));
        return ResponseEntity.ok(ApiResponse.success("Order cancelled", order));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<OrderDTO>> updateOrderStatus(
            @PathVariable Long id,
            @RequestBody OrderDTO.UpdateStatusRequest request) {
        OrderDTO order = orderService.updateOrderStatus(id, request.getOrderStatus());
        return ResponseEntity.ok(ApiResponse.success("Order status updated", order));
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboardStats() {
        Map<String, Object> stats = orderService.getDashboardStats();
        return ResponseEntity.ok(ApiResponse.success("Stats retrieved", stats));
    }
}
