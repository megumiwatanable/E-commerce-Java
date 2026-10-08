package com.ecommerce.notification.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Setter
@Getter
public class NotificationDTO {
    private Long id;
    private Long customerId;
    private String type;
    private String title;
    private String message;
    private Boolean readStatus;
    private LocalDateTime createdAt;

}
