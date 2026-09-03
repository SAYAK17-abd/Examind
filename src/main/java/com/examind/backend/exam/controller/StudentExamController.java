package com.examind.backend.exam.controller;

import com.examind.backend.common.response.ApiResponse;
import com.examind.backend.common.response.PagedResponse;
import com.examind.backend.exam.dto.ExamResponse;
import com.examind.backend.exam.dto.ExamSummaryResponse;
import com.examind.backend.exam.service.ExamService;
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
@RequestMapping("/api/student/exams")
@PreAuthorize("hasAnyRole('STUDENT', 'ADMIN')")
@Tag(name = "Student - Exam Access", description = "Exam browsing and discovery endpoints for enrolled students")
@SecurityRequirement(name = "BearerAuth")
public class StudentExamController {

    private final ExamService examService;

    public StudentExamController(ExamService examService) {
        this.examService = examService;
    }

    @GetMapping
    @Operation(summary = "List available exams", description = "Retrieves all published, currently active or upcoming exams")
    public ResponseEntity<ApiResponse<PagedResponse<ExamSummaryResponse>>> getAvailableExams(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "startTime"));
        PagedResponse<ExamSummaryResponse> response = examService.getAvailableExamsForStudents(pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get exam info", description = "Retrieves information for a published exam")
    public ResponseEntity<ApiResponse<ExamResponse>> getExamById(@PathVariable Long id) {
        ExamResponse response = examService.getExamByIdForStudent(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
