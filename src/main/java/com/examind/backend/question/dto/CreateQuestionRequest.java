package com.examind.backend.question.dto;

import com.examind.backend.question.entity.DifficultyLevel;
import com.examind.backend.question.entity.QuestionType;
import com.examind.backend.rubric.dto.RubricDto;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

public class CreateQuestionRequest {

    @NotBlank(message = "Question text is required")
    @Size(min = 5, max = 5000, message = "Question text must be between 5 and 5000 characters")
    private String questionText;

    @NotNull(message = "Question type is required (MCQ, SHORT_ANSWER, DESCRIPTIVE, CODING)")
    private QuestionType questionType;

    @NotNull(message = "Max marks is required")
    @Positive(message = "Max marks must be positive")
    private Double maxMarks;

    @Size(max = 5000, message = "Reference answer must not exceed 5000 characters")
    private String referenceAnswer;

    private String topic;

    private DifficultyLevel difficulty = DifficultyLevel.MEDIUM;

    private Integer orderNumber;

    @Valid
    private RubricDto rubric;

    public CreateQuestionRequest() {
    }

    public String getQuestionText() {
        return questionText;
    }

    public void setQuestionText(String questionText) {
        this.questionText = questionText;
    }

    public QuestionType getQuestionType() {
        return questionType;
    }

    public void setQuestionType(QuestionType questionType) {
        this.questionType = questionType;
    }

    public Double getMaxMarks() {
        return maxMarks;
    }

    public void setMaxMarks(Double maxMarks) {
        this.maxMarks = maxMarks;
    }

    public String getReferenceAnswer() {
        return referenceAnswer;
    }

    public void setReferenceAnswer(String referenceAnswer) {
        this.referenceAnswer = referenceAnswer;
    }

    public String getTopic() {
        return topic;
    }

    public void setTopic(String topic) {
        this.topic = topic;
    }

    public DifficultyLevel getDifficulty() {
        return difficulty;
    }

    public void setDifficulty(DifficultyLevel difficulty) {
        this.difficulty = difficulty;
    }

    public Integer getOrderNumber() {
        return orderNumber;
    }

    public void setOrderNumber(Integer orderNumber) {
        this.orderNumber = orderNumber;
    }

    public RubricDto getRubric() {
        return rubric;
    }

    public void setRubric(RubricDto rubric) {
        this.rubric = rubric;
    }
}
