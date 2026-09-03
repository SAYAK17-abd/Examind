package com.examind.backend.analytics.dto;

public class QuestionAnalysisResponse {

    private Long questionId;
    private String questionText;
    private String questionType;
    private Double maxMarks;
    private Double averageScore;
    private Double successRate;
    private String topic;
    private String difficulty;

    public QuestionAnalysisResponse() {
    }

    public QuestionAnalysisResponse(Long questionId, String questionText, String questionType, Double maxMarks, Double averageScore, Double successRate, String topic, String difficulty) {
        this.questionId = questionId;
        this.questionText = questionText;
        this.questionType = questionType;
        this.maxMarks = maxMarks;
        this.averageScore = averageScore;
        this.successRate = successRate;
        this.topic = topic;
        this.difficulty = difficulty;
    }

    public Long getQuestionId() {
        return questionId;
    }

    public void setQuestionId(Long questionId) {
        this.questionId = questionId;
    }

    public String getQuestionText() {
        return questionText;
    }

    public void setQuestionText(String questionText) {
        this.questionText = questionText;
    }

    public String getQuestionType() {
        return questionType;
    }

    public void setQuestionType(String questionType) {
        this.questionType = questionType;
    }

    public Double getMaxMarks() {
        return maxMarks;
    }

    public void setMaxMarks(Double maxMarks) {
        this.maxMarks = maxMarks;
    }

    public Double getAverageScore() {
        return averageScore;
    }

    public void setAverageScore(Double averageScore) {
        this.averageScore = averageScore;
    }

    public Double getSuccessRate() {
        return successRate;
    }

    public void setSuccessRate(Double successRate) {
        this.successRate = successRate;
    }

    public String getTopic() {
        return topic;
    }

    public void setTopic(String topic) {
        this.topic = topic;
    }

    public String getDifficulty() {
        return difficulty;
    }

    public void setDifficulty(String difficulty) {
        this.difficulty = difficulty;
    }
}
