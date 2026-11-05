-- Migration V4: Create scan_results table for bulk physical answer sheet digitizing & teacher verification

CREATE TABLE IF NOT EXISTS scan_results (
    id BIGSERIAL PRIMARY KEY,
    exam_id BIGINT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    original_filename VARCHAR(255) NOT NULL,
    student_identifier VARCHAR(100),
    confidence DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    requires_review BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING_REVIEW',
    extracted_answers_json TEXT,
    teacher_notes VARCHAR(1000),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_scan_results_exam ON scan_results(exam_id);
CREATE INDEX IF NOT EXISTS idx_scan_results_status ON scan_results(status);
CREATE INDEX IF NOT EXISTS idx_scan_results_student ON scan_results(student_identifier);

