package com.examind.backend.analytics.dto;

public class StudentPerformanceResponse {

    private Long studentId;
    private String studentName;
    private String email;
    private long totalExamsTaken;
    private Double averagePercentage;
    private long examsPassed;
    private String overallGrade;
    private java.util.List<String> strongTopics = new java.util.ArrayList<>();
    private java.util.List<String> weakTopics = new java.util.ArrayList<>();
    private java.util.Map<String, Double> topicMastery = new java.util.HashMap<>();
    private java.util.List<String> recommendations = new java.util.ArrayList<>();

    public StudentPerformanceResponse() {
    }

    public StudentPerformanceResponse(Long studentId, String studentName, String email, long totalExamsTaken, Double averagePercentage, long examsPassed, String overallGrade) {
        this.studentId = studentId;
        this.studentName = studentName;
        this.email = email;
        this.totalExamsTaken = totalExamsTaken;
        this.averagePercentage = averagePercentage;
        this.examsPassed = examsPassed;
        this.overallGrade = overallGrade;
    }

    public java.util.List<String> getStrongTopics() {
        return strongTopics;
    }

    public void setStrongTopics(java.util.List<String> strongTopics) {
        this.strongTopics = strongTopics != null ? strongTopics : new java.util.ArrayList<>();
    }

    public java.util.List<String> getWeakTopics() {
        return weakTopics;
    }

    public void setWeakTopics(java.util.List<String> weakTopics) {
        this.weakTopics = weakTopics != null ? weakTopics : new java.util.ArrayList<>();
    }

    public java.util.Map<String, Double> getTopicMastery() {
        return topicMastery;
    }

    public void setTopicMastery(java.util.Map<String, Double> topicMastery) {
        this.topicMastery = topicMastery != null ? topicMastery : new java.util.HashMap<>();
    }

    public java.util.List<String> getRecommendations() {
        return recommendations;
    }

    public void setRecommendations(java.util.List<String> recommendations) {
        this.recommendations = recommendations != null ? recommendations : new java.util.ArrayList<>();
    }

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    public String getStudentName() {
        return studentName;
    }

    public void setStudentName(String studentName) {
        this.studentName = studentName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public long getTotalExamsTaken() {
        return totalExamsTaken;
    }

    public void setTotalExamsTaken(long totalExamsTaken) {
        this.totalExamsTaken = totalExamsTaken;
    }

    public Double getAveragePercentage() {
        return averagePercentage;
    }

    public void setAveragePercentage(Double averagePercentage) {
        this.averagePercentage = averagePercentage;
    }

    public long getExamsPassed() {
        return examsPassed;
    }

    public void setExamsPassed(long examsPassed) {
        this.examsPassed = examsPassed;
    }

    public String getOverallGrade() {
        return overallGrade;
    }

    public void setOverallGrade(String overallGrade) {
        this.overallGrade = overallGrade;
    }
}
