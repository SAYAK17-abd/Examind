package com.examind.backend.user.controller;

import com.examind.backend.common.response.ApiResponse;
import com.examind.backend.common.response.PagedResponse;
import com.examind.backend.user.dto.UserProfileResponse;
import com.examind.backend.user.dto.UserStatusUpdateRequest;
import com.examind.backend.user.entity.RoleName;
import com.examind.backend.user.entity.UserStatus;
import com.examind.backend.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin - User Management", description = "Administrative endpoints for platform user management and moderation")
@SecurityRequirement(name = "BearerAuth")
public class AdminUserController {

    private final UserService userService;

    public AdminUserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    @Operation(summary = "List all platform users", description = "Paginated listing of users with optional role and status filters")
    public ResponseEntity<ApiResponse<PagedResponse<UserProfileResponse>>> getAllUsers(
            @RequestParam(required = false) RoleName role,
            @RequestParam(required = false) UserStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "id,desc") String[] sort) {

        Sort sortOrder = Sort.by(Sort.Direction.DESC, "id");
        if (sort != null && sort.length > 0 && sort[0].contains(",")) {
            String[] parts = sort[0].split(",");
            sortOrder = Sort.by(Sort.Direction.fromString(parts[1]), parts[0]);
        }
        Pageable pageable = PageRequest.of(page, size, sortOrder);

        PagedResponse<UserProfileResponse> response = userService.getAllUsers(role, status, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Update user status", description = "Block or activate a user account")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateUserStatus(
            @PathVariable Long id,
            @Valid @RequestBody UserStatusUpdateRequest request,
            HttpServletRequest servletRequest) {

        UserProfileResponse response = userService.updateUserStatus(id, request.getStatus(), servletRequest);
        return ResponseEntity.ok(ApiResponse.success(response, "User status updated to " + request.getStatus()));
    }
}
