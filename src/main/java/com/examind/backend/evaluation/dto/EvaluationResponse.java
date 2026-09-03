package com.examind.backend.evaluation.dto;

import com.examind.backend.evaluation.entity.Evaluation;
import java.time.LocalDateTime;

public class EvaluationResponse {

    private Long id;
    private Long answerId;
    private Long questionId;
    private String questionText;
    private Double maxScore;
    private Double score;
    private Double confidence;
    private Double correctness;
    private Double completeness;
    private Double semanticSimilarity;
    private Double conceptCoverage;
    private String feedback;
    private String status;
    private String evaluatedBy;
    private Integer version;
    private LocalDateTime evaluatedAt;

    public EvaluationResponse() {
    }

    public static EvaluationResponse fromEntity(Evaluation eval) {
        EvaluationResponse res = new EvaluationResponse();
        res.setId(eval.getId());
        res.setAnswerId(eval.getAnswer().getId());
        res.setQuestionId(eval.getAnswer().getQuestion().getId());
        res.setQuestionText(eval.getAnswer().getQuestion().getQuestionText());
        res.setMaxScore(eval.getMaxScore());
        res.setScore(eval.getScore());
        res.setConfidence(eval.getConfidence());
        res.setCorrectness(eval.getCorrectness());
        res.setCompleteness(eval.getCompleteness());
        res.setSemanticSimilarity(eval.getSemanticSimilarity());
        res.setConceptCoverage(eval.getConceptCoverage());
        res.setFeedback(eval.getFeedback());
        res.setStatus(eval.getStatus().name());
        res.setEvaluatedBy(eval.getEvaluatedBy());
        res.setVersion(eval.getVersion());
        res.setEvaluatedAt(eval.getEvaluatedAt());
        return res;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getAnswerId() {
        return answerId;
    }

    public void setAnswerId(Long answerId) {
        this.answerId = answerId;
    }

    public Long getQuestionId() {
        return questionId;
    }

    public void setQuestionId(Long questionId) {
        this.questionId = questionId;
    }

    public String getQuestionText() {
        return questionText;
    }

    public void setQuestionText(String questionText) {
        this.questionText = questionText;
    }

    public Double getMaxScore() {
        return maxScore;
    }

    public void setMaxScore(Double maxScore) {
        this.maxScore = maxScore;
    }

    public Double getScore() {
        return score;
    }

    public void setScore(Double score) {
        this.score = score;
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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
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
}
