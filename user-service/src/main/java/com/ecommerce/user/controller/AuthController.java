package com.ecommerce.user.controller;

import com.ecommerce.user.dto.ApiResponse;
import com.ecommerce.user.dto.UserDTO;
import com.ecommerce.user.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<UserDTO.AuthResponse>> register(
            @Valid @RequestBody UserDTO.RegisterRequest request) {
        UserDTO.AuthResponse response = userService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Registration successful", response));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<UserDTO.AuthResponse>> login(
            @Valid @RequestBody UserDTO.LoginRequest request) {
        UserDTO.AuthResponse response = userService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }
}
