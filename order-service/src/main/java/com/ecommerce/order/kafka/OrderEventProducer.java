package com.ecommerce.order.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Component
public class OrderEventProducer {

    private static final Logger logger = LoggerFactory.getLogger(OrderEventProducer.class);
    private static final String TOPIC = "order-events";

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public OrderEventProducer(KafkaTemplate<String, String> kafkaTemplate, ObjectMapper objectMapper) {
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
    }

    public void publishOrderCreatedEvent(Long orderId, String orderNumber, Long customerId,
                                          Long productId, Integer quantity, BigDecimal finalAmount) {
        try {
            Map<String, Object> event = new HashMap<>();
            event.put("eventId", UUID.randomUUID().toString());
            event.put("eventType", "ORDER_CREATED");
            event.put("timestamp", Instant.now().toString());
            event.put("orderId", orderId);
            event.put("orderNumber", orderNumber);
            event.put("customerId", customerId);
            event.put("productId", productId);
            event.put("quantity", quantity);
            event.put("finalAmount", finalAmount);

            String message = objectMapper.writeValueAsString(event);
            kafkaTemplate.send(TOPIC, orderId.toString(), message);
            logger.info("Published ORDER_CREATED event for order: {}", orderNumber);
        } catch (Exception e) {
            logger.error("Failed to publish ORDER_CREATED event: {}", e.getMessage(), e);
        }
    }

    public void publishOrderCancelledEvent(Long orderId, String orderNumber, Long customerId,
                                            Long productId, Integer quantity) {
        try {
            Map<String, Object> event = new HashMap<>();
            event.put("eventId", UUID.randomUUID().toString());
            event.put("eventType", "ORDER_CANCELLED");
            event.put("timestamp", Instant.now().toString());
            event.put("orderId", orderId);
            event.put("orderNumber", orderNumber);
            event.put("customerId", customerId);
            event.put("productId", productId);
            event.put("quantity", quantity);

            String message = objectMapper.writeValueAsString(event);
            kafkaTemplate.send(TOPIC, orderId.toString(), message);
            logger.info("Published ORDER_CANCELLED event for order: {}", orderNumber);
        } catch (Exception e) {
            logger.error("Failed to publish ORDER_CANCELLED event: {}", e.getMessage(), e);
        }
    }

    public void publishOrderPaidEvent(Long orderId, String orderNumber, Long customerId,
                                      Long productId, Integer quantity) {
        publishInventoryEvent(orderId, orderNumber, customerId, productId, quantity, "ORDER_PAID");
    }

    private void publishInventoryEvent(Long orderId, String orderNumber, Long customerId,
                                       Long productId, Integer quantity, String eventType) {
        try {
            Map<String, Object> event = new HashMap<>();
            event.put("eventId", UUID.randomUUID().toString());
            event.put("eventType", eventType);
            event.put("timestamp", Instant.now().toString());
            event.put("orderId", orderId);
            event.put("orderNumber", orderNumber);
            event.put("customerId", customerId);
            event.put("productId", productId);
            event.put("quantity", quantity);

            String message = objectMapper.writeValueAsString(event);
            kafkaTemplate.send(TOPIC, orderId.toString(), message);
            logger.info("Published {} event for order: {}", eventType, orderNumber);
        } catch (Exception e) {
            logger.error("Failed to publish {} event: {}", eventType, e.getMessage(), e);
        }
    }

    public void publishOrderStatusEvent(Long orderId, String orderNumber, Long customerId,
                                         String eventType) {
        try {
            Map<String, Object> event = new HashMap<>();
            event.put("eventId", UUID.randomUUID().toString());
            event.put("eventType", eventType);
            event.put("timestamp", Instant.now().toString());
            event.put("orderId", orderId);
            event.put("orderNumber", orderNumber);
            event.put("customerId", customerId);

            String message = objectMapper.writeValueAsString(event);
            kafkaTemplate.send(TOPIC, orderId.toString(), message);
            logger.info("Published {} event for order: {}", eventType, orderNumber);
        } catch (Exception e) {
            logger.error("Failed to publish {} event: {}", eventType, e.getMessage(), e);
        }
    }
}
