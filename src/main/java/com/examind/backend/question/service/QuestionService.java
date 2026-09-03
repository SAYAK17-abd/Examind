package com.examind.backend.question.service;

import com.examind.backend.common.audit.AuditAction;
import com.examind.backend.common.audit.AuditService;
import com.examind.backend.common.exception.BadRequestException;
import com.examind.backend.common.exception.ForbiddenException;
import com.examind.backend.common.exception.ResourceNotFoundException;
import com.examind.backend.common.util.SecurityUtils;
import com.examind.backend.exam.entity.Exam;
import com.examind.backend.exam.entity.ExamStatus;
import com.examind.backend.exam.service.ExamService;
import com.examind.backend.question.dto.CreateQuestionRequest;
import com.examind.backend.question.dto.QuestionResponse;
import com.examind.backend.question.entity.Question;
import com.examind.backend.question.repository.QuestionRepository;
import com.examind.backend.rubric.entity.Rubric;
import com.examind.backend.rubric.service.RubricService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class QuestionService {

    private final QuestionRepository questionRepository;
    private final ExamService examService;
    private final RubricService rubricService;
    private final AuditService auditService;

    public QuestionService(QuestionRepository questionRepository,
                           ExamService examService,
                           RubricService rubricService,
                           AuditService auditService) {
        this.questionRepository = questionRepository;
        this.examService = examService;
        this.rubricService = rubricService;
        this.auditService = auditService;
    }

    @Transactional
    public QuestionResponse addQuestion(Long examId, CreateQuestionRequest request, HttpServletRequest servletRequest) {
        Exam exam = examService.findExamAndVerifyTeacherAccess(examId);

        if (exam.getStatus() == ExamStatus.COMPLETED || exam.getStatus() == ExamStatus.ARCHIVED) {
            throw new BadRequestException("Cannot add questions to an exam in " + exam.getStatus() + " state");
        }

        int orderNumber = request.getOrderNumber() != null ? request.getOrderNumber()
                : (int) questionRepository.countByExam_Id(examId) + 1;

        Question question = new Question(
                exam,
                request.getQuestionText().trim(),
                request.getQuestionType(),
                request.getMaxMarks(),
                request.getReferenceAnswer(),
                request.getTopic(),
                request.getDifficulty(),
                orderNumber
        );

        Question saved = questionRepository.save(question);

        Rubric rubric = null;
        if (request.getRubric() != null) {
            rubricService.saveRubric(saved.getId(), request.getRubric());
            rubric = rubricService.getRubricEntityByQuestionId(saved.getId());
        }

        auditService.log(SecurityUtils.getCurrentUserId(), AuditAction.QUESTION_CREATED, "QUESTION",
                String.valueOf(saved.getId()), "Question added to exam " + examId, servletRequest);

        return QuestionResponse.fromEntity(saved, rubric);
    }

    @Transactional(readOnly = true)
    public List<QuestionResponse> getQuestionsForTeacher(Long examId) {
        examService.findExamAndVerifyTeacherAccess(examId);
        List<Question> questions = questionRepository.findByExam_IdOrderByOrderNumberAsc(examId);
        return questions.stream()
                .map(q -> QuestionResponse.fromEntity(q, rubricService.getRubricEntityByQuestionId(q.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<QuestionResponse> getQuestionsForStudent(Long examId) {
        Exam exam = examService.getExamEntity(examId);
        if (exam.getStatus() != ExamStatus.PUBLISHED && !SecurityUtils.isAdmin()) {
            throw new ForbiddenException("Cannot access questions for an unpublished exam");
        }

        List<Question> questions = questionRepository.findByExam_IdOrderByOrderNumberAsc(examId);
        return questions.stream()
                .map(QuestionResponse::forStudent)
                .toList();
    }

    @Transactional(readOnly = true)
    public QuestionResponse getQuestionById(Long questionId) {
        Question question = getQuestionEntity(questionId);
        examService.findExamAndVerifyTeacherAccess(question.getExam().getId());
        Rubric rubric = rubricService.getRubricEntityByQuestionId(questionId);
        return QuestionResponse.fromEntity(question, rubric);
    }

    @Transactional
    public QuestionResponse updateQuestion(Long questionId, CreateQuestionRequest request, HttpServletRequest servletRequest) {
        Question question = getQuestionEntity(questionId);
        Exam exam = examService.findExamAndVerifyTeacherAccess(question.getExam().getId());

        if (exam.getStatus() == ExamStatus.COMPLETED || exam.getStatus() == ExamStatus.ARCHIVED) {
            throw new BadRequestException("Cannot edit questions of an exam in " + exam.getStatus() + " state");
        }

        question.setQuestionText(request.getQuestionText().trim());
        question.setQuestionType(request.getQuestionType());
        question.setMaxMarks(request.getMaxMarks());
        question.setReferenceAnswer(request.getReferenceAnswer());
        question.setTopic(request.getTopic());
        if (request.getDifficulty() != null) {
            question.setDifficulty(request.getDifficulty());
        }
        if (request.getOrderNumber() != null) {
            question.setOrderNumber(request.getOrderNumber());
        }

        Question updated = questionRepository.save(question);

        Rubric rubric = null;
        if (request.getRubric() != null) {
            rubricService.saveRubric(updated.getId(), request.getRubric());
            rubric = rubricService.getRubricEntityByQuestionId(updated.getId());
        }

        auditService.log(SecurityUtils.getCurrentUserId(), AuditAction.QUESTION_UPDATED, "QUESTION",
                String.valueOf(questionId), "Question updated for exam " + exam.getId(), servletRequest);

        return QuestionResponse.fromEntity(updated, rubric);
    }

    @Transactional
    public void deleteQuestion(Long questionId, HttpServletRequest servletRequest) {
        Question question = getQuestionEntity(questionId);
        examService.findExamAndVerifyTeacherAccess(question.getExam().getId());

        questionRepository.delete(question);

        auditService.log(SecurityUtils.getCurrentUserId(), AuditAction.QUESTION_DELETED, "QUESTION",
                String.valueOf(questionId), "Question deleted", servletRequest);
    }

    public Question getQuestionEntity(Long questionId) {
        return questionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Question", "id", questionId));
    }
}
