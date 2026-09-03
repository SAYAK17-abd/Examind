package com.examind.backend.submission.service;

import com.examind.backend.answer.dto.AnswerResponse;
import com.examind.backend.answer.service.AnswerService;
import com.examind.backend.common.audit.AuditAction;
import com.examind.backend.common.audit.AuditService;
import com.examind.backend.common.exception.BadRequestException;
import com.examind.backend.common.exception.ExamTimeViolationException;
import com.examind.backend.common.exception.ForbiddenException;
import com.examind.backend.common.exception.ResourceNotFoundException;
import com.examind.backend.common.response.PagedResponse;
import com.examind.backend.common.util.SecurityUtils;
import com.examind.backend.exam.entity.Exam;
import com.examind.backend.exam.entity.ExamStatus;
import com.examind.backend.exam.service.ExamService;
import com.examind.backend.question.dto.QuestionResponse;
import com.examind.backend.question.service.QuestionService;
import com.examind.backend.submission.dto.StartExamResponse;
import com.examind.backend.submission.dto.SubmissionResponse;
import com.examind.backend.submission.entity.Submission;
import com.examind.backend.submission.entity.SubmissionStatus;
import com.examind.backend.submission.repository.SubmissionRepository;
import com.examind.backend.user.entity.User;
import com.examind.backend.user.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class SubmissionService {

    private final SubmissionRepository submissionRepository;
    private final ExamService examService;
    private final QuestionService questionService;
    private final AnswerService answerService;
    private final UserRepository userRepository;
    private final AuditService auditService;
    private final ApplicationEventPublisher eventPublisher;

    public SubmissionService(SubmissionRepository submissionRepository,
                             ExamService examService,
                             QuestionService questionService,
                             AnswerService answerService,
                             UserRepository userRepository,
                             AuditService auditService,
                             ApplicationEventPublisher eventPublisher) {
        this.submissionRepository = submissionRepository;
        this.examService = examService;
        this.questionService = questionService;
        this.answerService = answerService;
        this.userRepository = userRepository;
        this.auditService = auditService;
        this.eventPublisher = eventPublisher;
    }

    @Transactional
    public StartExamResponse startExam(Long examId, HttpServletRequest servletRequest) {
        Exam exam = examService.getExamEntity(examId);

        if (exam.getStatus() != ExamStatus.PUBLISHED) {
            throw new BadRequestException("This exam is not published and cannot be taken");
        }

        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(exam.getStartTime())) {
            throw new ExamTimeViolationException("Exam has not started yet. Starts at: " + exam.getStartTime());
        }
        if (now.isAfter(exam.getEndTime())) {
            throw new ExamTimeViolationException("Exam schedule has ended at: " + exam.getEndTime());
        }

        Long currentUserId = SecurityUtils.getCurrentUserId();
        User student = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUserId));

        Optional<Submission> existing = submissionRepository.findByExam_IdAndStudent_Id(examId, currentUserId);
        if (existing.isPresent()) {
            Submission sub = existing.get();
            if (sub.getStatus() != SubmissionStatus.IN_PROGRESS) {
                throw new BadRequestException("You have already submitted this exam on " + sub.getSubmittedAt());
            }
            // If already started and still in progress
            long remainingSeconds = Math.max(0, Duration.between(now, sub.getDueAt()).getSeconds());
            List<QuestionResponse> questions = questionService.getQuestionsForStudent(examId);
            return new StartExamResponse(
                    sub.getId(), exam.getId(), exam.getTitle(), sub.getStartedAt(), sub.getDueAt(),
                    exam.getDuration(), remainingSeconds, questions
            );
        }

        // Calculate due time: min of (now + duration) and exam.endTime
        LocalDateTime calculatedDueAt = now.plusMinutes(exam.getDuration());
        LocalDateTime effectiveDueAt = calculatedDueAt.isAfter(exam.getEndTime()) ? exam.getEndTime() : calculatedDueAt;

        Submission submission = new Submission(exam, student, now, effectiveDueAt);
        Submission saved = submissionRepository.save(submission);

        auditService.log(currentUserId, AuditAction.SUBMISSION_STARTED, "SUBMISSION", String.valueOf(saved.getId()),
                "Student started exam " + examId, servletRequest);

        long remainingSeconds = Math.max(0, Duration.between(now, effectiveDueAt).getSeconds());
        List<QuestionResponse> questions = questionService.getQuestionsForStudent(examId);

        return new StartExamResponse(
                saved.getId(), exam.getId(), exam.getTitle(), saved.getStartedAt(), saved.getDueAt(),
                exam.getDuration(), remainingSeconds, questions
        );
    }

    @Transactional
    public SubmissionResponse submitExam(Long submissionId, HttpServletRequest servletRequest) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Submission", "id", submissionId));

        Long currentUserId = SecurityUtils.getCurrentUserId();
        if (!submission.getStudent().getId().equals(currentUserId)) {
            throw new ForbiddenException("You cannot submit another student's exam");
        }

        if (submission.getStatus() != SubmissionStatus.IN_PROGRESS) {
            throw new BadRequestException("Exam is already submitted (Status: " + submission.getStatus() + ")");
        }

        LocalDateTime now = LocalDateTime.now();
        submission.setSubmittedAt(now);
        submission.setStatus(SubmissionStatus.SUBMITTED);
        Submission saved = submissionRepository.save(submission);

        auditService.log(currentUserId, AuditAction.SUBMISSION_COMPLETED, "SUBMISSION", String.valueOf(saved.getId()),
                "Student finalized exam submission", servletRequest);

        // Publish event for asynchronous evaluation
        eventPublisher.publishEvent(new ExamSubmittedEvent(saved.getId()));

        List<AnswerResponse> answers = answerService.getAnswersForSubmission(saved.getId());
        return SubmissionResponse.fromEntity(saved, answers);
    }

    @Transactional(readOnly = true)
    public SubmissionResponse getSubmissionById(Long submissionId) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Submission", "id", submissionId));

        Long currentUserId = SecurityUtils.getCurrentUserId();
        boolean isOwnerStudent = submission.getStudent().getId().equals(currentUserId);
        boolean isExamTeacher = submission.getExam().getCreatedBy().getId().equals(currentUserId);

        if (!isOwnerStudent && !isExamTeacher && !SecurityUtils.isAdmin()) {
            throw new ForbiddenException("You are not authorized to view this submission");
        }

        List<AnswerResponse> answers = answerService.getAnswersForSubmission(submissionId);
        return SubmissionResponse.fromEntity(submission, answers);
    }

    @Transactional(readOnly = true)
    public PagedResponse<SubmissionResponse> getSubmissionsByExam(Long examId, Pageable pageable) {
        examService.findExamAndVerifyTeacherAccess(examId);
        Page<Submission> page = submissionRepository.findByExam_Id(examId, pageable);
        return PagedResponse.from(page.map(s -> SubmissionResponse.fromEntity(s, answerService.getAnswersForSubmission(s.getId()))));
    }

    @Transactional(readOnly = true)
    public PagedResponse<SubmissionResponse> getMySubmissions(Pageable pageable) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        Page<Submission> page = submissionRepository.findByStudent_Id(currentUserId, pageable);
        return PagedResponse.from(page.map(s -> SubmissionResponse.fromEntity(s, answerService.getAnswersForSubmission(s.getId()))));
    }

    public Submission getSubmissionEntity(Long id) {
        return submissionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Submission", "id", id));
    }
}
