package com.examind.backend.question.controller;

import com.examind.backend.common.response.ApiResponse;
import com.examind.backend.question.dto.CreateQuestionRequest;
import com.examind.backend.question.dto.QuestionResponse;
import com.examind.backend.question.service.QuestionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/teacher")
@PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
@Tag(name = "Teacher - Question Management", description = "Question creation, ordering, rubric definition, and updates")
@SecurityRequirement(name = "BearerAuth")
public class TeacherQuestionController {

    private final QuestionService questionService;

    public TeacherQuestionController(QuestionService questionService) {
        this.questionService = questionService;
    }

    @PostMapping("/exams/{examId}/questions")
    @Operation(summary = "Add question to exam", description = "Creates a question (MCQ, SHORT_ANSWER, DESCRIPTIVE, CODING) with optional rubric criteria")
    public ResponseEntity<ApiResponse<QuestionResponse>> addQuestion(
            @PathVariable Long examId,
            @Valid @RequestBody CreateQuestionRequest request,
            HttpServletRequest servletRequest) {
        QuestionResponse response = questionService.addQuestion(examId, request, servletRequest);
        return new ResponseEntity<>(ApiResponse.created(response, "Question added successfully"), HttpStatus.CREATED);
    }

    @GetMapping("/exams/{examId}/questions")
    @Operation(summary = "Get all questions for an exam", description = "Retrieves all questions for teacher review including reference answers and rubrics")
    public ResponseEntity<ApiResponse<List<QuestionResponse>>> getQuestionsForExam(@PathVariable Long examId) {
        List<QuestionResponse> questions = questionService.getQuestionsForTeacher(examId);
        return ResponseEntity.ok(ApiResponse.success(questions));
    }

    @GetMapping("/questions/{questionId}")
    @Operation(summary = "Get single question details", description = "Retrieves question details including attached rubric")
    public ResponseEntity<ApiResponse<QuestionResponse>> getQuestionById(@PathVariable Long questionId) {
        QuestionResponse question = questionService.getQuestionById(questionId);
        return ResponseEntity.ok(ApiResponse.success(question));
    }

    @PutMapping("/questions/{questionId}")
    @Operation(summary = "Update question", description = "Updates question text, type, marks, reference answer, or rubric")
    public ResponseEntity<ApiResponse<QuestionResponse>> updateQuestion(
            @PathVariable Long questionId,
            @Valid @RequestBody CreateQuestionRequest request,
            HttpServletRequest servletRequest) {
        QuestionResponse response = questionService.updateQuestion(questionId, request, servletRequest);
        return ResponseEntity.ok(ApiResponse.success(response, "Question updated successfully"));
    }

    @DeleteMapping("/questions/{questionId}")
    @Operation(summary = "Delete question", description = "Deletes a question from an exam")
    public ResponseEntity<ApiResponse<Void>> deleteQuestion(
            @PathVariable Long questionId,
            HttpServletRequest servletRequest) {
        questionService.deleteQuestion(questionId, servletRequest);
        return ResponseEntity.ok(ApiResponse.success(null, "Question deleted successfully"));
    }
}
