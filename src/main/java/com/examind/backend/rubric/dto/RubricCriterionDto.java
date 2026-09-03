package com.examind.backend.rubric.dto;

import com.examind.backend.rubric.entity.RubricCriterion;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public class RubricCriterionDto {

    private Long id;

    @NotBlank(message = "Criterion title is required")
    private String criterion;

    private String description;

    @NotNull(message = "Max marks for criterion is required")
    @Positive(message = "Max marks must be positive")
    private Double maxMarks;

    private Double weight = 1.0;

    public RubricCriterionDto() {
    }

    public RubricCriterionDto(Long id, String criterion, String description, Double maxMarks, Double weight) {
        this.id = id;
        this.criterion = criterion;
        this.description = description;
        this.maxMarks = maxMarks;
        this.weight = weight != null ? weight : 1.0;
    }

    public static RubricCriterionDto fromEntity(RubricCriterion entity) {
        return new RubricCriterionDto(
                entity.getId(),
                entity.getCriterion(),
                entity.getDescription(),
                entity.getMaxMarks(),
                entity.getWeight()
        );
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCriterion() {
        return criterion;
    }

    public void setCriterion(String criterion) {
        this.criterion = criterion;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Double getMaxMarks() {
        return maxMarks;
    }

    public void setMaxMarks(Double maxMarks) {
        this.maxMarks = maxMarks;
    }

    public Double getWeight() {
        return weight;
    }

    public void setWeight(Double weight) {
        this.weight = weight;
    }
}
