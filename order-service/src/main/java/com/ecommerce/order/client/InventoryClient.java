package com.ecommerce.order.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "inventory-service-client", url = "${inventory-service.url}")
public interface InventoryClient {

    @GetMapping("/api/inventory/{productId}")
    InventoryResponse getInventory(@PathVariable("productId") Long productId);

    @PostMapping("/api/inventory/reserve")
    void reserve(@RequestBody StockRequest request);

    @PostMapping("/api/inventory/release")
    void release(@RequestBody StockRequest request);

    @PostMapping("/api/inventory/deduct")
    void deduct(@RequestBody StockRequest request);

    record StockRequest(Long productId, Integer quantity) {}

    class InventoryResponse {
        private boolean success;
        private InventoryData data;
        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }
        public InventoryData getData() { return data; }
        public void setData(InventoryData data) { this.data = data; }
    }

    class InventoryData {
        private Integer availableQuantity;
        private String stockStatus;
        public Integer getAvailableQuantity() { return availableQuantity; }
        public void setAvailableQuantity(Integer availableQuantity) { this.availableQuantity = availableQuantity; }
        public String getStockStatus() { return stockStatus; }
        public void setStockStatus(String stockStatus) { this.stockStatus = stockStatus; }
    }
}
