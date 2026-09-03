package com.examind.backend.result.dto;

import com.examind.backend.evaluation.dto.EvaluationResponse;
import com.examind.backend.result.entity.Result;
import java.time.LocalDateTime;
import java.util.List;

public class ResultResponse {

    private Long id;
    private Long submissionId;
    private Long studentId;
    private String studentName;
    private Long examId;
    private String examTitle;
    private Double totalMarks;
    private Double obtainedMarks;
    private Double percentage;
    private String grade;
    private Boolean passed;
    private String status;
    private LocalDateTime generatedAt;
    private List<EvaluationResponse> evaluations;

    public ResultResponse() {
    }

    public static ResultResponse fromEntity(Result result, List<EvaluationResponse> evaluations) {
        ResultResponse res = new ResultResponse();
        res.setId(result.getId());
        res.setSubmissionId(result.getSubmission().getId());
        res.setStudentId(result.getStudent().getId());
        res.setStudentName(result.getStudent().getFullName());
        res.setExamId(result.getExam().getId());
        res.setExamTitle(result.getExam().getTitle());
        res.setTotalMarks(result.getTotalMarks());
        res.setObtainedMarks(result.getObtainedMarks());
        res.setPercentage(Math.round(result.getPercentage() * 100.0) / 100.0);
        res.setGrade(result.getGrade());
        res.setPassed(result.getPassed());
        res.setStatus(result.getStatus());
        res.setGeneratedAt(result.getGeneratedAt());
        res.setEvaluations(evaluations);
        return res;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getSubmissionId() {
        return submissionId;
    }

    public void setSubmissionId(Long submissionId) {
        this.submissionId = submissionId;
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

    public Double getTotalMarks() {
        return totalMarks;
    }

    public void setTotalMarks(Double totalMarks) {
        this.totalMarks = totalMarks;
    }

    public Double getObtainedMarks() {
        return obtainedMarks;
    }

    public void setObtainedMarks(Double obtainedMarks) {
        this.obtainedMarks = obtainedMarks;
    }

    public Double getPercentage() {
        return percentage;
    }

    public void setPercentage(Double percentage) {
        this.percentage = percentage;
    }

    public String getGrade() {
        return grade;
    }

    public void setGrade(String grade) {
        this.grade = grade;
    }

    public Boolean getPassed() {
        return passed;
    }

    public void setPassed(Boolean passed) {
        this.passed = passed;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getGeneratedAt() {
        return generatedAt;
    }

    public void setGeneratedAt(LocalDateTime generatedAt) {
        this.generatedAt = generatedAt;
    }

    public List<EvaluationResponse> getEvaluations() {
        return evaluations;
    }

    public void setEvaluations(List<EvaluationResponse> evaluations) {
        this.evaluations = evaluations;
    }
}
