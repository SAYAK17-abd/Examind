package com.examind.backend.rubric.entity;

import com.examind.backend.question.entity.Question;
import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "rubrics")
public class Rubric {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false, unique = true)
    private Question question;

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "description", length = 1000)
    private String description;

    @OneToMany(mappedBy = "rubric", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<RubricCriterion> criteria = new ArrayList<>();

    public Rubric() {
    }

    public Rubric(Question question, String name, String description) {
        this.question = question;
        this.name = name;
        this.description = description;
    }

    public void addCriterion(RubricCriterion criterion) {
        criteria.add(criterion);
        criterion.setRubric(this);
    }

    public void removeCriterion(RubricCriterion criterion) {
        criteria.remove(criterion);
        criterion.setRubric(null);
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Question getQuestion() {
        return question;
    }

    public void setQuestion(Question question) {
        this.question = question;
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

    public List<RubricCriterion> getCriteria() {
        return criteria;
    }

    public void setCriteria(List<RubricCriterion> criteria) {
        this.criteria = criteria;
    }
}
