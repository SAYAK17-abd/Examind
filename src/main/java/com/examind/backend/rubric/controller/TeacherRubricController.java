package com.examind.backend.rubric.controller;

import com.examind.backend.common.response.ApiResponse;
import com.examind.backend.question.service.QuestionService;
import com.examind.backend.rubric.dto.RubricDto;
import com.examind.backend.rubric.service.RubricService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/teacher/questions/{questionId}/rubric")
@PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
@Tag(name = "Teacher - Rubric Management", description = "Endpoints for defining descriptive question evaluation rubrics and criteria")
@SecurityRequirement(name = "BearerAuth")
public class TeacherRubricController {

    private final RubricService rubricService;
    private final QuestionService questionService;

    public TeacherRubricController(RubricService rubricService, QuestionService questionService) {
        this.rubricService = rubricService;
        this.questionService = questionService;
    }

    @PostMapping
    @Operation(summary = "Set or update question rubric", description = "Defines evaluation criteria, descriptions, max marks, and weights for grading")
    public ResponseEntity<ApiResponse<RubricDto>> saveRubric(
            @PathVariable Long questionId,
            @Valid @RequestBody RubricDto rubricDto) {
        // Verifies ownership through QuestionService
        questionService.getQuestionById(questionId);
        RubricDto saved = rubricService.saveRubric(questionId, rubricDto);
        return ResponseEntity.ok(ApiResponse.success(saved, "Rubric saved successfully"));
    }

    @GetMapping
    @Operation(summary = "Get question rubric", description = "Retrieves rubric criteria associated with a question")
    public ResponseEntity<ApiResponse<RubricDto>> getRubric(@PathVariable Long questionId) {
        questionService.getQuestionById(questionId);
        RubricDto rubric = rubricService.getRubricByQuestionId(questionId);
        return ResponseEntity.ok(ApiResponse.success(rubric));
    }
}
