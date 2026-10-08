package com.ecommerce.order.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.math.BigDecimal;

@FeignClient(name = "product-service-client", url = "${product-service.url}")
public interface ProductClient {

    @GetMapping("/api/products/{id}")
    ProductResponse getProduct(@PathVariable("id") Long id);

    class ProductResponse {
        private boolean success;
        private ProductData data;

        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }
        public ProductData getData() { return data; }
        public void setData(ProductData data) { this.data = data; }
    }

    class ProductData {
        private Long id;
        private String name;
        private String sku;
        private BigDecimal finalPrice;
        private String imageUrl;
        private String status;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getSku() { return sku; }
        public void setSku(String sku) { this.sku = sku; }
        public BigDecimal getFinalPrice() { return finalPrice; }
        public void setFinalPrice(BigDecimal finalPrice) { this.finalPrice = finalPrice; }
        public String getImageUrl() { return imageUrl; }
        public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }
}
