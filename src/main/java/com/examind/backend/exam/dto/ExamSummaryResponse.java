package com.examind.backend.exam.dto;

import com.examind.backend.exam.entity.Exam;
import java.time.LocalDateTime;

public class ExamSummaryResponse {

    private Long id;
    private String title;
    private Integer duration;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Double totalMarks;
    private String status;
    private String createdByTeacher;
    private boolean active;

    public ExamSummaryResponse() {
    }

    public static ExamSummaryResponse fromEntity(Exam exam) {
        ExamSummaryResponse dto = new ExamSummaryResponse();
        dto.setId(exam.getId());
        dto.setTitle(exam.getTitle());
        dto.setDuration(exam.getDuration());
        dto.setStartTime(exam.getStartTime());
        dto.setEndTime(exam.getEndTime());
        dto.setTotalMarks(exam.getTotalMarks());
        dto.setStatus(exam.getStatus().name());
        if (exam.getCreatedBy() != null) {
            dto.setCreatedByTeacher(exam.getCreatedBy().getFullName());
        }
        dto.setActive(exam.isCurrentlyActive());
        return dto;
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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getCreatedByTeacher() {
        return createdByTeacher;
    }

    public void setCreatedByTeacher(String createdByTeacher) {
        this.createdByTeacher = createdByTeacher;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}
