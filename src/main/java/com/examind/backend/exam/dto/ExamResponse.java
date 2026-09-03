package com.examind.backend.exam.dto;

import com.examind.backend.auth.dto.UserSummaryDto;
import com.examind.backend.exam.entity.Exam;
import java.time.LocalDateTime;

public class ExamResponse {

    private Long id;
    private String title;
    private String description;
    private Integer duration;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Double totalMarks;
    private Double passingMarks;
    private String status;
    private UserSummaryDto createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private boolean active;

    public ExamResponse() {
    }

    public static ExamResponse fromEntity(Exam exam) {
        ExamResponse res = new ExamResponse();
        res.setId(exam.getId());
        res.setTitle(exam.getTitle());
        res.setDescription(exam.getDescription());
        res.setDuration(exam.getDuration());
        res.setStartTime(exam.getStartTime());
        res.setEndTime(exam.getEndTime());
        res.setTotalMarks(exam.getTotalMarks());
        res.setPassingMarks(exam.getPassingMarks());
        res.setStatus(exam.getStatus().name());
        if (exam.getCreatedBy() != null) {
            res.setCreatedBy(UserSummaryDto.fromEntity(exam.getCreatedBy()));
        }
        res.setCreatedAt(exam.getCreatedAt());
        res.setUpdatedAt(exam.getUpdatedAt());
        res.setActive(exam.isCurrentlyActive());
        return res;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Integer getDuration() {
        return duration;
    }

    public void setDuration(Integer duration) {
        this.duration = duration;
    }

    public LocalDateTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }

    public LocalDateTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalDateTime endTime) {
        this.endTime = endTime;
    }

    public Double getTotalMarks() {
        return totalMarks;
    }

    public void setTotalMarks(Double totalMarks) {
        this.totalMarks = totalMarks;
    }

    public Double getPassingMarks() {
        return passingMarks;
    }

    public void setPassingMarks(Double passingMarks) {
        this.passingMarks = passingMarks;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public UserSummaryDto getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(UserSummaryDto createdBy) {
        this.createdBy = createdBy;
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

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}
