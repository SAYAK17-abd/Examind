package com.examind.backend.analytics.dto;

import java.util.Map;

public class ExamAnalyticsResponse {

    private Long examId;
    private String examTitle;
    private long totalSubmissions;
    private Double averageScore;
    private Double highestScore;
    private Double lowestScore;
    private Double medianScore;
    private Double passPercentage;
    private Map<String, Long> gradeDistribution;
    private Double averageAiConfidence;
    private long teacherReviewedCount;
    private long autoEvaluatedCount;

    public ExamAnalyticsResponse() {
    }

    public Long getExamId() {
        return examId;
    }

    public void setExamId(Long examId) {
        this.examId = examId;
    }

    public String getExamTitle() {
        return examTitle;
    }

    public void setExamTitle(String examTitle) {
        this.examTitle = examTitle;
    }

    public long getTotalSubmissions() {
        return totalSubmissions;
    }

    public void setTotalSubmissions(long totalSubmissions) {
        this.totalSubmissions = totalSubmissions;
    }

    public Double getAverageScore() {
        return averageScore;
    }

    public void setAverageScore(Double averageScore) {
        this.averageScore = averageScore;
    }

    public Double getHighestScore() {
        return highestScore;
    }

    public void setHighestScore(Double highestScore) {
        this.highestScore = highestScore;
    }

    public Double getLowestScore() {
        return lowestScore;
    }

    public void setLowestScore(Double lowestScore) {
        this.lowestScore = lowestScore;
    }

    public Double getMedianScore() {
        return medianScore;
    }

    public void setMedianScore(Double medianScore) {
        this.medianScore = medianScore;
    }

    public Double getPassPercentage() {
        return passPercentage;
    }

    public void setPassPercentage(Double passPercentage) {
        this.passPercentage = passPercentage;
    }

    public Map<String, Long> getGradeDistribution() {
        return gradeDistribution;
    }

    public void setGradeDistribution(Map<String, Long> gradeDistribution) {
        this.gradeDistribution = gradeDistribution;
    }

    public Double getAverageAiConfidence() {
        return averageAiConfidence;
    }

    public void setAverageAiConfidence(Double averageAiConfidence) {
        this.averageAiConfidence = averageAiConfidence;
    }

    public long getTeacherReviewedCount() {
        return teacherReviewedCount;
    }

    public void setTeacherReviewedCount(long teacherReviewedCount) {
        this.teacherReviewedCount = teacherReviewedCount;
    }

    public long getAutoEvaluatedCount() {
        return autoEvaluatedCount;
    }

    public void setAutoEvaluatedCount(long autoEvaluatedCount) {
        this.autoEvaluatedCount = autoEvaluatedCount;
    }
}
