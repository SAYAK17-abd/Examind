package com.examind.backend.ai.dto;

public class AiRubricItemDto {

    private String criterion;
    private Double maxMarks;

    public AiRubricItemDto() {
    }

    public AiRubricItemDto(String criterion, Double maxMarks) {
        this.criterion = criterion;
        this.maxMarks = maxMarks;
    }

    public String getCriterion() {
        return criterion;
    }

    public void setCriterion(String criterion) {
        this.criterion = criterion;
    }

    public Double getMaxMarks() {
        return maxMarks;
    }

    public void setMaxMarks(Double maxMarks) {
        this.maxMarks = maxMarks;
    }
}
