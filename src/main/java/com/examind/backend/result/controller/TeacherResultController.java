package com.examind.backend.result.controller;

import com.examind.backend.common.response.ApiResponse;
import com.examind.backend.common.response.PagedResponse;
import com.examind.backend.result.dto.ResultResponse;
import com.examind.backend.result.service.ResultService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/teacher")
@PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
@Tag(name = "Teacher - Results Management", description = "Endpoints for teachers to inspect student scores, grade breakdowns, and cohorts")
@SecurityRequirement(name = "BearerAuth")
public class TeacherResultController {

    private final ResultService resultService;

    public TeacherResultController(ResultService resultService) {
        this.resultService = resultService;
    }

    @GetMapping("/exams/{examId}/results")
    @Operation(summary = "Get exam results cohort", description = "Retrieves paginated student results and grades for an exam")
    public ResponseEntity<ApiResponse<PagedResponse<ResultResponse>>> getExamResults(
            @PathVariable Long examId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "obtainedMarks"));
        PagedResponse<ResultResponse> response = resultService.getExamResultsForTeacher(examId, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/students/{studentId}/results")
    @Operation(summary = "Get student result history", description = "Retrieves all exam scores and evaluations for a specific student")
    public ResponseEntity<ApiResponse<List<ResultResponse>>> getStudentResults(@PathVariable Long studentId) {
        List<ResultResponse> response = resultService.getStudentResultsForTeacher(studentId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
