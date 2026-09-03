package com.examind.backend.similarity.entity;

import com.examind.backend.answer.entity.Answer;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "answer_similarities", indexes = {
        @Index(name = "idx_sim_answer1", columnList = "answer1_id"),
        @Index(name = "idx_sim_answer2", columnList = "answer2_id"),
        @Index(name = "idx_sim_status", columnList = "status")
})
public class AnswerSimilarity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "answer1_id", nullable = false)
    private Answer answer1;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "answer2_id", nullable = false)
    private Answer answer2;

    @Column(name = "similarity_score", nullable = false)
    private Double similarityScore;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private SimilarityStatus status = SimilarityStatus.NORMAL;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public AnswerSimilarity() {
    }

    public AnswerSimilarity(Answer answer1, Answer answer2, Double similarityScore) {
        this.answer1 = answer1;
        this.answer2 = answer2;
        this.similarityScore = similarityScore;
        this.status = similarityScore >= 0.80 ? SimilarityStatus.HIGH_SIMILARITY : SimilarityStatus.NORMAL;
        this.createdAt = LocalDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Answer getAnswer1() {
        return answer1;
    }

    public void setAnswer1(Answer answer1) {
        this.answer1 = answer1;
    }

    public Answer getAnswer2() {
        return answer2;
    }

    public void setAnswer2(Answer answer2) {
        this.answer2 = answer2;
    }

    public Double getSimilarityScore() {
        return similarityScore;
    }

    public void setSimilarityScore(Double similarityScore) {
        this.similarityScore = similarityScore;
    }

    public SimilarityStatus getStatus() {
        return status;
    }

    public void setStatus(SimilarityStatus status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
