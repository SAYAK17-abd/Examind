package com.examind.backend.ai.dto;

import java.util.ArrayList;
import java.util.List;

public class AiEvaluationRequestDto {

    private String question;
    private String studentAnswer;
    private String referenceAnswer;
    private Double maxMarks;
    private List<AiRubricItemDto> rubric = new ArrayList<>();

    public AiEvaluationRequestDto() {
    }

    public AiEvaluationRequestDto(String question, String studentAnswer, String referenceAnswer, Double maxMarks, List<AiRubricItemDto> rubric) {
        this.question = question;
        this.studentAnswer = studentAnswer;
        this.referenceAnswer = referenceAnswer;
        this.maxMarks = maxMarks;
        this.rubric = rubric != null ? rubric : new ArrayList<>();
    }

    public String getQuestion() {
        return question;
    }

    public void setQuestion(String question) {
        this.question = question;
    }

    public String getStudentAnswer() {
        return studentAnswer;
    }

    public void setStudentAnswer(String studentAnswer) {
        this.studentAnswer = studentAnswer;
    }

    public String getReferenceAnswer() {
        return referenceAnswer;
    }

    public void setReferenceAnswer(String referenceAnswer) {
        this.referenceAnswer = referenceAnswer;
    }

    public Double getMaxMarks() {
        return maxMarks;
    }

    public void setMaxMarks(Double maxMarks) {
        this.maxMarks = maxMarks;
    }

    public List<AiRubricItemDto> getRubric() {
        return rubric;
    }

    public void setRubric(List<AiRubricItemDto> rubric) {
        this.rubric = rubric;
    }
}
