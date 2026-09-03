package com.examind.backend.notification.service;

import com.examind.backend.common.exception.ForbiddenException;
import com.examind.backend.common.exception.ResourceNotFoundException;
import com.examind.backend.common.response.PagedResponse;
import com.examind.backend.common.util.SecurityUtils;
import com.examind.backend.notification.dto.NotificationResponse;
import com.examind.backend.notification.entity.Notification;
import com.examind.backend.notification.entity.NotificationType;
import com.examind.backend.notification.repository.NotificationRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @Transactional
    public Notification createNotification(Long userId, String title, String message, NotificationType type) {
        Notification notification = new Notification(userId, title, message, type);
        return notificationRepository.save(notification);
    }

    @Transactional(readOnly = true)
    public PagedResponse<NotificationResponse> getMyNotifications(Pageable pageable) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        Page<Notification> page = notificationRepository.findByUserIdOrderByCreatedAtDesc(currentUserId, pageable);
        return PagedResponse.from(page.map(NotificationResponse::fromEntity));
    }

    @Transactional(readOnly = true)
    public long getUnreadCount() {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        return notificationRepository.countByUserIdAndIsReadFalse(currentUserId);
    }

    @Transactional
    public void markAsRead(Long id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", "id", id));

        if (!notification.getUserId().equals(SecurityUtils.getCurrentUserId()) && !SecurityUtils.isAdmin()) {
            throw new ForbiddenException("Cannot access notifications belonging to other users");
        }

        notification.setIsRead(true);
        notificationRepository.save(notification);
    }

    @Transactional
    public void markAllAsRead() {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        notificationRepository.markAllAsReadForUser(currentUserId);
    }
}
