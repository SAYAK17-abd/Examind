package com.examind.backend.submission.dto;

import com.examind.backend.answer.dto.AnswerResponse;
import com.examind.backend.submission.entity.Submission;
import java.time.LocalDateTime;
import java.util.List;

public class SubmissionResponse {

    private Long id;
    private Long examId;
    private String examTitle;
    private Long studentId;
    private String studentName;
    private LocalDateTime startedAt;
    private LocalDateTime submittedAt;
    private LocalDateTime dueAt;
    private String status;
    private String evaluationStatus;
    private Double totalScore;
    private Double totalMarks;
    private List<AnswerResponse> answers;

    public SubmissionResponse() {
    }

    public static SubmissionResponse fromEntity(Submission submission, List<AnswerResponse> answers) {
        SubmissionResponse res = new SubmissionResponse();
        res.setId(submission.getId());
        res.setExamId(submission.getExam().getId());
        res.setExamTitle(submission.getExam().getTitle());
        res.setStudentId(submission.getStudent().getId());
        res.setStudentName(submission.getStudent().getFullName());
        res.setStartedAt(submission.getStartedAt());
        res.setSubmittedAt(submission.getSubmittedAt());
        res.setDueAt(submission.getDueAt());
        res.setStatus(submission.getStatus().name());
        res.setEvaluationStatus(submission.getEvaluationStatus().name());
        res.setTotalScore(submission.getTotalScore());
        res.setTotalMarks(submission.getExam().getTotalMarks());
        res.setAnswers(answers);
        return res;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public LocalDateTime getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(LocalDateTime startedAt) {
        this.startedAt = startedAt;
    }

    public LocalDateTime getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(LocalDateTime submittedAt) {
        this.submittedAt = submittedAt;
    }

    public LocalDateTime getDueAt() {
        return dueAt;
    }

    public void setDueAt(LocalDateTime dueAt) {
        this.dueAt = dueAt;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getEvaluationStatus() {
        return evaluationStatus;
    }

    public void setEvaluationStatus(String evaluationStatus) {
        this.evaluationStatus = evaluationStatus;
    }

    public Double getTotalScore() {
        return totalScore;
    }

    public void setTotalScore(Double totalScore) {
        this.totalScore = totalScore;
    }

    public Double getTotalMarks() {
        return totalMarks;
    }

    public void setTotalMarks(Double totalMarks) {
        this.totalMarks = totalMarks;
    }

    public List<AnswerResponse> getAnswers() {
        return answers;
    }

    public void setAnswers(List<AnswerResponse> answers) {
        this.answers = answers;
    }
}
