package com.examind.backend.exam.controller;

import com.examind.backend.common.response.ApiResponse;
import com.examind.backend.common.response.PagedResponse;
import com.examind.backend.exam.dto.CreateExamRequest;
import com.examind.backend.exam.dto.ExamResponse;
import com.examind.backend.exam.dto.ExamSummaryResponse;
import com.examind.backend.exam.dto.UpdateExamRequest;
import com.examind.backend.exam.service.ExamService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/teacher/exams")
@PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
@Tag(name = "Teacher - Exam Management", description = "Exam creation, configuration, publishing, and lifecycle APIs")
@SecurityRequirement(name = "BearerAuth")
public class TeacherExamController {

    private final ExamService examService;

    public TeacherExamController(ExamService examService) {
        this.examService = examService;
    }

    @PostMapping
    @Operation(summary = "Create a new exam", description = "Creates a draft exam with schedule, duration, and marks")
    public ResponseEntity<ApiResponse<ExamResponse>> createExam(
            @Valid @RequestBody CreateExamRequest request,
            HttpServletRequest servletRequest) {
        ExamResponse response = examService.createExam(request, servletRequest);
        return new ResponseEntity<>(ApiResponse.created(response, "Exam created successfully"), HttpStatus.CREATED);
    }

    @GetMapping
    @Operation(summary = "List teacher's exams", description = "Retrieves paginated exams created by the authenticated teacher")
    public ResponseEntity<ApiResponse<PagedResponse<ExamSummaryResponse>>> getTeacherExams(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt,desc") String[] sort) {

        Sort sortOrder = Sort.by(Sort.Direction.DESC, "createdAt");
        if (sort != null && sort.length > 0 && sort[0].contains(",")) {
            String[] parts = sort[0].split(",");
            sortOrder = Sort.by(Sort.Direction.fromString(parts[1]), parts[0]);
        }
        Pageable pageable = PageRequest.of(page, size, sortOrder);

        PagedResponse<ExamSummaryResponse> response = examService.getTeacherExams(pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get exam details", description = "Retrieves full exam details for teacher review")
    public ResponseEntity<ApiResponse<ExamResponse>> getExamById(@PathVariable Long id) {
        ExamResponse response = examService.getExamByIdForTeacher(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update exam", description = "Updates details of an existing draft or unpublished exam")
    public ResponseEntity<ApiResponse<ExamResponse>> updateExam(
            @PathVariable Long id,
            @Valid @RequestBody UpdateExamRequest request,
            HttpServletRequest servletRequest) {
        ExamResponse response = examService.updateExam(id, request, servletRequest);
        return ResponseEntity.ok(ApiResponse.success(response, "Exam updated successfully"));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete exam", description = "Deletes an unpublished exam")
    public ResponseEntity<ApiResponse<Void>> deleteExam(
            @PathVariable Long id,
            HttpServletRequest servletRequest) {
        examService.deleteExam(id, servletRequest);
        return ResponseEntity.ok(ApiResponse.success(null, "Exam deleted successfully"));
    }

    @PostMapping("/{id}/publish")
    @Operation(summary = "Publish exam", description = "Makes the exam available to students during its scheduled window")
    public ResponseEntity<ApiResponse<ExamResponse>> publishExam(
            @PathVariable Long id,
            HttpServletRequest servletRequest) {
        ExamResponse response = examService.publishExam(id, servletRequest);
        return ResponseEntity.ok(ApiResponse.success(response, "Exam published successfully"));
    }

    @PostMapping("/{id}/unpublish")
    @Operation(summary = "Unpublish exam", description = "Returns the exam to DRAFT status")
    public ResponseEntity<ApiResponse<ExamResponse>> unpublishExam(
            @PathVariable Long id,
            HttpServletRequest servletRequest) {
        ExamResponse response = examService.unpublishExam(id, servletRequest);
        return ResponseEntity.ok(ApiResponse.success(response, "Exam unpublished successfully"));
    }
}
