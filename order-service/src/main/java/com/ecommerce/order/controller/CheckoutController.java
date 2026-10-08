package com.ecommerce.order.controller;

import com.ecommerce.order.dto.ApiResponse;
import com.ecommerce.order.dto.CheckoutDTO;
import com.ecommerce.order.service.CheckoutService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/checkout")
public class CheckoutController {

    private final CheckoutService checkoutService;

    public CheckoutController(CheckoutService checkoutService) {
        this.checkoutService = checkoutService;
    }

    @PostMapping("/place-order")
    public ResponseEntity<ApiResponse<CheckoutDTO.PlaceOrderResponse>> placeOrder(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @Valid @RequestBody CheckoutDTO.PlaceOrderRequest request) {
        Long customerId = userId == null ? null : Long.parseLong(userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(
                "Order placed successfully", checkoutService.placeOrder(customerId, request)));
    }
}
