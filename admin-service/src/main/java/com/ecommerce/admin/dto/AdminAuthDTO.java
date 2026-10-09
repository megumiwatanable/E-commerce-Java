package com.ecommerce.admin.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public final class AdminAuthDTO {

    private AdminAuthDTO() {}

    public static class LoginRequest {
        @NotBlank
        @Email
        private String email;

        @NotBlank
        private String password;

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    public record LoginResponse(
            String token,
            String type,
            Long adminId,
            String email,
            String name
    ) {}

    public record ApiResponse<T>(boolean success, String message, T data) {
        public static <T> ApiResponse<T> success(String message, T data) {
            return new ApiResponse<>(true, message, data);
        }

        public static <T> ApiResponse<T> failure(String message) {
            return new ApiResponse<>(false, message, null);
        }
    }
}
