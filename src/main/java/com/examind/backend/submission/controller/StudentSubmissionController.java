package com.examind.backend.submission.controller;

import com.examind.backend.answer.dto.AnswerResponse;
import com.examind.backend.answer.dto.SaveAnswerRequest;
import com.examind.backend.answer.service.AnswerService;
import com.examind.backend.common.response.ApiResponse;
import com.examind.backend.common.response.PagedResponse;
import com.examind.backend.submission.dto.StartExamResponse;
import com.examind.backend.submission.dto.SubmissionResponse;
import com.examind.backend.submission.service.SubmissionService;
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
@RequestMapping("/api/student")
@PreAuthorize("hasAnyRole('STUDENT', 'ADMIN')")
@Tag(name = "Student - Examination & Submissions", description = "Endpoints for starting exams, answering questions, and submitting tests")
@SecurityRequirement(name = "BearerAuth")
public class StudentSubmissionController {

    private final SubmissionService submissionService;
    private final AnswerService answerService;

    public StudentSubmissionController(SubmissionService submissionService, AnswerService answerService) {
        this.submissionService = submissionService;
        this.answerService = answerService;
    }

    @PostMapping("/exams/{examId}/start")
    @Operation(summary = "Start an exam attempt", description = "Initializes an exam session, computes time limits, and returns test questions")
    public ResponseEntity<ApiResponse<StartExamResponse>> startExam(
            @PathVariable Long examId,
            HttpServletRequest servletRequest) {
        StartExamResponse response = submissionService.startExam(examId, servletRequest);
        return ResponseEntity.ok(ApiResponse.success(response, "Exam started successfully"));
    }

    @PostMapping("/submissions/{submissionId}/answers")
    @Operation(summary = "Save or update answer", description = "Saves typed answer or uploaded file attachment URL for a question")
    public ResponseEntity<ApiResponse<AnswerResponse>> saveAnswer(
            @PathVariable Long submissionId,
            @Valid @RequestBody SaveAnswerRequest request) {
        AnswerResponse response = answerService.saveAnswer(submissionId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Answer saved successfully"));
    }

    @PostMapping("/submissions/{submissionId}/submit")
    @Operation(summary = "Submit exam", description = "Finalizes the exam submission and queues automated AI evaluation")
    public ResponseEntity<ApiResponse<SubmissionResponse>> submitExam(
            @PathVariable Long submissionId,
            HttpServletRequest servletRequest) {
        SubmissionResponse response = submissionService.submitExam(submissionId, servletRequest);
        return ResponseEntity.ok(ApiResponse.success(response, "Exam submitted successfully. Evaluation in progress."));
    }

    @GetMapping("/submissions/{submissionId}")
    @Operation(summary = "Get submission details", description = "Retrieves student's own submission state and submitted answers")
    public ResponseEntity<ApiResponse<SubmissionResponse>> getSubmissionById(@PathVariable Long submissionId) {
        SubmissionResponse response = submissionService.getSubmissionById(submissionId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/submissions")
    @Operation(summary = "List own submissions", description = "Retrieves paginated history of all exam submissions by current student")
    public ResponseEntity<ApiResponse<PagedResponse<SubmissionResponse>>> getMySubmissions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        PagedResponse<SubmissionResponse> response = submissionService.getMySubmissions(pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
