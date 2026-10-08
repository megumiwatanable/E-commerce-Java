package com.ecommerce.product.dto;

import jakarta.validation.constraints.*;
import java.time.LocalDateTime;

public class CategoryDTO {

    private Long id;
    private String name;
    private String description;
    private String status;
    private LocalDateTime createdAt;

    public static class CreateRequest {
        @NotBlank(message = "Category name is required")
        @Size(max = 100)
        private String name;

        @Size(max = 500)
        private String description;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
