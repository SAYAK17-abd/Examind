package com.examind.backend.similarity.controller;

import com.examind.backend.common.response.ApiResponse;
import com.examind.backend.similarity.dto.SimilarityReportDto;
import com.examind.backend.similarity.service.SimilarityDetectionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/teacher/exams/{examId}")
@PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
@Tag(name = "Teacher - Similarity & Academic Integrity", description = "Cross-student answer comparison and high similarity detection reports")
@SecurityRequirement(name = "BearerAuth")
public class TeacherSimilarityController {

    private final SimilarityDetectionService similarityService;

    public TeacherSimilarityController(SimilarityDetectionService similarityService) {
        this.similarityService = similarityService;
    }

    @PostMapping("/similarity-check")
    @Operation(summary = "Run similarity check", description = "Runs pairwise n-gram similarity analysis across all student answers for an exam")
    public ResponseEntity<ApiResponse<List<SimilarityReportDto>>> runCheck(@PathVariable Long examId) {
        List<SimilarityReportDto> reports = similarityService.runSimilarityCheck(examId);
        return ResponseEntity.ok(ApiResponse.success(reports, "Similarity check completed. Found " + reports.size() + " correlated pairs."));
    }

    @GetMapping("/similarity-reports")
    @Operation(summary = "Get similarity reports", description = "Retrieves flagged answer pairs with similarity scores")
    public ResponseEntity<ApiResponse<List<SimilarityReportDto>>> getReports(
            @PathVariable Long examId,
            @RequestParam(defaultValue = "false") Boolean highSimilarityOnly) {
        List<SimilarityReportDto> reports = similarityService.getSimilarityReports(examId, highSimilarityOnly);
        return ResponseEntity.ok(ApiResponse.success(reports));
    }
}
