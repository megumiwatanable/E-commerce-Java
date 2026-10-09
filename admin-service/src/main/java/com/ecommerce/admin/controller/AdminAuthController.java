package com.ecommerce.admin.controller;

import com.ecommerce.admin.dto.AdminAuthDTO;
import com.ecommerce.admin.service.AdminAuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/auth")
public class AdminAuthController {

    private final AdminAuthService authService;

    public AdminAuthController(AdminAuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<AdminAuthDTO.ApiResponse<AdminAuthDTO.LoginResponse>> login(
            @Valid @RequestBody AdminAuthDTO.LoginRequest request
    ) {
        return ResponseEntity.ok(AdminAuthDTO.ApiResponse.success(
                "Admin login successful",
                authService.login(request)
        ));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<AdminAuthDTO.ApiResponse<Void>> handleInvalidCredentials(
            IllegalArgumentException exception
    ) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(AdminAuthDTO.ApiResponse.failure(exception.getMessage()));
    }
}
