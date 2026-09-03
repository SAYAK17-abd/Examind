package com.examind.backend.answer.service;

import com.examind.backend.answer.dto.AnswerResponse;
import com.examind.backend.answer.dto.SaveAnswerRequest;
import com.examind.backend.answer.entity.Answer;
import com.examind.backend.answer.repository.AnswerRepository;
import com.examind.backend.common.audit.AuditAction;
import com.examind.backend.common.audit.AuditService;
import com.examind.backend.common.exception.BadRequestException;
import com.examind.backend.common.exception.ExamTimeViolationException;
import com.examind.backend.common.exception.ForbiddenException;
import com.examind.backend.common.exception.ResourceNotFoundException;
import com.examind.backend.common.util.SecurityUtils;
import com.examind.backend.question.entity.Question;
import com.examind.backend.question.repository.QuestionRepository;
import com.examind.backend.submission.entity.Submission;
import com.examind.backend.submission.entity.SubmissionStatus;
import com.examind.backend.submission.repository.SubmissionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AnswerService {

    private final AnswerRepository answerRepository;
    private final SubmissionRepository submissionRepository;
    private final QuestionRepository questionRepository;
    private final AuditService auditService;

    public AnswerService(AnswerRepository answerRepository,
                         SubmissionRepository submissionRepository,
                         QuestionRepository questionRepository,
                         AuditService auditService) {
        this.answerRepository = answerRepository;
        this.submissionRepository = submissionRepository;
        this.questionRepository = questionRepository;
        this.auditService = auditService;
    }

    @Transactional
    public AnswerResponse saveAnswer(Long submissionId, SaveAnswerRequest request) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Submission", "id", submissionId));

        Long currentUserId = SecurityUtils.getCurrentUserId();
        if (!submission.getStudent().getId().equals(currentUserId)) {
            throw new ForbiddenException("You cannot submit answers for another student's exam");
        }

        if (submission.getStatus() != SubmissionStatus.IN_PROGRESS) {
            throw new BadRequestException("Cannot edit answers: Exam submission is already " + submission.getStatus());
        }

        if (LocalDateTime.now().isAfter(submission.getDueAt())) {
            submission.setStatus(SubmissionStatus.SUBMITTED);
            submissionRepository.save(submission);
            throw new ExamTimeViolationException("Exam deadline has passed. Answers can no longer be saved.");
        }

        Question question = questionRepository.findById(request.getQuestionId())
                .orElseThrow(() -> new ResourceNotFoundException("Question", "id", request.getQuestionId()));

        if (!question.getExam().getId().equals(submission.getExam().getId())) {
            throw new BadRequestException("Question does not belong to this exam");
        }

        Answer answer = answerRepository.findBySubmission_IdAndQuestion_Id(submissionId, request.getQuestionId())
                .orElse(new Answer(submission, question, null, null));

        answer.setAnswerText(request.getAnswerText());
        answer.setAttachmentUrl(request.getAttachmentUrl());
        answer.setSubmittedAt(LocalDateTime.now());

        Answer saved = answerRepository.save(answer);

        auditService.logAction(currentUserId, AuditAction.ANSWER_SAVED, "ANSWER", String.valueOf(saved.getId()),
                "Answer saved for question " + question.getId(), null);

        return AnswerResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<AnswerResponse> getAnswersForSubmission(Long submissionId) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Submission", "id", submissionId));

        Long currentUserId = SecurityUtils.getCurrentUserId();
        boolean isOwnerStudent = submission.getStudent().getId().equals(currentUserId);
        boolean isExamTeacher = submission.getExam().getCreatedBy().getId().equals(currentUserId);

        if (!isOwnerStudent && !isExamTeacher && !SecurityUtils.isAdmin()) {
            throw new ForbiddenException("You are not authorized to view these answers");
        }

        return answerRepository.findBySubmission_Id(submissionId).stream()
                .map(AnswerResponse::fromEntity)
                .toList();
    }
}
