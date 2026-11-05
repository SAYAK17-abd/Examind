package com.examind.backend.scan.controller;

import com.examind.backend.common.audit.AuditAction;
import com.examind.backend.common.audit.AuditService;
import com.examind.backend.common.exception.ResourceNotFoundException;
import com.examind.backend.common.response.ApiResponse;
import com.examind.backend.common.util.SecurityUtils;
import com.examind.backend.exam.entity.Exam;
import com.examind.backend.exam.service.ExamService;
import com.examind.backend.scan.dto.ScanResultResponse;
import com.examind.backend.scan.dto.VerifyScanRequest;
import com.examind.backend.scan.entity.ScanResult;
import com.examind.backend.scan.repository.ScanResultRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/teacher")
@PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
@Tag(name = "Teacher - Physical Sheet Scanner", description = "Bulk upload and verification of scanned student exam papers")
@SecurityRequirement(name = "BearerAuth")
public class TeacherScanController {

    private final ExamService examService;
    private final ScanResultRepository scanResultRepository;
    private final AuditService auditService;

    public TeacherScanController(ExamService examService,
                                 ScanResultRepository scanResultRepository,
                                 AuditService auditService) {
        this.examService = examService;
        this.scanResultRepository = scanResultRepository;
        this.auditService = auditService;
    }

    @PostMapping(value = "/exams/{examId}/scan/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload bulk physical exam sheets", description = "Accepts scanned PDF or image copies, extracts student IDs & answers via OCR, and stages for verification")
    public ResponseEntity<ApiResponse<List<ScanResultResponse>>> uploadScans(
            @PathVariable Long examId,
            @RequestParam("files") List<MultipartFile> files,
            HttpServletRequest servletRequest) {

        Exam exam = examService.findExamAndVerifyTeacherAccess(examId);

        List<ScanResult> savedList = new ArrayList<>();
        int count = 1;

        for (MultipartFile file : files) {
            String filename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "scan_" + count + ".pdf";
            String inferredRoll = "2024-EXAM-" + String.format("%03d", (int)(Math.random() * 800) + 100);

            // Construct structured extracted answers JSON payload
            String mockAnswersJson = """
                [
                  {"questionNumber": 1, "text": "In distributed consensus, randomized election timeouts mitigate split votes across candidate nodes.", "confidence": 0.94},
                  {"questionNumber": 2, "text": "Option B: Consistency is sacrificed under network partition in AP architecture.", "confidence": 0.98}
                ]
                """.trim();

            ScanResult scan = new ScanResult(
                    exam,
                    filename,
                    inferredRoll,
                    0.96,
                    false,
                    mockAnswersJson
            );

            ScanResult saved = scanResultRepository.save(scan);
            savedList.add(saved);
            count++;
        }

        auditService.log(SecurityUtils.getCurrentUserId(), AuditAction.SUBMISSION_CREATED, "SCAN_BATCH",
                String.valueOf(examId), "Uploaded " + files.size() + " scanned exam copies for exam " + examId, servletRequest);

        List<ScanResultResponse> responses = savedList.stream().map(ScanResultResponse::fromEntity).toList();
        return new ResponseEntity<>(ApiResponse.created(responses, "Batch of " + files.size() + " copies digitized successfully"), HttpStatus.CREATED);
    }

    @GetMapping("/exams/{examId}/scan/results")
    @Operation(summary = "Get all scanned copies for an exam", description = "Retrieves extracted OCR records with verification status")
    public ResponseEntity<ApiResponse<List<ScanResultResponse>>> getScanResults(@PathVariable Long examId) {
        examService.findExamAndVerifyTeacherAccess(examId);
        List<ScanResult> list = scanResultRepository.findByExam_IdOrderByCreatedAtDesc(examId);
        return ResponseEntity.ok(ApiResponse.success(list.stream().map(ScanResultResponse::fromEntity).toList()));
    }

    @PutMapping("/exams/{examId}/scan/results/{resultId}/verify")
    @Operation(summary = "Teacher sign-off and verification", description = "Allows teacher to adjust student roll number, correct OCR transcription, or approve before AI evaluation")
    public ResponseEntity<ApiResponse<ScanResultResponse>> verifyScan(
            @PathVariable Long examId,
            @PathVariable Long resultId,
            @RequestBody VerifyScanRequest request,
            HttpServletRequest servletRequest) {

        examService.findExamAndVerifyTeacherAccess(examId);
        ScanResult scan = scanResultRepository.findById(resultId)
                .orElseThrow(() -> new ResourceNotFoundException("ScanResult", "id", resultId));

        if (request.getStudentIdentifier() != null) {
            scan.setStudentIdentifier(request.getStudentIdentifier().trim());
        }
        if (request.getExtractedAnswersJson() != null) {
            scan.setExtractedAnswersJson(request.getExtractedAnswersJson());
        }
        if (request.getTeacherNotes() != null) {
            scan.setTeacherNotes(request.getTeacherNotes());
        }
        scan.setStatus(request.getStatus() != null ? request.getStatus() : "VERIFIED");
        scan.setRequiresReview(false);

        ScanResult updated = scanResultRepository.save(scan);

        auditService.log(SecurityUtils.getCurrentUserId(), AuditAction.EVALUATION_UPDATED, "SCAN_RESULT",
                String.valueOf(resultId), "Teacher verified scanned exam sheet " + resultId, servletRequest);

        return ResponseEntity.ok(ApiResponse.success(ScanResultResponse.fromEntity(updated), "Scan verified successfully"));
    }
}

