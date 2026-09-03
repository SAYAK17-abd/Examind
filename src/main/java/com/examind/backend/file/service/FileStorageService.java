package com.examind.backend.file.service;

import com.examind.backend.common.exception.BadRequestException;
import com.examind.backend.common.exception.FileValidationException;
import com.examind.backend.file.dto.FileUploadResponse;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class FileStorageService {

    private static final Logger log = LoggerFactory.getLogger(FileStorageService.class);

    @Value("${examind.upload.dir:./uploads}")
    private String uploadDir;

    @Value("${examind.upload.max-file-size-mb:10}")
    private long maxFileSizeMb;

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("pdf", "jpg", "jpeg", "png");
    private static final Set<String> ALLOWED_MIME_TYPES = Set.of("application/pdf", "image/jpeg", "image/png");
    private static final Set<String> DISALLOWED_EXTENSIONS = Set.of(
            "exe", "bat", "sh", "cmd", "jar", "war", "dll", "so", "py", "js", "jsp", "php", "vbs", "scr", "bin"
    );

    private Path storageLocation;

    @PostConstruct
    public void init() {
        this.storageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.storageLocation);
            log.info("File storage directory initialized at: {}", this.storageLocation);
        } catch (IOException e) {
            throw new RuntimeException("Could not create the directory where uploaded files will be stored", e);
        }
    }

    public FileUploadResponse storeFile(MultipartFile file, Long submissionId) {
        if (file.isEmpty()) {
            throw new FileValidationException("Uploaded file cannot be empty");
        }

        // 1. Validate File Size
        long maxSizeBytes = maxFileSizeMb * 1024 * 1024;
        if (file.getSize() > maxSizeBytes) {
            throw new FileValidationException("File exceeds maximum allowed size of " + maxFileSizeMb + " MB");
        }

        // 2. Validate Original Filename & Extension
        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "file");
        if (originalFilename.contains("..")) {
            throw new FileValidationException("Filename contains invalid path sequence: " + originalFilename);
        }

        String extension = getFileExtension(originalFilename).toLowerCase();
        if (DISALLOWED_EXTENSIONS.contains(extension)) {
            throw new FileValidationException("Executable or script files are strictly prohibited: " + extension);
        }

        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new FileValidationException("File type not permitted. Only PDF, JPG, JPEG, and PNG are allowed.");
        }

        // 3. Validate MIME type
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_MIME_TYPES.contains(contentType.toLowerCase())) {
            throw new FileValidationException("Invalid content type: " + contentType + ". Permitted types: " + ALLOWED_MIME_TYPES);
        }

        // 4. Validate Magic Bytes
        validateMagicBytes(file, extension);

        // 5. Store File with secure UUID name
        String storedFileName = "sub_" + submissionId + "_" + UUID.randomUUID() + "." + extension;
        Path targetLocation = this.storageLocation.resolve(storedFileName);

        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, targetLocation, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            log.error("Failed to store file: {}", originalFilename, e);
            throw new RuntimeException("Could not store file " + originalFilename, e);
        }

        String fileUrl = "/api/files/" + storedFileName;
        return new FileUploadResponse(storedFileName, originalFilename, fileUrl, contentType, file.getSize());
    }

    public Resource loadFileAsResource(String fileName) {
        try {
            Path filePath = this.storageLocation.resolve(fileName).normalize();
            if (!filePath.startsWith(this.storageLocation)) {
                throw new BadRequestException("Path traversal attempt detected");
            }
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new BadRequestException("File not found or not readable: " + fileName);
            }
        } catch (MalformedURLException ex) {
            throw new BadRequestException("File not found: " + fileName);
        }
    }

    private String getFileExtension(String fileName) {
        int dotIndex = fileName.lastIndexOf('.');
        if (dotIndex == -1 || dotIndex == fileName.length() - 1) {
            return "";
        }
        return fileName.substring(dotIndex + 1);
    }

    private void validateMagicBytes(MultipartFile file, String extension) {
        try (InputStream is = file.getInputStream()) {
            byte[] header = new byte[8];
            int read = is.read(header);
            if (read < 4) {
                throw new FileValidationException("File is corrupted or too small to be valid");
            }

            if (extension.equals("pdf")) {
                // %PDF
                if (header[0] != 0x25 || header[1] != 0x50 || header[2] != 0x44 || header[3] != 0x46) {
                    throw new FileValidationException("File header does not match genuine PDF format");
                }
            } else if (extension.equals("png")) {
                // 89 50 4E 47
                if ((header[0] & 0xFF) != 0x89 || header[1] != 0x50 || header[2] != 0x4E || header[3] != 0x47) {
                    throw new FileValidationException("File header does not match genuine PNG image format");
                }
            } else if (extension.equals("jpg") || extension.equals("jpeg")) {
                // FF D8 FF
                if ((header[0] & 0xFF) != 0xFF || (header[1] & 0xFF) != 0xD8 || (header[2] & 0xFF) != 0xFF) {
                    throw new FileValidationException("File header does not match genuine JPEG image format");
                }
            }
        } catch (IOException e) {
            throw new FileValidationException("Failed to read file signature for security verification");
        }
    }
}
