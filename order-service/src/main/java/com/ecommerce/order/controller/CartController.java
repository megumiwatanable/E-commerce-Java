package com.ecommerce.order.controller;

import com.ecommerce.order.dto.ApiResponse;
import com.ecommerce.order.dto.CartDTO;
import com.ecommerce.order.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
public class CartController {

    private final OrderService orderService;

    public CartController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<CartDTO>> getCart(
            @RequestHeader("X-User-Id") String userId) {
        CartDTO cart = orderService.getCart(Long.parseLong(userId));
        return ResponseEntity.ok(ApiResponse.success("Cart retrieved", cart));
    }

    @PostMapping("/items")
    public ResponseEntity<ApiResponse<CartDTO>> addToCart(
            @RequestHeader("X-User-Id") String userId,
            @Valid @RequestBody CartDTO.AddItemRequest request) {
        CartDTO cart = orderService.addToCart(Long.parseLong(userId), request);
        return ResponseEntity.ok(ApiResponse.success("Item added to cart", cart));
    }

    @PutMapping("/items/{productId}")
    public ResponseEntity<ApiResponse<CartDTO>> updateCartItem(
            @RequestHeader("X-User-Id") String userId,
            @PathVariable Long productId,
            @Valid @RequestBody CartDTO.UpdateQuantityRequest request) {
        CartDTO cart = orderService.updateCartItem(Long.parseLong(userId), productId, request);
        return ResponseEntity.ok(ApiResponse.success("Cart updated", cart));
    }

    @DeleteMapping("/items/{productId}")
    public ResponseEntity<ApiResponse<Void>> removeCartItem(
            @RequestHeader("X-User-Id") String userId,
            @PathVariable Long productId) {
        orderService.removeCartItem(Long.parseLong(userId), productId);
        return ResponseEntity.ok(ApiResponse.success("Item removed from cart"));
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<Void>> clearCart(
            @RequestHeader("X-User-Id") String userId) {
        orderService.clearCart(Long.parseLong(userId));
        return ResponseEntity.ok(ApiResponse.success("Cart cleared"));
    }
}
