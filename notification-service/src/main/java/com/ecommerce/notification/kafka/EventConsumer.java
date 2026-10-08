package com.ecommerce.notification.kafka;

import com.ecommerce.notification.entity.Notification;
import com.ecommerce.notification.service.NotificationService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class EventConsumer {

    private static final Logger logger = LoggerFactory.getLogger(EventConsumer.class);

    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;

    public EventConsumer(NotificationService notificationService, ObjectMapper objectMapper) {
        this.notificationService = notificationService;
        this.objectMapper = objectMapper;
    }

    @KafkaListener(topics = {"order-events", "payment-events", "inventory-events"}, groupId = "notification-service-group")
    public void handleEvent(String message) {
        try {
            JsonNode event = objectMapper.readTree(message);
            String eventType = event.get("eventType").asText();
            Long customerId = event.hasNonNull("customerId") ? event.get("customerId").asLong() : null;

            if (customerId == null) {
                logger.warn("No customerId in event: {}", eventType);
                return;
            }

            logger.info("Processing event: {} for customer: {}", eventType, customerId);

            switch (eventType) {
                case "ORDER_CREATED" -> handleOrderCreated(event, customerId);
                case "ORDER_CONFIRMED" -> handleOrderConfirmed(event, customerId);
                case "ORDER_SHIPPED" -> handleOrderShipped(event, customerId);
                case "ORDER_OUT_FOR_DELIVERY" -> handleOrderOutForDelivery(event, customerId);
                case "ORDER_DELIVERED" -> handleOrderDelivered(event, customerId);
                case "ORDER_CANCELLED" -> handleOrderCancelled(event, customerId);
                case "PAYMENT_COMPLETED" -> handlePaymentCompleted(event, customerId);
                case "PAYMENT_FAILED" -> handlePaymentFailed(event, customerId);
                case "INVENTORY_RESERVED" -> logger.debug("Inventory reserved notification skipped for customer: {}", customerId);
                case "INVENTORY_RELEASED" -> logger.debug("Inventory released notification skipped for customer: {}", customerId);
                default -> logger.info("Ignoring event type: {}", eventType);
            }
        } catch (Exception e) {
            logger.error("Error processing event: {}", e.getMessage(), e);
        }
    }

    private void handleOrderCreated(JsonNode event, Long customerId) {
        String orderNumber = event.has("orderNumber") ? event.get("orderNumber").asText() : "N/A";
        notificationService.createNotification(customerId,
                Notification.NotificationType.ORDER_CREATED,
                "Order Placed Successfully",
                "Your order " + orderNumber + " has been placed and is being processed.");
    }

    private void handleOrderConfirmed(JsonNode event, Long customerId) {
        String orderNumber = event.has("orderNumber") ? event.get("orderNumber").asText() : "N/A";
        notificationService.createNotification(customerId,
                Notification.NotificationType.ORDER_CONFIRMED,
                "Order Confirmed",
                "Your order " + orderNumber + " has been confirmed and will be processed shortly.");
    }

    private void handleOrderShipped(JsonNode event, Long customerId) {
        String orderNumber = event.has("orderNumber") ? event.get("orderNumber").asText() : "N/A";
        notificationService.createNotification(customerId,
                Notification.NotificationType.ORDER_SHIPPED,
                "Order Shipped",
                "Your order " + orderNumber + " has been shipped and is on its way to you!");
    }

    private void handleOrderOutForDelivery(JsonNode event, Long customerId) {
        String orderNumber = event.has("orderNumber") ? event.get("orderNumber").asText() : "N/A";
        notificationService.createNotification(customerId,
                Notification.NotificationType.ORDER_OUT_FOR_DELIVERY,
                "Out for Delivery",
                "Your order " + orderNumber + " is out for delivery today!");
    }

    private void handleOrderDelivered(JsonNode event, Long customerId) {
        String orderNumber = event.has("orderNumber") ? event.get("orderNumber").asText() : "N/A";
        notificationService.createNotification(customerId,
                Notification.NotificationType.ORDER_DELIVERED,
                "Order Delivered",
                "Your order " + orderNumber + " has been delivered successfully. Thank you for shopping with us!");
    }

    private void handleOrderCancelled(JsonNode event, Long customerId) {
        String orderNumber = event.has("orderNumber") ? event.get("orderNumber").asText() : "N/A";
        notificationService.createNotification(customerId,
                Notification.NotificationType.ORDER_CANCELLED,
                "Order Cancelled",
                "Your order " + orderNumber + " has been cancelled. If you have any questions, please contact support.");
    }

    private void handlePaymentCompleted(JsonNode event, Long customerId) {
        notificationService.createNotification(customerId,
                Notification.NotificationType.PAYMENT_SUCCESS,
                "Payment Successful",
                "Your payment has been processed successfully.");
    }

    private void handlePaymentFailed(JsonNode event, Long customerId) {
        String reason = event.has("failureReason") ? event.get("failureReason").asText() : "Unknown reason";
        notificationService.createNotification(customerId,
                Notification.NotificationType.PAYMENT_FAILED,
                "Payment Failed",
                "Your payment could not be processed. Reason: " + reason + ". Please try again.");
    }
}
