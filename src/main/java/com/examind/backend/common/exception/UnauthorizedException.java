package com.examind.backend.common.exception;

public class UnauthorizedException extends ExamindException {

    public UnauthorizedException(String message) {
        super(message, "UNAUTHORIZED");
    }
}
