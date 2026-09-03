package com.examind.backend.rubric.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "rubric_criteria")
public class RubricCriterion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rubric_id", nullable = false)
    @JsonIgnore
    private Rubric rubric;

    @Column(name = "criterion", nullable = false, length = 200)
    private String criterion;

    @Column(name = "description", length = 1000)
    private String description;

    @Column(name = "max_marks", nullable = false)
    private Double maxMarks;

    @Column(name = "weight")
    private Double weight = 1.0;

    public RubricCriterion() {
    }

    public RubricCriterion(String criterion, String description, Double maxMarks, Double weight) {
        this.criterion = criterion;
        this.description = description;
        this.maxMarks = maxMarks;
        this.weight = weight != null ? weight : 1.0;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Rubric getRubric() {
        return rubric;
    }

    public void setRubric(Rubric rubric) {
        this.rubric = rubric;
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
