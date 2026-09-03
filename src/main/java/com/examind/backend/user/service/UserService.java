package com.examind.backend.user.service;

import com.examind.backend.common.audit.AuditAction;
import com.examind.backend.common.audit.AuditService;
import com.examind.backend.common.exception.ForbiddenException;
import com.examind.backend.common.exception.ResourceNotFoundException;
import com.examind.backend.common.response.PagedResponse;
import com.examind.backend.common.util.SecurityUtils;
import com.examind.backend.user.dto.UpdateProfileRequest;
import com.examind.backend.user.dto.UserProfileResponse;
import com.examind.backend.user.entity.RoleName;
import com.examind.backend.user.entity.User;
import com.examind.backend.user.entity.UserStatus;
import com.examind.backend.user.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final AuditService auditService;

    public UserService(UserRepository userRepository, AuditService auditService) {
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getCurrentUserProfile() {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUserId));
        return UserProfileResponse.fromEntity(user);
    }

    @Transactional
    public UserProfileResponse updateCurrentUserProfile(UpdateProfileRequest request) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUserId));

        user.setFirstName(request.getFirstName().trim());
        user.setLastName(request.getLastName().trim());

        User updatedUser = userRepository.save(user);
        return UserProfileResponse.fromEntity(updatedUser);
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getUserById(Long id) {
        // Enforce access control: Admin can view any, otherwise only self
        if (!SecurityUtils.isAdmin() && !SecurityUtils.isCurrentUser(id)) {
            throw new ForbiddenException("You are not permitted to view other user profiles");
        }

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        return UserProfileResponse.fromEntity(user);
    }

    @Transactional(readOnly = true)
    public PagedResponse<UserProfileResponse> getAllUsers(RoleName roleName, UserStatus status, Pageable pageable) {
        Page<User> page;
        if (roleName != null) {
            page = userRepository.findByRole_Name(roleName, pageable);
        } else if (status != null) {
            page = userRepository.findByStatus(status, pageable);
        } else {
            page = userRepository.findAll(pageable);
        }

        return PagedResponse.from(page.map(UserProfileResponse::fromEntity));
    }

    @Transactional
    public UserProfileResponse updateUserStatus(Long id, UserStatus newStatus, HttpServletRequest servletRequest) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));

        UserStatus oldStatus = user.getStatus();
        user.setStatus(newStatus);
        User updatedUser = userRepository.save(user);

        AuditAction action = (newStatus == UserStatus.BLOCKED) ? AuditAction.USER_BLOCKED : AuditAction.USER_UNBLOCKED;
        auditService.log(SecurityUtils.getCurrentUserId(), action, "USER", String.valueOf(id),
                "Status changed from " + oldStatus + " to " + newStatus, servletRequest);

        return UserProfileResponse.fromEntity(updatedUser);
    }
}
