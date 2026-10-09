package com.ecommerce.inventory.dto;

import jakarta.validation.constraints.*;
import java.time.LocalDateTime;

public class InventoryDTO {

    private Long id;
    private Long productId;
    private String sourceCode;
    private String sku;
    private Integer availableQuantity;
    private Integer reservedQuantity;
    private Integer reorderLevel;
    private String warehouseLocation;
    private String stockStatus;
    private LocalDateTime updatedAt;

    public static class CreateRequest {
        @NotNull(message = "Product ID is required")
        private Long productId;

        @NotBlank(message = "Source code is required")
        private String sourceCode = "MAIN";

        @NotBlank(message = "SKU is required")
        private String sku;

        @NotNull(message = "Available quantity is required")
        @Min(value = 0, message = "Available quantity cannot be negative")
        private Integer availableQuantity;

        @Min(value = 0, message = "Reorder level cannot be negative")
        private Integer reorderLevel = 10;

        private String warehouseLocation;

        public Long getProductId() { return productId; }
        public void setProductId(Long productId) { this.productId = productId; }
        public String getSourceCode() { return sourceCode; }
        public void setSourceCode(String sourceCode) { this.sourceCode = sourceCode; }
        public String getSku() { return sku; }
        public void setSku(String sku) { this.sku = sku; }
        public Integer getAvailableQuantity() { return availableQuantity; }
        public void setAvailableQuantity(Integer availableQuantity) { this.availableQuantity = availableQuantity; }
        public Integer getReorderLevel() { return reorderLevel; }
        public void setReorderLevel(Integer reorderLevel) { this.reorderLevel = reorderLevel; }
        public String getWarehouseLocation() { return warehouseLocation; }
        public void setWarehouseLocation(String warehouseLocation) { this.warehouseLocation = warehouseLocation; }
    }

    public static class ReserveRequest {
        @NotNull(message = "Product ID is required")
        private Long productId;

        @NotNull(message = "Quantity is required")
        @Min(value = 1, message = "Quantity must be at least 1")
        private Integer quantity;

        public Long getProductId() { return productId; }
        public void setProductId(Long productId) { this.productId = productId; }
        public Integer getQuantity() { return quantity; }
        public void setQuantity(Integer quantity) { this.quantity = quantity; }
    }

    public static class UpdateRequest {
        @Min(value = 0)
        private Integer availableQuantity;

        @Min(value = 0)
        private Integer reorderLevel;

        private String warehouseLocation;

        public Integer getAvailableQuantity() { return availableQuantity; }
        public void setAvailableQuantity(Integer availableQuantity) { this.availableQuantity = availableQuantity; }
        public Integer getReorderLevel() { return reorderLevel; }
        public void setReorderLevel(Integer reorderLevel) { this.reorderLevel = reorderLevel; }
        public String getWarehouseLocation() { return warehouseLocation; }
        public void setWarehouseLocation(String warehouseLocation) { this.warehouseLocation = warehouseLocation; }
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }
    public String getSourceCode() { return sourceCode; }
    public void setSourceCode(String sourceCode) { this.sourceCode = sourceCode; }
    public String getSku() { return sku; }
    public void setSku(String sku) { this.sku = sku; }
    public Integer getAvailableQuantity() { return availableQuantity; }
    public void setAvailableQuantity(Integer availableQuantity) { this.availableQuantity = availableQuantity; }
    public Integer getReservedQuantity() { return reservedQuantity; }
    public void setReservedQuantity(Integer reservedQuantity) { this.reservedQuantity = reservedQuantity; }
    public Integer getReorderLevel() { return reorderLevel; }
    public void setReorderLevel(Integer reorderLevel) { this.reorderLevel = reorderLevel; }
    public String getWarehouseLocation() { return warehouseLocation; }
    public void setWarehouseLocation(String warehouseLocation) { this.warehouseLocation = warehouseLocation; }
    public String getStockStatus() { return stockStatus; }
    public void setStockStatus(String stockStatus) { this.stockStatus = stockStatus; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
