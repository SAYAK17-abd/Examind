package com.examind.backend.common.util;

import com.examind.backend.auth.security.UserPrincipal;
import com.examind.backend.common.exception.UnauthorizedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public final class SecurityUtils {

    private SecurityUtils() {
    }

    public static UserPrincipal getCurrentUserPrincipal() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || !(authentication.getPrincipal() instanceof UserPrincipal)) {
            throw new UnauthorizedException("User is not authenticated");
        }
        return (UserPrincipal) authentication.getPrincipal();
    }

    public static Long getCurrentUserId() {
        return getCurrentUserPrincipal().getId();
    }

    public static String getCurrentUserEmail() {
        return getCurrentUserPrincipal().getUsername();
    }

    public static boolean isCurrentUser(Long userId) {
        if (userId == null) return false;
        try {
            return getCurrentUserId().equals(userId);
        } catch (UnauthorizedException e) {
            return false;
        }
    }

    public static boolean hasRole(String role) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) return false;
        return authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals(role) || a.getAuthority().equals("ROLE_" + role));
    }

    public static boolean isTeacher() {
        return hasRole("ROLE_TEACHER");
    }

    public static boolean isStudent() {
        return hasRole("ROLE_STUDENT");
    }

    public static boolean isAdmin() {
        return hasRole("ROLE_ADMIN");
    }
}
