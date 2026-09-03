package com.examind.backend.common.exception;

public class ForbiddenException extends ExamindException {

    public ForbiddenException(String message) {
        super(message, "FORBIDDEN");
    }
}
