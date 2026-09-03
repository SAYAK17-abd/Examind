package com.examind.backend.exam.service;

import com.examind.backend.common.audit.AuditAction;
import com.examind.backend.common.audit.AuditService;
import com.examind.backend.common.exception.BadRequestException;
import com.examind.backend.common.exception.ForbiddenException;
import com.examind.backend.common.exception.ResourceNotFoundException;
import com.examind.backend.common.response.PagedResponse;
import com.examind.backend.common.util.SecurityUtils;
import com.examind.backend.exam.dto.CreateExamRequest;
import com.examind.backend.exam.dto.ExamResponse;
import com.examind.backend.exam.dto.ExamSummaryResponse;
import com.examind.backend.exam.dto.UpdateExamRequest;
import com.examind.backend.exam.entity.Exam;
import com.examind.backend.exam.entity.ExamStatus;
import com.examind.backend.exam.repository.ExamRepository;
import com.examind.backend.user.entity.User;
import com.examind.backend.user.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;

@Service
public class ExamService {

    private final ExamRepository examRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    public ExamService(ExamRepository examRepository, UserRepository userRepository, AuditService auditService) {
        this.examRepository = examRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    @Transactional
    public ExamResponse createExam(CreateExamRequest request, HttpServletRequest servletRequest) {
        validateExamTiming(request.getStartTime(), request.getEndTime(), request.getDuration());

        Long currentUserId = SecurityUtils.getCurrentUserId();
        User teacher = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUserId));

        Exam exam = new Exam(
                request.getTitle().trim(),
                request.getDescription(),
                request.getDuration(),
                request.getStartTime(),
                request.getEndTime(),
                request.getTotalMarks(),
                request.getPassingMarks(),
                teacher
        );

        Exam saved = examRepository.save(exam);

        auditService.log(currentUserId, AuditAction.EXAM_CREATED, "EXAM", String.valueOf(saved.getId()),
                "Exam created: " + saved.getTitle(), servletRequest);

        return ExamResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public PagedResponse<ExamSummaryResponse> getTeacherExams(Pageable pageable) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        Page<Exam> page;
        if (SecurityUtils.isAdmin()) {
            page = examRepository.findAll(pageable);
        } else {
            page = examRepository.findByCreatedBy_Id(currentUserId, pageable);
        }
        return PagedResponse.from(page.map(ExamSummaryResponse::fromEntity));
    }

    @Transactional(readOnly = true)
    public ExamResponse getExamByIdForTeacher(Long id) {
        Exam exam = findExamAndVerifyTeacherAccess(id);
        return ExamResponse.fromEntity(exam);
    }

    @Transactional
    public ExamResponse updateExam(Long id, UpdateExamRequest request, HttpServletRequest servletRequest) {
        Exam exam = findExamAndVerifyTeacherAccess(id);

        if (exam.getStatus() == ExamStatus.COMPLETED || exam.getStatus() == ExamStatus.ARCHIVED) {
            throw new BadRequestException("Cannot edit exam in " + exam.getStatus() + " state");
        }

        validateExamTiming(request.getStartTime(), request.getEndTime(), request.getDuration());

        exam.setTitle(request.getTitle().trim());
        exam.setDescription(request.getDescription());
        exam.setDuration(request.getDuration());
        exam.setStartTime(request.getStartTime());
        exam.setEndTime(request.getEndTime());
        exam.setTotalMarks(request.getTotalMarks());
        exam.setPassingMarks(request.getPassingMarks());

        Exam updated = examRepository.save(exam);

        auditService.log(SecurityUtils.getCurrentUserId(), AuditAction.EXAM_UPDATED, "EXAM", String.valueOf(id),
                "Exam updated: " + updated.getTitle(), servletRequest);

        return ExamResponse.fromEntity(updated);
    }

    @Transactional
    public void deleteExam(Long id, HttpServletRequest servletRequest) {
        Exam exam = findExamAndVerifyTeacherAccess(id);

        if (exam.getStatus() == ExamStatus.PUBLISHED || exam.getStatus() == ExamStatus.ONGOING) {
            throw new BadRequestException("Cannot delete published or ongoing exam. Please unpublish or archive first.");
        }

        examRepository.delete(exam);

        auditService.log(SecurityUtils.getCurrentUserId(), AuditAction.EXAM_DELETED, "EXAM", String.valueOf(id),
                "Exam deleted: " + exam.getTitle(), servletRequest);
    }

    @Transactional
    public ExamResponse publishExam(Long id, HttpServletRequest servletRequest) {
        Exam exam = findExamAndVerifyTeacherAccess(id);

        if (exam.hasExpired()) {
            throw new BadRequestException("Cannot publish an exam whose end time has already passed");
        }

        exam.setStatus(ExamStatus.PUBLISHED);
        Exam saved = examRepository.save(exam);

        auditService.log(SecurityUtils.getCurrentUserId(), AuditAction.EXAM_PUBLISHED, "EXAM", String.valueOf(id),
                "Exam published: " + saved.getTitle(), servletRequest);

        return ExamResponse.fromEntity(saved);
    }

    @Transactional
    public ExamResponse unpublishExam(Long id, HttpServletRequest servletRequest) {
        Exam exam = findExamAndVerifyTeacherAccess(id);

        exam.setStatus(ExamStatus.DRAFT);
        Exam saved = examRepository.save(exam);

        auditService.log(SecurityUtils.getCurrentUserId(), AuditAction.EXAM_UNPUBLISHED, "EXAM", String.valueOf(id),
                "Exam unpublished: " + saved.getTitle(), servletRequest);

        return ExamResponse.fromEntity(saved);
    }

    // Student Access Methods
    @Transactional(readOnly = true)
    public PagedResponse<ExamSummaryResponse> getAvailableExamsForStudents(Pageable pageable) {
        Page<Exam> page = examRepository.findAvailableExamsForStudents(ExamStatus.PUBLISHED, LocalDateTime.now(), pageable);
        return PagedResponse.from(page.map(ExamSummaryResponse::fromEntity));
    }

    @Transactional(readOnly = true)
    public ExamResponse getExamByIdForStudent(Long id) {
        Exam exam = examRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Exam", "id", id));

        if (exam.getStatus() != ExamStatus.PUBLISHED && !SecurityUtils.isAdmin() && !SecurityUtils.isTeacher()) {
            throw new ForbiddenException("This exam is not published and cannot be accessed");
        }

        return ExamResponse.fromEntity(exam);
    }

    public Exam getExamEntity(Long id) {
        return examRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Exam", "id", id));
    }

    public Exam findExamAndVerifyTeacherAccess(Long id) {
        Exam exam = getExamEntity(id);
        Long currentUserId = SecurityUtils.getCurrentUserId();

        if (!SecurityUtils.isAdmin() && !exam.getCreatedBy().getId().equals(currentUserId)) {
            throw new ForbiddenException("You are not authorized to manage this exam");
        }
        return exam;
    }

    private void validateExamTiming(LocalDateTime start, LocalDateTime end, Integer durationMinutes) {
        if (start.isAfter(end) || start.isEqual(end)) {
            throw new BadRequestException("Exam start time must be strictly before end time");
        }

        long totalWindowMinutes = Duration.between(start, end).toMinutes();
        if (durationMinutes > totalWindowMinutes) {
            throw new BadRequestException("Exam duration (" + durationMinutes + " mins) exceeds the exam availability window (" + totalWindowMinutes + " mins)");
        }
    }
}
