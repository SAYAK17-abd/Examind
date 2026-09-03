package com.examind.backend.common.exception;

public class BadRequestException extends ExamindException {

    public BadRequestException(String message) {
        super(message, "BAD_REQUEST");
    }

    public BadRequestException(String message, String errorCode) {
        super(message, errorCode);
    }
}
