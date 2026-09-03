package com.examind.backend.result.entity;

import com.examind.backend.exam.entity.Exam;
import com.examind.backend.submission.entity.Submission;
import com.examind.backend.user.entity.User;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "results", indexes = {
        @Index(name = "idx_result_submission", columnList = "submission_id", unique = true),
        @Index(name = "idx_result_student", columnList = "student_id"),
        @Index(name = "idx_result_exam", columnList = "exam_id")
})
public class Result {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submission_id", nullable = false, unique = true)
    private Submission submission;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id", nullable = false)
    private Exam exam;

    @Column(name = "total_marks", nullable = false)
    private Double totalMarks;

    @Column(name = "obtained_marks", nullable = false)
    private Double obtainedMarks;

    @Column(name = "percentage", nullable = false)
    private Double percentage;

    @Column(name = "grade", nullable = false, length = 10)
    private String grade;

    @Column(name = "passed", nullable = false)
    private Boolean passed = false;

    @Column(name = "status", nullable = false, length = 30)
    private String status = "PUBLISHED";

    @Column(name = "generated_at", nullable = false)
    private LocalDateTime generatedAt;

    public Result() {
    }

    public Result(Submission submission, User student, Exam exam, Double totalMarks, Double obtainedMarks) {
        this.submission = submission;
        this.student = student;
        this.exam = exam;
        this.totalMarks = totalMarks;
        this.obtainedMarks = obtainedMarks;
        this.percentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100.0 : 0.0;
        this.grade = calculateGrade(this.percentage);
        double passingMarks = exam.getPassingMarks() != null ? exam.getPassingMarks() : (totalMarks * 0.40);
        this.passed = obtainedMarks >= passingMarks;
        this.status = "PUBLISHED";
        this.generatedAt = LocalDateTime.now();
    }

    public static String calculateGrade(double pct) {
        if (pct >= 90.0) return "A+";
        if (pct >= 80.0) return "A";
        if (pct >= 70.0) return "B";
        if (pct >= 60.0) return "C";
        if (pct >= 50.0) return "D";
        return "F";
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Submission getSubmission() {
        return submission;
    }

    public void setSubmission(Submission submission) {
        this.submission = submission;
    }

    public User getStudent() {
        return student;
    }

    public void setStudent(User student) {
        this.student = student;
    }

    public Exam getExam() {
        return exam;
    }

    public void setExam(Exam exam) {
        this.exam = exam;
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
}
