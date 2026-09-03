package com.examind.backend.common.exception;

public class ExamindException extends RuntimeException {

    private final String errorCode;

    public ExamindException(String message) {
        super(message);
        this.errorCode = "INTERNAL_SERVER_ERROR";
    }

    public ExamindException(String message, String errorCode) {
        super(message);
        this.errorCode = errorCode;
    }

    public ExamindException(String message, Throwable cause, String errorCode) {
        super(message, cause);
        this.errorCode = errorCode;
    }

    public String getErrorCode() {
        return errorCode;
    }
}
