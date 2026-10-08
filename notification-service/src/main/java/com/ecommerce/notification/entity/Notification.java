package com.ecommerce.notification.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Entity
@Table(name = "notifications")
public class Notification {

    @Setter
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Setter
    @Column(name = "customer_id", nullable = false)
    private Long customerId;

    
    @Setter
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private NotificationType type;

    @Setter
    @Column(nullable = false, length = 200)
    private String title;

    @Setter
    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Setter
    @Column(name = "read_status", nullable = false)
    private Boolean readStatus = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public enum NotificationType {
        ORDER_CREATED, ORDER_CONFIRMED, ORDER_PROCESSING, ORDER_SHIPPED,
        ORDER_OUT_FOR_DELIVERY, ORDER_DELIVERED, ORDER_CANCELLED,
        PAYMENT_SUCCESS, PAYMENT_FAILED, PAYMENT_REFUNDED
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public Notification() {}

    public Notification(Long customerId, NotificationType type, String title, String message) {
        this.customerId = customerId;
        this.type = type;
        this.title = title;
        this.message = message;
    }
}
