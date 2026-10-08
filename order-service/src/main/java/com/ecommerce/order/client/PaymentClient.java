package com.ecommerce.order.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;

import java.math.BigDecimal;

@FeignClient(name = "payment-service-client", url = "${payment-service.url}")
public interface PaymentClient {

    @PostMapping("/api/payments")
    PaymentResponse process(@RequestHeader(value = "X-User-Id", required = false) String userId,
                            @RequestBody PaymentRequest request);

    record PaymentRequest(Long orderId, BigDecimal amount, String paymentMethod) {}

    class PaymentResponse {
        private boolean success;
        private PaymentData data;

        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }
        public PaymentData getData() { return data; }
        public void setData(PaymentData data) { this.data = data; }
    }

    class PaymentData {
        private String paymentReference;
        private String status;

        public String getPaymentReference() { return paymentReference; }
        public void setPaymentReference(String paymentReference) { this.paymentReference = paymentReference; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }
}
