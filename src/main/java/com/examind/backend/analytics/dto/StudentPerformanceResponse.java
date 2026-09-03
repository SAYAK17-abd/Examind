package com.examind.backend.analytics.dto;

public class StudentPerformanceResponse {

    private Long studentId;
    private String studentName;
    private String email;
    private long totalExamsTaken;
    private Double averagePercentage;
    private long examsPassed;
    private String overallGrade;

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
