package com.examind.backend.analytics.service;

import com.examind.backend.analytics.dto.ExamAnalyticsResponse;
import com.examind.backend.analytics.dto.QuestionAnalysisResponse;
import com.examind.backend.analytics.dto.StudentPerformanceResponse;
import com.examind.backend.common.exception.ResourceNotFoundException;
import com.examind.backend.evaluation.entity.EvaluationStatus;
import com.examind.backend.evaluation.repository.EvaluationRepository;
import com.examind.backend.exam.entity.Exam;
import com.examind.backend.exam.service.ExamService;
import com.examind.backend.question.entity.Question;
import com.examind.backend.question.repository.QuestionRepository;
import com.examind.backend.result.entity.Result;
import com.examind.backend.result.repository.ResultRepository;
import com.examind.backend.user.entity.User;
import com.examind.backend.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    private final ResultRepository resultRepository;
    private final QuestionRepository questionRepository;
    private final EvaluationRepository evaluationRepository;
    private final ExamService examService;
    private final UserRepository userRepository;

    public AnalyticsService(ResultRepository resultRepository,
                            QuestionRepository questionRepository,
                            EvaluationRepository evaluationRepository,
                            ExamService examService,
                            UserRepository userRepository) {
        this.resultRepository = resultRepository;
        this.questionRepository = questionRepository;
        this.evaluationRepository = evaluationRepository;
        this.examService = examService;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public ExamAnalyticsResponse getExamAnalytics(Long examId) {
        Exam exam = examService.findExamAndVerifyTeacherAccess(examId);
        List<Result> results = resultRepository.findByExam_Id(examId);

        ExamAnalyticsResponse res = new ExamAnalyticsResponse();
        res.setExamId(examId);
        res.setExamTitle(exam.getTitle());
        res.setTotalSubmissions(results.size());

        if (results.isEmpty()) {
            res.setAverageScore(0.0);
            res.setHighestScore(0.0);
            res.setLowestScore(0.0);
            res.setMedianScore(0.0);
            res.setPassPercentage(0.0);
            res.setGradeDistribution(Collections.emptyMap());
            res.setAverageAiConfidence(0.0);
            res.setTeacherReviewedCount(0);
            res.setAutoEvaluatedCount(0);
            return res;
        }

        List<Double> scores = results.stream()
                .map(Result::getObtainedMarks)
                .sorted()
                .toList();

        double avg = scores.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
        double max = scores.get(scores.size() - 1);
        double min = scores.get(0);
        double median = (scores.size() % 2 == 1)
                ? scores.get(scores.size() / 2)
                : (scores.get(scores.size() / 2 - 1) + scores.get(scores.size() / 2)) / 2.0;

        long passedCount = results.stream().filter(Result::getPassed).count();
        double passPct = (double) passedCount / results.size() * 100.0;

        Map<String, Long> gradeDist = results.stream()
                .collect(Collectors.groupingBy(Result::getGrade, Collectors.counting()));

        Double avgConfidence = evaluationRepository.calculateAverageConfidenceByExam(examId);
        long reviewedCount = evaluationRepository.countByAnswer_Question_Exam_IdAndStatus(examId, EvaluationStatus.OVERRIDDEN)
                + evaluationRepository.countByAnswer_Question_Exam_IdAndStatus(examId, EvaluationStatus.APPROVED);
        long autoCount = evaluationRepository.countByAnswer_Question_Exam_IdAndStatus(examId, EvaluationStatus.AUTO_EVALUATED);

        res.setAverageScore(Math.round(avg * 100.0) / 100.0);
        res.setHighestScore(max);
        res.setLowestScore(min);
        res.setMedianScore(Math.round(median * 100.0) / 100.0);
        res.setPassPercentage(Math.round(passPct * 100.0) / 100.0);
        res.setGradeDistribution(gradeDist);
        res.setAverageAiConfidence(avgConfidence != null ? Math.round(avgConfidence * 100.0) / 100.0 : 0.85);
        res.setTeacherReviewedCount(reviewedCount);
        res.setAutoEvaluatedCount(autoCount);

        return res;
    }

    @Transactional(readOnly = true)
    public List<QuestionAnalysisResponse> getQuestionAnalysis(Long examId) {
        examService.findExamAndVerifyTeacherAccess(examId);
        List<Question> questions = questionRepository.findByExam_IdOrderByOrderNumberAsc(examId);

        List<QuestionAnalysisResponse> responses = new ArrayList<>();
        for (Question q : questions) {
            Double avg = evaluationRepository.calculateAverageScoreByQuestion(q.getId());
            double averageScore = avg != null ? Math.round(avg * 100.0) / 100.0 : 0.0;
            double successRate = q.getMaxMarks() > 0 ? Math.round((averageScore / q.getMaxMarks() * 100.0) * 10.0) / 10.0 : 0.0;

            responses.add(new QuestionAnalysisResponse(
                    q.getId(),
                    q.getQuestionText(),
                    q.getQuestionType().name(),
                    q.getMaxMarks(),
                    averageScore,
                    successRate,
                    q.getTopic(),
                    q.getDifficulty() != null ? q.getDifficulty().name() : "MEDIUM"
            ));
        }
        return responses;
    }

    @Transactional(readOnly = true)
    public StudentPerformanceResponse getStudentPerformance(Long studentId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student", "id", studentId));

        List<Result> results = resultRepository.findByStudent_Id(studentId);
        if (results.isEmpty()) {
            return new StudentPerformanceResponse(studentId, student.getFullName(), student.getEmail(), 0, 0.0, 0, "N/A");
        }

        double avgPct = results.stream().mapToDouble(Result::getPercentage).average().orElse(0.0);
        long passed = results.stream().filter(Result::getPassed).count();
        String overallGrade = Result.calculateGrade(avgPct);

        return new StudentPerformanceResponse(
                studentId,
                student.getFullName(),
                student.getEmail(),
                results.size(),
                Math.round(avgPct * 100.0) / 100.0,
                passed,
                overallGrade
        );
    }
}
