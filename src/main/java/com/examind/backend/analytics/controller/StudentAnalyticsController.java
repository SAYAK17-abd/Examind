package com.examind.backend.analytics.controller;

import com.examind.backend.analytics.dto.StudentPerformanceResponse;
import com.examind.backend.analytics.service.AnalyticsService;
import com.examind.backend.common.response.ApiResponse;
import com.examind.backend.common.util.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/student")
@PreAuthorize("hasAnyRole('STUDENT', 'ADMIN')")
@Tag(name = "Student - Performance & Insights", description = "Personalized student academic performance, topic mastery, and revision insights")
@SecurityRequirement(name = "BearerAuth")
public class StudentAnalyticsController {

    private final AnalyticsService analyticsService;

    public StudentAnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/performance")
    @Operation(summary = "Get own cumulative performance", description = "Retrieves student's own performance statistics, strong and weak topics, and AI study recommendations")
    public ResponseEntity<ApiResponse<StudentPerformanceResponse>> getMyPerformance() {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        StudentPerformanceResponse response = analyticsService.getStudentPerformance(currentUserId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/insights")
    @Operation(summary = "Alias for student performance insights", description = "Retrieves topic mastery and recommended revision focus")
    public ResponseEntity<ApiResponse<StudentPerformanceResponse>> getMyInsights() {
        return getMyPerformance();
    }
}

