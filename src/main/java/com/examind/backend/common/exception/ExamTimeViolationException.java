package com.examind.backend.common.exception;

public class ExamTimeViolationException extends ExamindException {

    public ExamTimeViolationException(String message) {
        super(message, "EXAM_TIME_VIOLATION");
    }
}
