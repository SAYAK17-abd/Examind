package com.examind.backend.question.dto;

import com.examind.backend.question.entity.Question;
import com.examind.backend.rubric.dto.RubricCriterionDto;
import com.examind.backend.rubric.dto.RubricDto;
import com.examind.backend.rubric.entity.Rubric;

import java.util.ArrayList;
import java.util.List;

public class QuestionResponse {

    private Long id;
    private Long examId;
    private String questionText;
    private String questionType;
    private Double maxMarks;
    private String referenceAnswer;
    private String topic;
    private String difficulty;
    private Integer orderNumber;
    private List<String> options = new ArrayList<>();
    private List<String> expectedConcepts = new ArrayList<>();
    private RubricDto rubric;

    public QuestionResponse() {
    }

    public static QuestionResponse fromEntity(Question question, Rubric rubric) {
        QuestionResponse res = new QuestionResponse();
        res.setId(question.getId());
        res.setExamId(question.getExam().getId());
        res.setQuestionText(question.getQuestionText());
        res.setQuestionType(question.getQuestionType().name());
        res.setMaxMarks(question.getMaxMarks());
        res.setReferenceAnswer(question.getReferenceAnswer());
        res.setTopic(question.getTopic());
        if (question.getDifficulty() != null) {
            res.setDifficulty(question.getDifficulty().name());
        }
        res.setOrderNumber(question.getOrderNumber());
        if (question.getOptions() != null) {
            res.setOptions(new ArrayList<>(question.getOptions()));
        }
        if (question.getExpectedConcepts() != null) {
            res.setExpectedConcepts(new ArrayList<>(question.getExpectedConcepts()));
        }
        if (rubric != null) {
            res.setRubric(RubricDto.fromEntity(rubric));
        }
        return res;
    }

    public static QuestionResponse forStudent(Question question) {
        QuestionResponse res = new QuestionResponse();
        res.setId(question.getId());
        res.setExamId(question.getExam().getId());
        res.setQuestionText(question.getQuestionText());
        res.setQuestionType(question.getQuestionType().name());
        res.setMaxMarks(question.getMaxMarks());
        // Reference answer & expected concepts are strictly omitted for students!
        res.setReferenceAnswer(null);
        res.setExpectedConcepts(new ArrayList<>());
        res.setTopic(question.getTopic());
        if (question.getDifficulty() != null) {
            res.setDifficulty(question.getDifficulty().name());
        }
        res.setOrderNumber(question.getOrderNumber());
        if (question.getOptions() != null) {
            res.setOptions(new ArrayList<>(question.getOptions()));
        }
        return res;
    }

    // Direct getters/setters
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

    // Frontend compatibility getter for "type"
    public String getType() {
        return questionType;
    }

    public Double getMaxMarks() {
        return maxMarks;
    }

    public void setMaxMarks(Double maxMarks) {
        this.maxMarks = maxMarks;
    }

    // Frontend compatibility getter for "marks"
    public Double getMarks() {
        return maxMarks;
    }

    public String getReferenceAnswer() {
        return referenceAnswer;
    }

    public void setReferenceAnswer(String referenceAnswer) {
        this.referenceAnswer = referenceAnswer;
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

    public Integer getOrderNumber() {
        return orderNumber;
    }

    public void setOrderNumber(Integer orderNumber) {
        this.orderNumber = orderNumber;
    }

    // Frontend compatibility getter for "questionNumber"
    public Integer getQuestionNumber() {
        return orderNumber;
    }

    public List<String> getOptions() {
        return options;
    }

    public void setOptions(List<String> options) {
        this.options = options != null ? options : new ArrayList<>();
    }

    public List<String> getExpectedConcepts() {
        return expectedConcepts;
    }

    public void setExpectedConcepts(List<String> expectedConcepts) {
        this.expectedConcepts = expectedConcepts != null ? expectedConcepts : new ArrayList<>();
    }

    public RubricDto getRubric() {
        return rubric;
    }

    public void setRubric(RubricDto rubric) {
        this.rubric = rubric;
    }

    // Frontend compatibility getter for "criteria"
    public List<RubricCriterionDto> getCriteria() {
        return rubric != null ? rubric.getCriteria() : null;
    }
}
