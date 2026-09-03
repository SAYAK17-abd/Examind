package com.examind.backend.analytics.controller;

import com.examind.backend.analytics.dto.ExamAnalyticsResponse;
import com.examind.backend.analytics.dto.QuestionAnalysisResponse;
import com.examind.backend.analytics.dto.StudentPerformanceResponse;
import com.examind.backend.analytics.service.AnalyticsService;
import com.examind.backend.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/teacher")
@PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
@Tag(name = "Teacher - Analytics Dashboard", description = "Performance analytics, question-level analysis, and student trend insights")
@SecurityRequirement(name = "BearerAuth")
public class TeacherAnalyticsController {

    private final AnalyticsService analyticsService;

    public TeacherAnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/exams/{id}/analytics")
    @Operation(summary = "Get exam analytics dashboard", description = "Provides averages, highest/lowest/median marks, grade distribution, and AI review stats")
    public ResponseEntity<ApiResponse<ExamAnalyticsResponse>> getExamAnalytics(@PathVariable Long id) {
        ExamAnalyticsResponse response = analyticsService.getExamAnalytics(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/exams/{id}/question-analysis")
    @Operation(summary = "Get question-wise performance", description = "Breaks down performance, success rate, and difficulty per question in the exam")
    public ResponseEntity<ApiResponse<List<QuestionAnalysisResponse>>> getQuestionAnalysis(@PathVariable Long id) {
        List<QuestionAnalysisResponse> response = analyticsService.getQuestionAnalysis(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/students/{id}/performance")
    @Operation(summary = "Get student cumulative performance", description = "Provides total exams taken, overall grade, and historical average percentage")
    public ResponseEntity<ApiResponse<StudentPerformanceResponse>> getStudentPerformance(@PathVariable Long id) {
        StudentPerformanceResponse response = analyticsService.getStudentPerformance(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
