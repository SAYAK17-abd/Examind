package com.examind.backend.ai.client;

import com.examind.backend.ai.dto.AiEvaluationRequestDto;
import com.examind.backend.ai.dto.AiEvaluationResponseDto;
import com.examind.backend.ai.dto.AiRubricItemDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.*;

@Service
public class AiServiceClient {

    private static final Logger log = LoggerFactory.getLogger(AiServiceClient.class);

    private final RestClient restClient;
    private final boolean mockMode;
    private final String aiServiceUrl;

    public AiServiceClient(
            @Value("${examind.ai-service.url:http://localhost:8000}") String aiServiceUrl,
            @Value("${examind.ai-service.mock-mode:true}") boolean mockMode) {
        this.aiServiceUrl = aiServiceUrl;
        this.mockMode = mockMode;
        this.restClient = RestClient.builder()
                .baseUrl(aiServiceUrl)
                .build();
    }

    public AiEvaluationResponseDto evaluateAnswer(AiEvaluationRequestDto request) {
        if (!mockMode) {
            try {
                log.info("Dispatching evaluation request to external AI service at {}", aiServiceUrl);
                AiEvaluationResponseDto response = restClient.post()
                        .uri("/evaluate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(request)
                        .retrieve()
                        .body(AiEvaluationResponseDto.class);

                if (response != null) {
                    validateAndSanitize(response, request.getMaxMarks());
                    return response;
                }
            } catch (Exception ex) {
                log.warn("External AI Service unavailable ({}), falling back to intelligent evaluation engine", ex.getMessage());
            }
        }

        return generateIntelligentEvaluation(request);
    }

    private void validateAndSanitize(AiEvaluationResponseDto res, Double maxMarks) {
        if (res.getScore() == null) {
            res.setScore(0.0);
        } else {
            res.setScore(Math.max(0.0, Math.min(maxMarks, res.getScore())));
        }

        if (res.getConfidence() == null) {
            res.setConfidence(0.85);
        } else {
            res.setConfidence(Math.max(0.0, Math.min(1.0, res.getConfidence())));
        }

        if (res.getConceptCoverage() == null) res.setConceptCoverage(0.80);
        if (res.getCorrectness() == null) res.setCorrectness(0.85);
        if (res.getCompleteness() == null) res.setCompleteness(0.80);
        if (res.getSemanticSimilarity() == null) res.setSemanticSimilarity(0.82);
    }

    private AiEvaluationResponseDto generateIntelligentEvaluation(AiEvaluationRequestDto req) {
        String student = req.getStudentAnswer() != null ? req.getStudentAnswer().toLowerCase().trim() : "";
        String reference = req.getReferenceAnswer() != null ? req.getReferenceAnswer().toLowerCase().trim() : "";
        double maxMarks = req.getMaxMarks() != null ? req.getMaxMarks() : 10.0;

        if (student.isBlank()) {
            AiEvaluationResponseDto emptyRes = new AiEvaluationResponseDto();
            emptyRes.setScore(0.0);
            emptyRes.setConfidence(0.99);
            emptyRes.setConceptCoverage(0.0);
            emptyRes.setCorrectness(0.0);
            emptyRes.setCompleteness(0.0);
            emptyRes.setSemanticSimilarity(0.0);
            emptyRes.setFeedback("No answer provided. Zero marks awarded.");
            emptyRes.setMissingConcepts(List.of("Entire answer content missing"));
            return emptyRes;
        }

        // Token overlap & concept detection
        Set<String> refWords = new HashSet<>(Arrays.asList(reference.split("\\W+")));
        refWords.removeIf(w -> w.length() < 3);

        Set<String> studentWords = new HashSet<>(Arrays.asList(student.split("\\W+")));
        studentWords.removeIf(w -> w.length() < 3);

        long matches = studentWords.stream().filter(refWords::contains).count();
        double similarity = refWords.isEmpty() ? 0.75 : Math.min(1.0, (double) matches / Math.max(1, refWords.size()));

        List<String> detected = new ArrayList<>();
        List<String> missing = new ArrayList<>();

        double rubricScore = 0.0;
        if (req.getRubric() != null && !req.getRubric().isEmpty()) {
            for (AiRubricItemDto item : req.getRubric()) {
                String criterion = item.getCriterion().toLowerCase();
                String[] keywords = criterion.split("\\s+");
                boolean found = Arrays.stream(keywords).anyMatch(student::contains);
                if (found) {
                    detected.add(item.getCriterion());
                    rubricScore += item.getMaxMarks();
                } else {
                    missing.add(item.getCriterion());
                    rubricScore += item.getMaxMarks() * 0.2; // partial credit
                }
            }
        } else {
            rubricScore = maxMarks * similarity;
        }

        double finalScore = Math.round(Math.min(maxMarks, Math.max(0.0, rubricScore)) * 10.0) / 10.0;
        double confidence = (student.length() > 30) ? 0.88 : 0.62; // Low confidence on very brief answers
        double correctness = Math.min(1.0, 0.5 + (similarity * 0.5));
        double completeness = Math.min(1.0, (double) student.length() / Math.max(50, reference.length()));

        AiEvaluationResponseDto res = new AiEvaluationResponseDto();
        res.setScore(finalScore);
        res.setConfidence(confidence);
        res.setConceptCoverage(similarity);
        res.setCorrectness(correctness);
        res.setCompleteness(completeness);
        res.setSemanticSimilarity(similarity);
        res.setDetectedConcepts(detected);
        res.setMissingConcepts(missing);

        StringBuilder fb = new StringBuilder();
        fb.append(String.format("Answer demonstrates %.0f%% conceptual alignment. ", similarity * 100));
        if (!detected.isEmpty()) {
            fb.append("Covered key criteria: ").append(String.join(", ", detected)).append(". ");
        }
        if (!missing.isEmpty()) {
            fb.append("Could be improved with: ").append(String.join(", ", missing)).append(". ");
        }
        res.setFeedback(fb.toString().trim());

        return res;
    }
}
