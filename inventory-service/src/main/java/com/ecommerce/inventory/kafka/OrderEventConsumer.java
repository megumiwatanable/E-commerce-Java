package com.ecommerce.inventory.kafka;

import com.ecommerce.inventory.service.InventoryService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class OrderEventConsumer {

    private static final Logger logger = LoggerFactory.getLogger(OrderEventConsumer.class);

    private final InventoryService inventoryService;
    private final InventoryEventProducer eventProducer;
    private final ObjectMapper objectMapper;

    public OrderEventConsumer(InventoryService inventoryService, InventoryEventProducer eventProducer,
                              ObjectMapper objectMapper) {
        this.inventoryService = inventoryService;
        this.eventProducer = eventProducer;
        this.objectMapper = objectMapper;
    }

    @KafkaListener(topics = "order-events", groupId = "inventory-service-group")
    public void handleOrderEvent(String message) {
        try {
            JsonNode event = objectMapper.readTree(message);
            String eventType = event.get("eventType").asText();

            logger.info("Received order event: {} for order: {}", eventType,
                    event.has("orderId") ? event.get("orderId").asText() : "unknown");

            switch (eventType) {
                case "ORDER_CREATED" -> handleOrderCreated(event);
                case "ORDER_PAID" -> handleOrderPaid(event);
                case "ORDER_CANCELLED" -> handleOrderCancelled(event);
                default -> logger.info("Ignoring event type: {}", eventType);
            }
        } catch (Exception e) {
            logger.error("Error processing order event: {}", e.getMessage(), e);
        }
    }

    private void handleOrderPaid(JsonNode event) {
        Long orderId = event.get("orderId").asLong();
        Long productId = event.get("productId").asLong();
        Integer quantity = event.get("quantity").asInt();

        try {
            inventoryService.deductInventory(productId, quantity);
            logger.info("Reserved inventory deducted successfully for paid order: {}", orderId);
        } catch (Exception e) {
            logger.error("Failed to deduct inventory for paid order: {} - {}", orderId, e.getMessage(), e);
        }
    }

    private void handleOrderCreated(JsonNode event) {
        Long orderId = event.get("orderId").asLong();
        Long productId = event.get("productId").asLong();
        Integer quantity = event.get("quantity").asInt();
        Long customerId = event.hasNonNull("customerId") ? event.get("customerId").asLong() : null;

        try {
            inventoryService.reserveInventory(productId, quantity);
            eventProducer.publishInventoryReservedEvent(orderId, productId, quantity, customerId);
            logger.info("Inventory reserved successfully for order: {}", orderId);
        } catch (Exception e) {
            logger.error("Failed to reserve inventory for order: {} - {}", orderId, e.getMessage());
            eventProducer.publishInventoryReleasedEvent(orderId, productId, quantity);
        }
    }

    private void handleOrderCancelled(JsonNode event) {
        Long orderId = event.get("orderId").asLong();
        Long productId = event.get("productId").asLong();
        Integer quantity = event.get("quantity").asInt();

        try {
            inventoryService.releaseInventory(productId, quantity);
            eventProducer.publishInventoryReleasedEvent(orderId, productId, quantity);
            logger.info("Inventory released successfully for order: {}", orderId);
        } catch (Exception e) {
            logger.error("Failed to release inventory for order: {} - {}", orderId, e.getMessage());
        }
    }
}
