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

@RestController
@RequestMapping("/api/student/results")
@PreAuthorize("hasAnyRole('STUDENT', 'ADMIN')")
@Tag(name = "Student - Results & Performance", description = "Endpoints for students to review their published exam scores and detailed AI feedback")
@SecurityRequirement(name = "BearerAuth")
public class StudentResultController {

    private final ResultService resultService;

    public StudentResultController(ResultService resultService) {
        this.resultService = resultService;
    }

    @GetMapping
    @Operation(summary = "Get own exam results", description = "Retrieves paginated exam results for the authenticated student")
    public ResponseEntity<ApiResponse<PagedResponse<ResultResponse>>> getMyResults(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "generatedAt"));
        PagedResponse<ResultResponse> response = resultService.getStudentResults(pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get single result details", description = "Retrieves score, grade, and question-by-question AI evaluation feedback")
    public ResponseEntity<ApiResponse<ResultResponse>> getResultById(@PathVariable Long id) {
        ResultResponse response = resultService.getResultById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
