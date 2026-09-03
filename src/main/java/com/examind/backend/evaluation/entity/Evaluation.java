package com.examind.backend.evaluation.entity;

import com.examind.backend.answer.entity.Answer;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "evaluations", indexes = {
        @Index(name = "idx_eval_answer", columnList = "answer_id"),
        @Index(name = "idx_eval_status", columnList = "status")
})
public class Evaluation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "answer_id", nullable = false, unique = true)
    private Answer answer;

    @Column(name = "score", nullable = false)
    private Double score;

    @Column(name = "max_score", nullable = false)
    private Double maxScore;

    @Column(name = "confidence", nullable = false)
    private Double confidence;

    @Column(name = "correctness")
    private Double correctness;

    @Column(name = "completeness")
    private Double completeness;

    @Column(name = "semantic_similarity")
    private Double semanticSimilarity;

    @Column(name = "concept_coverage")
    private Double conceptCoverage;

    @Column(name = "feedback", length = 5000)
    private String feedback;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private EvaluationStatus status;

    @Column(name = "evaluated_by", length = 100)
    private String evaluatedBy;

    @Column(name = "version", nullable = false)
    private Integer version = 1;

    @Column(name = "evaluated_at", nullable = false)
    private LocalDateTime evaluatedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Evaluation() {
    }

    public Evaluation(Answer answer, Double score, Double maxScore, Double confidence, Double correctness, Double completeness, Double semanticSimilarity, Double conceptCoverage, String feedback, EvaluationStatus status, String evaluatedBy) {
        this.answer = answer;
        this.score = score;
        this.maxScore = maxScore;
        this.confidence = confidence;
        this.correctness = correctness;
        this.completeness = completeness;
        this.semanticSimilarity = semanticSimilarity;
        this.conceptCoverage = conceptCoverage;
        this.feedback = feedback;
        this.status = status;
        this.evaluatedBy = evaluatedBy;
        this.version = 1;
        this.evaluatedAt = LocalDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.evaluatedAt == null) {
            this.evaluatedAt = LocalDateTime.now();
        }
        if (this.version == null) {
            this.version = 1;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Answer getAnswer() {
        return answer;
    }

    public void setAnswer(Answer answer) {
        this.answer = answer;
    }

    public Double getScore() {
        return score;
    }

    public void setScore(Double score) {
        this.score = score;
    }

    public Double getMaxScore() {
        return maxScore;
    }

    public void setMaxScore(Double maxScore) {
        this.maxScore = maxScore;
    }

    public Double getConfidence() {
        return confidence;
    }

    public void setConfidence(Double confidence) {
        this.confidence = confidence;
    }

    public Double getCorrectness() {
        return correctness;
    }

    public void setCorrectness(Double correctness) {
        this.correctness = correctness;
    }

    public Double getCompleteness() {
        return completeness;
    }

    public void setCompleteness(Double completeness) {
        this.completeness = completeness;
    }

    public Double getSemanticSimilarity() {
        return semanticSimilarity;
    }

    public void setSemanticSimilarity(Double semanticSimilarity) {
        this.semanticSimilarity = semanticSimilarity;
    }

    public Double getConceptCoverage() {
        return conceptCoverage;
    }

    public void setConceptCoverage(Double conceptCoverage) {
        this.conceptCoverage = conceptCoverage;
    }

    public String getFeedback() {
        return feedback;
    }

    public void setFeedback(String feedback) {
        this.feedback = feedback;
    }

    public EvaluationStatus getStatus() {
        return status;
    }

    public void setStatus(EvaluationStatus status) {
        this.status = status;
    }

    public String getEvaluatedBy() {
        return evaluatedBy;
    }

    public void setEvaluatedBy(String evaluatedBy) {
        this.evaluatedBy = evaluatedBy;
    }

    public Integer getVersion() {
        return version;
    }

    public void setVersion(Integer version) {
        this.version = version;
    }

    public LocalDateTime getEvaluatedAt() {
        return evaluatedAt;
    }

    public void setEvaluatedAt(LocalDateTime evaluatedAt) {
        this.evaluatedAt = evaluatedAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
