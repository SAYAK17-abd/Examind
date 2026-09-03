package com.examind.backend.ai.dto;

import java.util.ArrayList;
import java.util.List;

public class AiEvaluationResponseDto {

    private Double score;
    private Double confidence;
    private Double conceptCoverage;
    private Double correctness;
    private Double completeness;
    private Double semanticSimilarity;
    private String feedback;
    private List<String> detectedConcepts = new ArrayList<>();
    private List<String> missingConcepts = new ArrayList<>();

    public AiEvaluationResponseDto() {
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

    public Double getConceptCoverage() {
        return conceptCoverage;
    }

    public void setConceptCoverage(Double conceptCoverage) {
        this.conceptCoverage = conceptCoverage;
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

    public String getFeedback() {
        return feedback;
    }

    public void setFeedback(String feedback) {
        this.feedback = feedback;
    }

    public List<String> getDetectedConcepts() {
        return detectedConcepts;
    }

    public void setDetectedConcepts(List<String> detectedConcepts) {
        this.detectedConcepts = detectedConcepts;
    }

    public List<String> getMissingConcepts() {
        return missingConcepts;
    }

    public void setMissingConcepts(List<String> missingConcepts) {
        this.missingConcepts = missingConcepts;
    }
}
