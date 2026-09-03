package com.examind.backend.submission.controller;

import com.examind.backend.common.response.ApiResponse;
import com.examind.backend.common.response.PagedResponse;
import com.examind.backend.submission.dto.SubmissionResponse;
import com.examind.backend.submission.service.SubmissionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/teacher")
@PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
@Tag(name = "Teacher - Submission Review", description = "Endpoints for teachers to inspect student exam attempts and answers")
@SecurityRequirement(name = "BearerAuth")
public class TeacherSubmissionController {

    private final SubmissionService submissionService;

    public TeacherSubmissionController(SubmissionService submissionService) {
        this.submissionService = submissionService;
    }

    @GetMapping("/exams/{examId}/submissions")
    @Operation(summary = "List exam submissions", description = "Retrieves paginated student submissions for a specific exam")
    public ResponseEntity<ApiResponse<PagedResponse<SubmissionResponse>>> getExamSubmissions(
            @PathVariable Long examId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        PagedResponse<SubmissionResponse> response = submissionService.getSubmissionsByExam(examId, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/submissions/{submissionId}")
    @Operation(summary = "Get single submission details", description = "Retrieves student submission answers and grading status for teacher review")
    public ResponseEntity<ApiResponse<SubmissionResponse>> getSubmissionById(@PathVariable Long submissionId) {
        SubmissionResponse response = submissionService.getSubmissionById(submissionId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
