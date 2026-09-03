package com.examind.backend.common.exception;

public class FileValidationException extends ExamindException {

    public FileValidationException(String message) {
        super(message, "INVALID_FILE");
    }
}
