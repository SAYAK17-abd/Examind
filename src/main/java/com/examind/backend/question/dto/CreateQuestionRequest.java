package com.examind.backend.question.dto;

import com.examind.backend.question.entity.DifficultyLevel;
import com.examind.backend.question.entity.QuestionType;
import com.examind.backend.rubric.dto.RubricDto;
import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.util.List;

public class CreateQuestionRequest {

    @JsonProperty("questionText")
    @JsonAlias({"text", "question"})
    @NotBlank(message = "Question text is required")
    @Size(min = 5, max = 5000, message = "Question text must be between 5 and 5000 characters")
    private String questionText;

    @JsonProperty("questionType")
    @JsonAlias({"type"})
    @NotNull(message = "Question type is required (MCQ, SHORT_ANSWER, DESCRIPTIVE, CODING, NUMERICAL)")
    private QuestionType questionType;

    @JsonProperty("maxMarks")
    @JsonAlias({"marks"})
    @NotNull(message = "Max marks is required")
    @Positive(message = "Max marks must be positive")
    private Double maxMarks;

    @JsonProperty("referenceAnswer")
    @JsonAlias({"refAnswer"})
    @Size(max = 5000, message = "Reference answer must not exceed 5000 characters")
    private String referenceAnswer;

    private String topic;

    private DifficultyLevel difficulty = DifficultyLevel.MEDIUM;

    @JsonProperty("orderNumber")
    @JsonAlias({"questionNumber"})
    private Integer orderNumber;

    private List<String> expectedConcepts;

    private List<String> options;

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

    public List<String> getExpectedConcepts() {
        return expectedConcepts;
    }

    public void setExpectedConcepts(List<String> expectedConcepts) {
        this.expectedConcepts = expectedConcepts;
    }

    public List<String> getOptions() {
        return options;
    }

    public void setOptions(List<String> options) {
        this.options = options;
    }

    public RubricDto getRubric() {
        return rubric;
    }

    public void setRubric(RubricDto rubric) {
        this.rubric = rubric;
    }
}
