package com.ecommerce.notification.service;

import com.ecommerce.notification.dto.NotificationDTO;
import com.ecommerce.notification.entity.Notification;
import com.ecommerce.notification.exception.ResourceNotFoundException;
import com.ecommerce.notification.repository.NotificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {

    private static final Logger logger = LoggerFactory.getLogger(NotificationService.class);

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    public Page<NotificationDTO> getCustomerNotifications(Long customerId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return notificationRepository.findByCustomerIdOrderByCreatedAtDesc(customerId, pageable)
                .map(this::mapToDTO);
    }

    public long getUnreadCount(Long customerId) {
        return notificationRepository.countByCustomerIdAndReadStatus(customerId, false);
    }

    public NotificationDTO markAsRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
        notification.setReadStatus(true);
        notification = notificationRepository.save(notification);
        return mapToDTO(notification);
    }

    public void markAllAsRead(Long customerId) {
        Page<Notification> unreadNotifications = notificationRepository
                .findByCustomerIdOrderByCreatedAtDesc(customerId, PageRequest.of(0, 100));

        unreadNotifications.getContent().forEach(n -> n.setReadStatus(true));
        notificationRepository.saveAll(unreadNotifications.getContent());
        logger.info("All notifications marked as read for customer: {}", customerId);
    }

    public void createNotification(Long customerId, Notification.NotificationType type,
                                    String title, String message) {
        Notification notification = new Notification(customerId, type, title, message);
        notificationRepository.save(notification);
        logger.info("Notification created for customer: {} - Type: {} - Title: {}",
                customerId, type, title);
    }

    private NotificationDTO mapToDTO(Notification notification) {
        NotificationDTO dto = new NotificationDTO();
        dto.setId(notification.getId());
        dto.setCustomerId(notification.getCustomerId());
        dto.setType(notification.getType().name());
        dto.setTitle(notification.getTitle());
        dto.setMessage(notification.getMessage());
        dto.setReadStatus(notification.getReadStatus());
        dto.setCreatedAt(notification.getCreatedAt());
        return dto;
    }
}
