package com.examind.backend.evaluation.service;

import com.examind.backend.ai.client.AiServiceClient;
import com.examind.backend.ai.dto.AiEvaluationRequestDto;
import com.examind.backend.ai.dto.AiEvaluationResponseDto;
import com.examind.backend.ai.dto.AiRubricItemDto;
import com.examind.backend.answer.entity.Answer;
import com.examind.backend.answer.repository.AnswerRepository;
import com.examind.backend.common.audit.AuditAction;
import com.examind.backend.common.audit.AuditService;
import com.examind.backend.common.exception.BadRequestException;
import com.examind.backend.common.exception.ForbiddenException;
import com.examind.backend.common.exception.ResourceNotFoundException;
import com.examind.backend.common.util.SecurityUtils;
import com.examind.backend.evaluation.dto.EvaluationResponse;
import com.examind.backend.evaluation.dto.EvaluationVersionResponse;
import com.examind.backend.evaluation.dto.TeacherOverrideRequest;
import com.examind.backend.evaluation.entity.Evaluation;
import com.examind.backend.evaluation.entity.EvaluationStatus;
import com.examind.backend.evaluation.entity.EvaluationVersion;
import com.examind.backend.evaluation.repository.EvaluationRepository;
import com.examind.backend.evaluation.repository.EvaluationVersionRepository;
import com.examind.backend.question.entity.Question;
import com.examind.backend.rubric.entity.Rubric;
import com.examind.backend.rubric.service.RubricService;
import com.examind.backend.submission.entity.Submission;
import com.examind.backend.submission.entity.SubmissionStatus;
import com.examind.backend.submission.repository.SubmissionRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class EvaluationService {

    private static final Logger log = LoggerFactory.getLogger(EvaluationService.class);
    private static final double HIGH_CONFIDENCE_THRESHOLD = 0.80;

    private final EvaluationRepository evaluationRepository;
    private final EvaluationVersionRepository evaluationVersionRepository;
    private final SubmissionRepository submissionRepository;
    private final AnswerRepository answerRepository;
    private final RubricService rubricService;
    private final AiServiceClient aiServiceClient;
    private final AuditService auditService;
    private final ApplicationEventPublisher eventPublisher;

    public EvaluationService(EvaluationRepository evaluationRepository,
                             EvaluationVersionRepository evaluationVersionRepository,
                             SubmissionRepository submissionRepository,
                             AnswerRepository answerRepository,
                             RubricService rubricService,
                             AiServiceClient aiServiceClient,
                             AuditService auditService,
                             ApplicationEventPublisher eventPublisher) {
        this.evaluationRepository = evaluationRepository;
        this.evaluationVersionRepository = evaluationVersionRepository;
        this.submissionRepository = submissionRepository;
        this.answerRepository = answerRepository;
        this.rubricService = rubricService;
        this.aiServiceClient = aiServiceClient;
        this.auditService = auditService;
        this.eventPublisher = eventPublisher;
    }

    @Transactional
    public void evaluateSubmissionAnswers(Long submissionId) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Submission", "id", submissionId));

        submission.setStatus(SubmissionStatus.EVALUATING);
        submission.setEvaluationStatus(EvaluationStatus.PROCESSING);
        submissionRepository.save(submission);

        List<Answer> answers = answerRepository.findBySubmission_Id(submissionId);
        double totalScore = 0.0;
        boolean hasLowConfidence = false;

        for (Answer answer : answers) {
            Question question = answer.getQuestion();
            Rubric rubric = rubricService.getRubricEntityByQuestionId(question.getId());

            List<AiRubricItemDto> rubricItems = new ArrayList<>();
            if (rubric != null && rubric.getCriteria() != null) {
                rubric.getCriteria().forEach(c ->
                        rubricItems.add(new AiRubricItemDto(c.getCriterion(), c.getMaxMarks()))
                );
            }

            AiEvaluationRequestDto req = new AiEvaluationRequestDto(
                    question.getQuestionText(),
                    answer.getAnswerText(),
                    question.getReferenceAnswer(),
                    question.getMaxMarks(),
                    rubricItems
            );

            AiEvaluationResponseDto aiResponse = aiServiceClient.evaluateAnswer(req);

            EvaluationStatus evalStatus = (aiResponse.getConfidence() >= HIGH_CONFIDENCE_THRESHOLD)
                    ? EvaluationStatus.AUTO_EVALUATED
                    : EvaluationStatus.REVIEW_REQUIRED;

            if (evalStatus == EvaluationStatus.REVIEW_REQUIRED) {
                hasLowConfidence = true;
            }

            // Save or update Evaluation
            Evaluation evaluation = evaluationRepository.findByAnswer_Id(answer.getId())
                    .orElse(new Evaluation());

            evaluation.setAnswer(answer);
            evaluation.setScore(aiResponse.getScore());
            evaluation.setMaxScore(question.getMaxMarks());
            evaluation.setConfidence(aiResponse.getConfidence());
            evaluation.setCorrectness(aiResponse.getCorrectness());
            evaluation.setCompleteness(aiResponse.getCompleteness());
            evaluation.setSemanticSimilarity(aiResponse.getSemanticSimilarity());
            evaluation.setConceptCoverage(aiResponse.getConceptCoverage());
            evaluation.setFeedback(aiResponse.getFeedback());
            evaluation.setStatus(evalStatus);
            evaluation.setEvaluatedBy("AI_MODEL_V1");
            evaluation.setVersion(1);
            evaluation.setEvaluatedAt(LocalDateTime.now());

            Evaluation savedEval = evaluationRepository.save(evaluation);

            // Record initial version
            EvaluationVersion version1 = new EvaluationVersion(
                    savedEval, 1, savedEval.getScore(), savedEval.getConfidence(),
                    savedEval.getStatus(), savedEval.getFeedback(), "Initial AI evaluation", "AI_SERVICE"
            );
            evaluationVersionRepository.save(version1);

            totalScore += savedEval.getScore();
        }

        submission.setTotalScore(Math.round(totalScore * 10.0) / 10.0);
        if (hasLowConfidence) {
            submission.setStatus(SubmissionStatus.REVIEW_REQUIRED);
            submission.setEvaluationStatus(EvaluationStatus.REVIEW_REQUIRED);
        } else {
            submission.setStatus(SubmissionStatus.EVALUATED);
            submission.setEvaluationStatus(EvaluationStatus.AUTO_EVALUATED);
        }

        Submission savedSub = submissionRepository.save(submission);
        log.info("Evaluated submission {}: Total Score={}, Status={}", submissionId, savedSub.getTotalScore(), savedSub.getStatus());

        // Publish event for result calculation
        eventPublisher.publishEvent(new EvaluationCompletedEvent(savedSub.getId()));
    }

    @Transactional(readOnly = true)
    public EvaluationResponse getEvaluationById(Long id) {
        Evaluation eval = evaluationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Evaluation", "id", id));
        verifyTeacherAccess(eval.getAnswer().getQuestion().getExam().getId());
        return EvaluationResponse.fromEntity(eval);
    }

    @Transactional
    public EvaluationResponse approveEvaluation(Long id, HttpServletRequest servletRequest) {
        Evaluation eval = evaluationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Evaluation", "id", id));

        verifyTeacherAccess(eval.getAnswer().getQuestion().getExam().getId());

        eval.setStatus(EvaluationStatus.APPROVED);
        eval.setEvaluatedBy(SecurityUtils.getCurrentUserEmail());
        Evaluation saved = evaluationRepository.save(eval);

        // Record version
        int nextVersion = eval.getVersion() + 1;
        eval.setVersion(nextVersion);
        EvaluationVersion approvedVersion = new EvaluationVersion(
                saved, nextVersion, saved.getScore(), 1.0, EvaluationStatus.APPROVED,
                saved.getFeedback(), "Teacher approved AI evaluation", SecurityUtils.getCurrentUserEmail()
        );
        evaluationVersionRepository.save(approvedVersion);

        auditService.log(SecurityUtils.getCurrentUserId(), AuditAction.EVALUATION_APPROVED, "EVALUATION",
                String.valueOf(id), "Approved evaluation score " + saved.getScore(), servletRequest);

        recalculateSubmissionScore(saved.getAnswer().getSubmission().getId());

        return EvaluationResponse.fromEntity(saved);
    }

    @Transactional
    public EvaluationResponse overrideEvaluation(Long id, TeacherOverrideRequest request, HttpServletRequest servletRequest) {
        Evaluation eval = evaluationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Evaluation", "id", id));

        verifyTeacherAccess(eval.getAnswer().getQuestion().getExam().getId());

        if (request.getScore() > eval.getMaxScore()) {
            throw new BadRequestException("Override score (" + request.getScore() +
                    ") cannot exceed question maximum marks (" + eval.getMaxScore() + ")");
        }

        int nextVersion = eval.getVersion() + 1;
        eval.setScore(request.getScore());
        eval.setConfidence(1.0); // Human override is 100% authoritative
        eval.setStatus(EvaluationStatus.OVERRIDDEN);
        eval.setEvaluatedBy(SecurityUtils.getCurrentUserEmail());
        eval.setVersion(nextVersion);
        if (request.getFeedback() != null && !request.getFeedback().isBlank()) {
            eval.setFeedback(request.getFeedback());
        }

        Evaluation saved = evaluationRepository.save(eval);

        EvaluationVersion version = new EvaluationVersion(
                saved, nextVersion, saved.getScore(), 1.0, EvaluationStatus.OVERRIDDEN,
                saved.getFeedback(), request.getReason(), SecurityUtils.getCurrentUserEmail()
        );
        evaluationVersionRepository.save(version);

        auditService.log(SecurityUtils.getCurrentUserId(), AuditAction.EVALUATION_OVERRIDDEN, "EVALUATION",
                String.valueOf(id), "Override score to " + request.getScore() + ". Reason: " + request.getReason(), servletRequest);

        recalculateSubmissionScore(saved.getAnswer().getSubmission().getId());

        return EvaluationResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<EvaluationVersionResponse> getEvaluationHistory(Long id) {
        Evaluation eval = evaluationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Evaluation", "id", id));
        verifyTeacherAccess(eval.getAnswer().getQuestion().getExam().getId());

        return evaluationVersionRepository.findByEvaluation_IdOrderByVersionNumberAsc(id).stream()
                .map(EvaluationVersionResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<EvaluationResponse> getEvaluationsBySubmissionId(Long submissionId) {
        return evaluationRepository.findByAnswer_Submission_Id(submissionId).stream()
                .map(EvaluationResponse::fromEntity)
                .toList();
    }

    private void recalculateSubmissionScore(Long submissionId) {
        Submission submission = submissionRepository.findById(submissionId).orElse(null);
        if (submission == null) return;

        List<Evaluation> evals = evaluationRepository.findByAnswer_Submission_Id(submissionId);
        double total = evals.stream().mapToDouble(Evaluation::getScore).sum();
        submission.setTotalScore(Math.round(total * 10.0) / 10.0);

        boolean allResolved = evals.stream().noneMatch(e -> e.getStatus() == EvaluationStatus.REVIEW_REQUIRED);
        if (allResolved) {
            submission.setStatus(SubmissionStatus.FINALIZED);
            submission.setEvaluationStatus(EvaluationStatus.APPROVED);
        }
        submissionRepository.save(submission);

        eventPublisher.publishEvent(new EvaluationCompletedEvent(submissionId));
    }

    private void verifyTeacherAccess(Long examId) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        Submission sub = submissionRepository.findAll().stream()
                .filter(s -> s.getExam().getId().equals(examId))
                .findFirst().orElse(null);

        if (sub != null && !sub.getExam().getCreatedBy().getId().equals(currentUserId) && !SecurityUtils.isAdmin()) {
            throw new ForbiddenException("You are not authorized to review evaluations for this exam");
        }
    }
}
