package com.examind.backend.common.audit;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class AuditService {

    private static final Logger log = LoggerFactory.getLogger(AuditService.class);
    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public void log(Long userId, AuditAction action, String entityType, String entityId, String metadata, HttpServletRequest request) {
        String ip = extractClientIp(request);
        logAction(userId, action, entityType, entityId, metadata, ip);
    }

    public void logAction(Long userId, AuditAction action, String entityType, String entityId, String metadata, String ipAddress) {
        try {
            AuditLog auditLog = new AuditLog(userId, action, entityType, entityId, metadata, ipAddress);
            auditLogRepository.save(auditLog);
            log.info("AUDIT: User {} performed {} on {} [{}] - IP: {}", userId, action, entityType, entityId, ipAddress);
        } catch (Exception e) {
            log.error("Failed to save audit log for action: {}", action, e);
        }
    }

    public static String extractClientIp(HttpServletRequest request) {
        if (request == null) {
            return "0.0.0.0";
        }
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isBlank()) {
            return xRealIp.trim();
        }
        return request.getRemoteAddr();
    }
}
