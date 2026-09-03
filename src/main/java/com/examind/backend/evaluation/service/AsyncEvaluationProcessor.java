package com.examind.backend.evaluation.service;

import com.examind.backend.submission.service.ExamSubmittedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Component
public class AsyncEvaluationProcessor {

    private static final Logger log = LoggerFactory.getLogger(AsyncEvaluationProcessor.class);

    private final EvaluationService evaluationService;

    public AsyncEvaluationProcessor(EvaluationService evaluationService) {
        this.evaluationService = evaluationService;
    }

    @Async("evaluationTaskExecutor")
    @EventListener
    public void handleExamSubmitted(ExamSubmittedEvent event) {
        log.info("Starting asynchronous AI evaluation for submission ID: {}", event.getSubmissionId());
        try {
            evaluationService.evaluateSubmissionAnswers(event.getSubmissionId());
            log.info("Asynchronous AI evaluation completed successfully for submission ID: {}", event.getSubmissionId());
        } catch (Exception ex) {
            log.error("Error during asynchronous AI evaluation for submission ID: {}", event.getSubmissionId(), ex);
        }
    }
}
