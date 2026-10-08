package com.ecommerce.inventory.kafka;

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
public class InventoryEventProducer {

    private static final Logger logger = LoggerFactory.getLogger(InventoryEventProducer.class);
    private static final String TOPIC = "inventory-events";

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public InventoryEventProducer(KafkaTemplate<String, String> kafkaTemplate, ObjectMapper objectMapper) {
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
    }

    public void publishInventoryReservedEvent(Long orderId, Long productId, Integer quantity, Long customerId) {
        try {
            Map<String, Object> event = new HashMap<>();
            event.put("eventId", UUID.randomUUID().toString());
            event.put("eventType", "INVENTORY_RESERVED");
            event.put("timestamp", Instant.now().toString());
            event.put("orderId", orderId);
            event.put("productId", productId);
            event.put("quantity", quantity);
            event.put("customerId", customerId);

            String message = objectMapper.writeValueAsString(event);
            kafkaTemplate.send(TOPIC, orderId.toString(), message);
            logger.info("Published INVENTORY_RESERVED event for order: {}", orderId);
        } catch (Exception e) {
            logger.error("Failed to publish INVENTORY_RESERVED event: {}", e.getMessage(), e);
        }
    }

    public void publishInventoryReleasedEvent(Long orderId, Long productId, Integer quantity) {
        try {
            Map<String, Object> event = new HashMap<>();
            event.put("eventId", UUID.randomUUID().toString());
            event.put("eventType", "INVENTORY_RELEASED");
            event.put("timestamp", Instant.now().toString());
            event.put("orderId", orderId);
            event.put("productId", productId);
            event.put("quantity", quantity);

            String message = objectMapper.writeValueAsString(event);
            kafkaTemplate.send(TOPIC, orderId.toString(), message);
            logger.info("Published INVENTORY_RELEASED event for order: {}", orderId);
        } catch (Exception e) {
            logger.error("Failed to publish INVENTORY_RELEASED event: {}", e.getMessage(), e);
        }
    }

    public void publishInventoryDeductedEvent(Long orderId, Long productId, Integer quantity) {
        try {
            Map<String, Object> event = new HashMap<>();
            event.put("eventId", UUID.randomUUID().toString());
            event.put("eventType", "INVENTORY_DEDUCTED");
            event.put("timestamp", Instant.now().toString());
            event.put("orderId", orderId);
            event.put("productId", productId);
            event.put("quantity", quantity);

            String message = objectMapper.writeValueAsString(event);
            kafkaTemplate.send(TOPIC, orderId.toString(), message);
            logger.info("Published INVENTORY_DEDUCTED event for order: {}", orderId);
        } catch (Exception e) {
            logger.error("Failed to publish INVENTORY_DEDUCTED event: {}", e.getMessage(), e);
        }
    }
}
