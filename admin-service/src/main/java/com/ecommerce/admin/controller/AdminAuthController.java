package com.ecommerce.admin.controller;
import com.ecommerce.admin.dto.AdminAuthDTO;
import com.ecommerce.admin.service.AdminAuthService;
import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/admin/auth")
public class AdminAuthController {private final AdminAuthService service;public AdminAuthController(AdminAuthService s){service=s;}@PostMapping("/login") public ResponseEntity<AdminAuthDTO.ApiResponse<AdminAuthDTO.LoginResponse>> login(@Valid @RequestBody AdminAuthDTO.LoginRequest r){return ResponseEntity.ok(AdminAuthDTO.ApiResponse.ok("Admin login successful",service.login(r)));}@ExceptionHandler(IllegalArgumentException.class) ResponseEntity<?> invalid(IllegalArgumentException e){return ResponseEntity.status(401).body(new AdminAuthDTO.ApiResponse<>(false,e.getMessage(),null));}}
