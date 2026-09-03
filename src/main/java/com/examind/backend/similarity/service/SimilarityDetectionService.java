package com.examind.backend.similarity.service;

import com.examind.backend.answer.entity.Answer;
import com.examind.backend.answer.repository.AnswerRepository;
import com.examind.backend.exam.entity.Exam;
import com.examind.backend.exam.service.ExamService;
import com.examind.backend.question.entity.Question;
import com.examind.backend.question.repository.QuestionRepository;
import com.examind.backend.similarity.dto.SimilarityReportDto;
import com.examind.backend.similarity.entity.AnswerSimilarity;
import com.examind.backend.similarity.entity.SimilarityStatus;
import com.examind.backend.similarity.repository.AnswerSimilarityRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class SimilarityDetectionService {

    private static final Logger log = LoggerFactory.getLogger(SimilarityDetectionService.class);

    private final AnswerSimilarityRepository similarityRepository;
    private final AnswerRepository answerRepository;
    private final QuestionRepository questionRepository;
    private final ExamService examService;

    public SimilarityDetectionService(AnswerSimilarityRepository similarityRepository,
                                      AnswerRepository answerRepository,
                                      QuestionRepository questionRepository,
                                      ExamService examService) {
        this.similarityRepository = similarityRepository;
        this.answerRepository = answerRepository;
        this.questionRepository = questionRepository;
        this.examService = examService;
    }

    @Transactional
    public List<SimilarityReportDto> runSimilarityCheck(Long examId) {
        examService.findExamAndVerifyTeacherAccess(examId);

        List<Question> questions = questionRepository.findByExam_Id(examId);
        List<AnswerSimilarity> newSimilarities = new ArrayList<>();

        for (Question question : questions) {
            List<Answer> answers = answerRepository.findByQuestion_Id(question.getId());
            if (answers.size() < 2) continue;

            for (int i = 0; i < answers.size(); i++) {
                for (int j = i + 1; j < answers.size(); j++) {
                    Answer a1 = answers.get(i);
                    Answer a2 = answers.get(j);

                    if (a1.getSubmission().getStudent().getId().equals(a2.getSubmission().getStudent().getId())) {
                        continue;
                    }

                    double score = computeSimilarity(a1.getAnswerText(), a2.getAnswerText());
                    if (score >= 0.50) { // Record anything with notable similarity
                        AnswerSimilarity sim = new AnswerSimilarity(a1, a2, Math.round(score * 100.0) / 100.0);
                        newSimilarities.add(sim);
                    }
                }
            }
        }

        List<AnswerSimilarity> saved = similarityRepository.saveAll(newSimilarities);
        log.info("Completed similarity check for exam {}: found {} correlated answer pairs", examId, saved.size());

        return saved.stream()
                .map(SimilarityReportDto::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<SimilarityReportDto> getSimilarityReports(Long examId, Boolean highSimilarityOnly) {
        examService.findExamAndVerifyTeacherAccess(examId);

        List<AnswerSimilarity> list;
        if (Boolean.TRUE.equals(highSimilarityOnly)) {
            list = similarityRepository.findByExamIdAndStatus(examId, SimilarityStatus.HIGH_SIMILARITY);
        } else {
            list = similarityRepository.findByExamId(examId);
        }

        return list.stream()
                .map(SimilarityReportDto::fromEntity)
                .toList();
    }

    public static double computeSimilarity(String text1, String text2) {
        if (text1 == null || text2 == null || text1.isBlank() || text2.isBlank()) {
            return 0.0;
        }

        Set<String> set1 = tokenizeToNgrams(text1.toLowerCase(), 2);
        Set<String> set2 = tokenizeToNgrams(text2.toLowerCase(), 2);

        if (set1.isEmpty() || set2.isEmpty()) return 0.0;

        Set<String> intersection = new HashSet<>(set1);
        intersection.retainAll(set2);

        Set<String> union = new HashSet<>(set1);
        union.addAll(set2);

        return (double) intersection.size() / union.size();
    }

    private static Set<String> tokenizeToNgrams(String text, int n) {
        String[] words = text.split("\\W+");
        Set<String> ngrams = new HashSet<>();
        for (int i = 0; i <= words.length - n; i++) {
            StringBuilder sb = new StringBuilder();
            for (int j = 0; j < n; j++) {
                if (j > 0) sb.append(" ");
                sb.append(words[i + j]);
            }
            ngrams.add(sb.toString());
        }
        if (ngrams.isEmpty() && words.length > 0) {
            ngrams.addAll(Arrays.asList(words));
        }
        return ngrams;
    }
}
