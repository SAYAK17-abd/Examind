package com.examind.backend.result.service;

import com.examind.backend.common.exception.ForbiddenException;
import com.examind.backend.common.exception.ResourceNotFoundException;
import com.examind.backend.common.response.PagedResponse;
import com.examind.backend.common.util.SecurityUtils;
import com.examind.backend.evaluation.dto.EvaluationResponse;
import com.examind.backend.evaluation.repository.EvaluationRepository;
import com.examind.backend.evaluation.service.EvaluationCompletedEvent;
import com.examind.backend.exam.entity.Exam;
import com.examind.backend.exam.service.ExamService;
import com.examind.backend.result.dto.ResultResponse;
import com.examind.backend.result.entity.Result;
import com.examind.backend.result.repository.ResultRepository;
import com.examind.backend.submission.entity.Submission;
import com.examind.backend.submission.repository.SubmissionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ResultService {

    private static final Logger log = LoggerFactory.getLogger(ResultService.class);

    private final ResultRepository resultRepository;
    private final SubmissionRepository submissionRepository;
    private final EvaluationRepository evaluationRepository;
    private final ExamService examService;

    public ResultService(ResultRepository resultRepository,
                         SubmissionRepository submissionRepository,
                         EvaluationRepository evaluationRepository,
                         ExamService examService) {
        this.resultRepository = resultRepository;
        this.submissionRepository = submissionRepository;
        this.evaluationRepository = evaluationRepository;
        this.examService = examService;
    }

    @EventListener
    @Transactional
    public void onEvaluationCompleted(EvaluationCompletedEvent event) {
        try {
            generateOrUpdateResult(event.getSubmissionId());
        } catch (Exception ex) {
            log.error("Failed to calculate result for submission: {}", event.getSubmissionId(), ex);
        }
    }

    @Transactional
    public Result generateOrUpdateResult(Long submissionId) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Submission", "id", submissionId));

        Exam exam = submission.getExam();
        double obtainedScore = submission.getTotalScore() != null ? submission.getTotalScore() : 0.0;
        double totalMarks = exam.getTotalMarks() != null && exam.getTotalMarks() > 0 ? exam.getTotalMarks() : 100.0;

        Result result = resultRepository.findBySubmission_Id(submissionId)
                .orElse(new Result(submission, submission.getStudent(), exam, totalMarks, obtainedScore));

        result.setTotalMarks(totalMarks);
        result.setObtainedMarks(obtainedScore);
        result.setPercentage(totalMarks > 0 ? (obtainedScore / totalMarks) * 100.0 : 0.0);
        result.setGrade(Result.calculateGrade(result.getPercentage()));
        double passing = exam.getPassingMarks() != null ? exam.getPassingMarks() : (totalMarks * 0.40);
        result.setPassed(obtainedScore >= passing);

        Result saved = resultRepository.save(result);
        log.info("Saved Result for student {} on exam {}: Score={}/{}, Grade={}",
                submission.getStudent().getId(), exam.getId(), obtainedScore, totalMarks, saved.getGrade());
        return saved;
    }

    @Transactional(readOnly = true)
    public PagedResponse<ResultResponse> getStudentResults(Pageable pageable) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        Page<Result> page = resultRepository.findByStudent_Id(currentUserId, pageable);
        return PagedResponse.from(page.map(r -> ResultResponse.fromEntity(r, getEvaluationsForSubmission(r.getSubmission().getId()))));
    }

    @Transactional(readOnly = true)
    public ResultResponse getResultById(Long id) {
        Result result = resultRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Result", "id", id));

        Long currentUserId = SecurityUtils.getCurrentUserId();
        boolean isOwnerStudent = result.getStudent().getId().equals(currentUserId);
        boolean isExamTeacher = result.getExam().getCreatedBy().getId().equals(currentUserId);

        if (!isOwnerStudent && !isExamTeacher && !SecurityUtils.isAdmin()) {
            throw new ForbiddenException("You are not authorized to view this result");
        }

        List<EvaluationResponse> evals = getEvaluationsForSubmission(result.getSubmission().getId());
        return ResultResponse.fromEntity(result, evals);
    }

    @Transactional(readOnly = true)
    public PagedResponse<ResultResponse> getExamResultsForTeacher(Long examId, Pageable pageable) {
        examService.findExamAndVerifyTeacherAccess(examId);
        Page<Result> page = resultRepository.findByExam_Id(examId, pageable);
        return PagedResponse.from(page.map(r -> ResultResponse.fromEntity(r, getEvaluationsForSubmission(r.getSubmission().getId()))));
    }

    @Transactional(readOnly = true)
    public List<ResultResponse> getStudentResultsForTeacher(Long studentId) {
        return resultRepository.findByStudent_Id(studentId).stream()
                .map(r -> ResultResponse.fromEntity(r, getEvaluationsForSubmission(r.getSubmission().getId())))
                .toList();
    }

    private List<EvaluationResponse> getEvaluationsForSubmission(Long submissionId) {
        return evaluationRepository.findByAnswer_Submission_Id(submissionId).stream()
                .map(EvaluationResponse::fromEntity)
                .toList();
    }
}
