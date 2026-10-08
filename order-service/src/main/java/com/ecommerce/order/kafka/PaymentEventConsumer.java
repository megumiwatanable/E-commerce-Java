package com.ecommerce.order.kafka;

import com.ecommerce.order.entity.Order;
import com.ecommerce.order.repository.OrderRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class PaymentEventConsumer {

    private static final Logger logger = LoggerFactory.getLogger(PaymentEventConsumer.class);

    private final OrderRepository orderRepository;
    private final OrderEventProducer eventProducer;
    private final ObjectMapper objectMapper;

    public PaymentEventConsumer(OrderRepository orderRepository, OrderEventProducer eventProducer,
                                ObjectMapper objectMapper) {
        this.orderRepository = orderRepository;
        this.eventProducer = eventProducer;
        this.objectMapper = objectMapper;
    }

    @KafkaListener(topics = "payment-events", groupId = "order-service-group")
    public void handlePaymentEvent(String message) {
        try {
            JsonNode event = objectMapper.readTree(message);
            String eventType = event.get("eventType").asText();

            logger.info("Received payment event: {}", eventType);

            switch (eventType) {
                case "PAYMENT_COMPLETED" -> handlePaymentCompleted(event);
                case "PAYMENT_FAILED" -> handlePaymentFailed(event);
                default -> logger.info("Ignoring event type: {}", eventType);
            }
        } catch (Exception e) {
            logger.error("Error processing payment event: {}", e.getMessage(), e);
        }
    }

    private void handlePaymentCompleted(JsonNode event) {
        Long orderId = event.get("orderId").asLong();

        orderRepository.findById(orderId).ifPresent(order -> {
            order.setPaymentStatus(Order.PaymentStatus.COMPLETED);
            order.setOrderStatus(Order.OrderStatus.CONFIRMED);
            orderRepository.save(order);
            logger.info("Order {} confirmed after successful payment", order.getOrderNumber());

            // Publish order confirmed event
            eventProducer.publishOrderStatusEvent(order.getId(), order.getOrderNumber(),
                    order.getCustomerId(), "ORDER_CONFIRMED");
        });
    }

    private void handlePaymentFailed(JsonNode event) {
        Long orderId = event.get("orderId").asLong();

        orderRepository.findById(orderId).ifPresent(order -> {
            order.setPaymentStatus(Order.PaymentStatus.FAILED);
            order.setOrderStatus(Order.OrderStatus.FAILED);
            orderRepository.save(order);
            logger.info("Order {} marked as failed after payment failure", order.getOrderNumber());
        });
    }
}
