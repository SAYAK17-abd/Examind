package com.examind.backend.rubric.dto;

import com.examind.backend.rubric.entity.Rubric;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.ArrayList;
import java.util.List;

public class RubricDto {

    private Long id;

    @NotBlank(message = "Rubric name is required")
    private String name;

    private String description;

    @NotEmpty(message = "At least one rubric criterion is required")
    @Valid
    private List<RubricCriterionDto> criteria = new ArrayList<>();

    public RubricDto() {
    }

    public static RubricDto fromEntity(Rubric rubric) {
        if (rubric == null) return null;
        RubricDto dto = new RubricDto();
        dto.setId(rubric.getId());
        dto.setName(rubric.getName());
        dto.setDescription(rubric.getDescription());
        if (rubric.getCriteria() != null) {
            dto.setCriteria(rubric.getCriteria().stream()
                    .map(RubricCriterionDto::fromEntity)
                    .toList());
        }
        return dto;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public List<RubricCriterionDto> getCriteria() {
        return criteria;
    }

    public void setCriteria(List<RubricCriterionDto> criteria) {
        this.criteria = criteria;
    }
}
