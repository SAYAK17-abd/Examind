package com.examind.backend.scan.dto;

public class VerifyScanRequest {

    private String studentIdentifier;
    private String extractedAnswersJson;
    private String teacherNotes;
    private String status; // VERIFIED, REJECTED

    public VerifyScanRequest() {
    }

    public String getStudentIdentifier() {
        return studentIdentifier;
    }

    public void setStudentIdentifier(String studentIdentifier) {
        this.studentIdentifier = studentIdentifier;
    }

    public String getExtractedAnswersJson() {
        return extractedAnswersJson;
    }

    public void setExtractedAnswersJson(String extractedAnswersJson) {
        this.extractedAnswersJson = extractedAnswersJson;
    }

    public String getTeacherNotes() {
        return teacherNotes;
    }

    public void setTeacherNotes(String teacherNotes) {
        this.teacherNotes = teacherNotes;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}

