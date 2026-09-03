package com.examind.backend.file.controller;

import com.examind.backend.common.audit.AuditAction;
import com.examind.backend.common.audit.AuditService;
import com.examind.backend.common.exception.BadRequestException;
import com.examind.backend.common.exception.ForbiddenException;
import com.examind.backend.common.response.ApiResponse;
import com.examind.backend.common.util.SecurityUtils;
import com.examind.backend.file.dto.FileUploadResponse;
import com.examind.backend.file.service.FileStorageService;
import com.examind.backend.submission.entity.Submission;
import com.examind.backend.submission.entity.SubmissionStatus;
import com.examind.backend.submission.service.SubmissionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@Tag(name = "File Management", description = "Secure answer sheet file uploads and document retrieval")
public class FileUploadController {

    private final FileStorageService fileStorageService;
    private final SubmissionService submissionService;
    private final AuditService auditService;

    public FileUploadController(FileStorageService fileStorageService,
                                SubmissionService submissionService,
                                AuditService auditService) {
        this.fileStorageService = fileStorageService;
        this.submissionService = submissionService;
        this.auditService = auditService;
    }

    @PostMapping(value = "/api/submissions/{submissionId}/files", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('STUDENT', 'ADMIN')")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Upload submission answer file", description = "Uploads an answer sheet scan or PDF with MIME, extension, and magic byte validation")
    public ResponseEntity<ApiResponse<FileUploadResponse>> uploadSubmissionFile(
            @PathVariable Long submissionId,
            @RequestParam("file") MultipartFile file,
            HttpServletRequest servletRequest) {

        Submission submission = submissionService.getSubmissionEntity(submissionId);
        Long currentUserId = SecurityUtils.getCurrentUserId();

        if (!submission.getStudent().getId().equals(currentUserId) && !SecurityUtils.isAdmin()) {
            throw new ForbiddenException("You cannot upload files for another student's submission");
        }

        if (submission.getStatus() != SubmissionStatus.IN_PROGRESS) {
            throw new BadRequestException("Cannot upload file: Submission is already " + submission.getStatus());
        }

        FileUploadResponse response = fileStorageService.storeFile(file, submissionId);

        auditService.log(currentUserId, AuditAction.FILE_UPLOADED, "SUBMISSION", String.valueOf(submissionId),
                "Uploaded file: " + response.getFileName() + " (" + response.getSizeBytes() + " bytes)", servletRequest);

        return ResponseEntity.ok(ApiResponse.success(response, "File uploaded successfully"));
    }

    @GetMapping("/api/files/{fileName:.+}")
    @Operation(summary = "Download or view file", description = "Retrieves an uploaded exam document or answer sheet")
    public ResponseEntity<Resource> downloadFile(@PathVariable String fileName, HttpServletRequest request) {
        Resource resource = fileStorageService.loadFileAsResource(fileName);

        String contentType = null;
        try {
            contentType = request.getServletContext().getMimeType(resource.getFile().getAbsolutePath());
        } catch (IOException ex) {
            contentType = "application/octet-stream";
        }
        if (contentType == null) {
            contentType = "application/octet-stream";
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }
}
