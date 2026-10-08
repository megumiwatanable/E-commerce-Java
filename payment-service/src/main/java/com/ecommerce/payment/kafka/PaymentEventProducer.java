package com.ecommerce.payment.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Component
public class PaymentEventProducer {

    private static final Logger logger = LoggerFactory.getLogger(PaymentEventProducer.class);
    private static final String TOPIC = "payment-events";

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public PaymentEventProducer(KafkaTemplate<String, String> kafkaTemplate, ObjectMapper objectMapper) {
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
    }

    public void publishPaymentCompletedEvent(Long orderId, Long customerId, String paymentReference, java.math.BigDecimal amount) {
        try {
            Map<String, Object> event = new HashMap<>();
            event.put("eventId", UUID.randomUUID().toString());
            event.put("eventType", "PAYMENT_COMPLETED");
            event.put("timestamp", Instant.now().toString());
            event.put("orderId", orderId);
            event.put("customerId", customerId);
            event.put("paymentReference", paymentReference);
            event.put("amount", amount);

            String message = objectMapper.writeValueAsString(event);
            kafkaTemplate.send(TOPIC, orderId.toString(), message);
            logger.info("Published PAYMENT_COMPLETED event for order: {}", orderId);
        } catch (Exception e) {
            logger.error("Failed to publish PAYMENT_COMPLETED event: {}", e.getMessage(), e);
        }
    }

    public void publishPaymentFailedEvent(Long orderId, Long customerId, String paymentReference, String reason) {
        try {
            Map<String, Object> event = new HashMap<>();
            event.put("eventId", UUID.randomUUID().toString());
            event.put("eventType", "PAYMENT_FAILED");
            event.put("timestamp", Instant.now().toString());
            event.put("orderId", orderId);
            event.put("customerId", customerId);
            event.put("paymentReference", paymentReference);
            event.put("failureReason", reason);

            String message = objectMapper.writeValueAsString(event);
            kafkaTemplate.send(TOPIC, orderId.toString(), message);
            logger.info("Published PAYMENT_FAILED event for order: {}", orderId);
        } catch (Exception e) {
            logger.error("Failed to publish PAYMENT_FAILED event: {}", e.getMessage(), e);
        }
    }
}
