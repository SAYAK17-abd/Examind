package com.examind.backend.evaluation.controller;

import com.examind.backend.common.response.ApiResponse;
import com.examind.backend.evaluation.dto.EvaluationResponse;
import com.examind.backend.evaluation.dto.EvaluationVersionResponse;
import com.examind.backend.evaluation.dto.TeacherOverrideRequest;
import com.examind.backend.evaluation.service.EvaluationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/teacher/evaluations")
@PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
@Tag(name = "Teacher - Evaluation Review & Override", description = "Human-in-the-loop review, approval, and versioned override of AI evaluations")
@SecurityRequirement(name = "BearerAuth")
public class TeacherEvaluationController {

    private final EvaluationService evaluationService;

    public TeacherEvaluationController(EvaluationService evaluationService) {
        this.evaluationService = evaluationService;
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get evaluation details", description = "Retrieves AI evaluation metrics, confidence score, and feedback")
    public ResponseEntity<ApiResponse<EvaluationResponse>> getEvaluationById(@PathVariable Long id) {
        EvaluationResponse response = evaluationService.getEvaluationById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{id}/approve")
    @Operation(summary = "Approve AI evaluation", description = "Marks evaluation as verified and approved by the course instructor")
    public ResponseEntity<ApiResponse<EvaluationResponse>> approveEvaluation(
            @PathVariable Long id,
            HttpServletRequest servletRequest) {
        EvaluationResponse response = evaluationService.approveEvaluation(id, servletRequest);
        return ResponseEntity.ok(ApiResponse.success(response, "Evaluation approved successfully"));
    }

    @PostMapping("/{id}/override")
    @Operation(summary = "Override evaluation score", description = "Updates score with mandatory rationale, creating an audited revision version")
    public ResponseEntity<ApiResponse<EvaluationResponse>> overrideEvaluation(
            @PathVariable Long id,
            @Valid @RequestBody TeacherOverrideRequest request,
            HttpServletRequest servletRequest) {
        EvaluationResponse response = evaluationService.overrideEvaluation(id, request, servletRequest);
        return ResponseEntity.ok(ApiResponse.success(response, "Evaluation overridden successfully with revision recorded"));
    }

    @GetMapping("/{id}/history")
    @Operation(summary = "Get evaluation revision history", description = "Retrieves all previous version snapshots and teacher override reasons")
    public ResponseEntity<ApiResponse<List<EvaluationVersionResponse>>> getEvaluationHistory(@PathVariable Long id) {
        List<EvaluationVersionResponse> history = evaluationService.getEvaluationHistory(id);
        return ResponseEntity.ok(ApiResponse.success(history));
    }
}
