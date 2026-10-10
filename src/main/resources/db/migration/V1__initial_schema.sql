-- ============================================================================
-- EXAMIND DATABASE INITIAL SCHEMA MIGRATION (V1)
-- Target RDBMS: PostgreSQL 14+
-- ============================================================================

-- 1. Roles Table
CREATE TABLE IF NOT EXISTS roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255)
);

-- Seed initial roles
INSERT INTO roles (name, description) VALUES
    ('ROLE_STUDENT', 'Standard student account for attending exams and viewing results'),
    ('ROLE_TEACHER', 'Educator account for creating exams, rubrics, and reviewing evaluations'),
    ('ROLE_ADMIN', 'Platform administrator for user management and system audits')
ON CONFLICT (name) DO NOTHING;

-- 2. Users Table
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role_id BIGINT NOT NULL REFERENCES roles(id),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_status ON users(status);

-- 3. Refresh Tokens Table
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    token VARCHAR(255) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_refresh_token ON refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_refresh_token_user ON refresh_tokens(user_id);

-- 4. Exams Table
CREATE TABLE IF NOT EXISTS exams (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description VARCHAR(2000),
    duration INTEGER NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    total_marks DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    passing_marks DOUBLE PRECISION,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    created_by_id BIGINT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_exam_status ON exams(status);
CREATE INDEX IF NOT EXISTS idx_exam_created_by ON exams(created_by_id);
CREATE INDEX IF NOT EXISTS idx_exam_start_time ON exams(start_time);
CREATE INDEX IF NOT EXISTS idx_exam_end_time ON exams(end_time);

-- 5. Questions Table
CREATE TABLE IF NOT EXISTS questions (
    id BIGSERIAL PRIMARY KEY,
    exam_id BIGINT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    question_text VARCHAR(5000) NOT NULL,
    question_type VARCHAR(30) NOT NULL,
    max_marks DOUBLE PRECISION NOT NULL,
    reference_answer VARCHAR(5000),
    topic VARCHAR(100),
    difficulty VARCHAR(20) DEFAULT 'MEDIUM',
    order_number INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_question_exam ON questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_question_type ON questions(question_type);
CREATE INDEX IF NOT EXISTS idx_question_topic ON questions(topic);

-- 6. Rubrics Table
CREATE TABLE IF NOT EXISTS rubrics (
    id BIGSERIAL PRIMARY KEY,
    question_id BIGINT NOT NULL UNIQUE REFERENCES questions(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    description VARCHAR(1000)
);

-- 7. Rubric Criteria Table
CREATE TABLE IF NOT EXISTS rubric_criteria (
    id BIGSERIAL PRIMARY KEY,
    rubric_id BIGINT NOT NULL REFERENCES rubrics(id) ON DELETE CASCADE,
    criterion VARCHAR(200) NOT NULL,
    description VARCHAR(1000),
    max_marks DOUBLE PRECISION NOT NULL,
    weight DOUBLE PRECISION DEFAULT 1.0
);

-- 8. Submissions Table
CREATE TABLE IF NOT EXISTS submissions (
    id BIGSERIAL PRIMARY KEY,
    exam_id BIGINT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    student_id BIGINT NOT NULL REFERENCES users(id),
    started_at TIMESTAMP NOT NULL,
    submitted_at TIMESTAMP,
    due_at TIMESTAMP NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'IN_PROGRESS',
    evaluation_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    total_score DOUBLE PRECISION,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_submission_exam ON submissions(exam_id);
CREATE INDEX IF NOT EXISTS idx_submission_student ON submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submission_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submission_eval_status ON submissions(evaluation_status);

-- 9. Answers Table
CREATE TABLE IF NOT EXISTS answers (
    id BIGSERIAL PRIMARY KEY,
    submission_id BIGINT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    question_id BIGINT NOT NULL REFERENCES questions(id),
    answer_text VARCHAR(10000),
    attachment_url VARCHAR(500),
    submitted_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    CONSTRAINT uk_submission_question UNIQUE (submission_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_answer_submission ON answers(submission_id);
CREATE INDEX IF NOT EXISTS idx_answer_question ON answers(question_id);

-- 10. Evaluations Table
CREATE TABLE IF NOT EXISTS evaluations (
    id BIGSERIAL PRIMARY KEY,
    answer_id BIGINT NOT NULL UNIQUE REFERENCES answers(id) ON DELETE CASCADE,
    score DOUBLE PRECISION NOT NULL,
    max_score DOUBLE PRECISION NOT NULL,
    confidence DOUBLE PRECISION NOT NULL,
    correctness DOUBLE PRECISION,
    completeness DOUBLE PRECISION,
    semantic_similarity DOUBLE PRECISION,
    concept_coverage DOUBLE PRECISION,
    feedback VARCHAR(5000),
    status VARCHAR(30) NOT NULL,
    evaluated_by VARCHAR(100),
    version INTEGER NOT NULL DEFAULT 1,
    evaluated_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_eval_answer ON evaluations(answer_id);
CREATE INDEX IF NOT EXISTS idx_eval_status ON evaluations(status);

-- 11. Evaluation Versions Table (Audit Trail)
CREATE TABLE IF NOT EXISTS evaluation_versions (
    id BIGSERIAL PRIMARY KEY,
    evaluation_id BIGINT NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    score DOUBLE PRECISION NOT NULL,
    confidence DOUBLE PRECISION,
    status VARCHAR(30) NOT NULL,
    feedback VARCHAR(5000),
    reason VARCHAR(1000),
    changed_by VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_eval_version_eval ON evaluation_versions(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_eval_version_num ON evaluation_versions(version_number);

-- 12. Results Table
CREATE TABLE IF NOT EXISTS results (
    id BIGSERIAL PRIMARY KEY,
    submission_id BIGINT NOT NULL UNIQUE REFERENCES submissions(id) ON DELETE CASCADE,
    student_id BIGINT NOT NULL REFERENCES users(id),
    exam_id BIGINT NOT NULL REFERENCES exams(id),
    total_marks DOUBLE PRECISION NOT NULL,
    obtained_marks DOUBLE PRECISION NOT NULL,
    percentage DOUBLE PRECISION NOT NULL,
    grade VARCHAR(10) NOT NULL,
    passed BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(30) NOT NULL DEFAULT 'PUBLISHED',
    generated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_result_submission ON results(submission_id);
CREATE INDEX IF NOT EXISTS idx_result_student ON results(student_id);
CREATE INDEX IF NOT EXISTS idx_result_exam ON results(exam_id);

-- 13. Answer Similarities Table
CREATE TABLE IF NOT EXISTS answer_similarities (
    id BIGSERIAL PRIMARY KEY,
    answer1_id BIGINT NOT NULL REFERENCES answers(id) ON DELETE CASCADE,
    answer2_id BIGINT NOT NULL REFERENCES answers(id) ON DELETE CASCADE,
    similarity_score DOUBLE PRECISION NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'NORMAL',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sim_answer1 ON answer_similarities(answer1_id);
CREATE INDEX IF NOT EXISTS idx_sim_answer2 ON answer_similarities(answer2_id);
CREATE INDEX IF NOT EXISTS idx_sim_status ON answer_similarities(status);

-- 14. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message VARCHAR(1000) NOT NULL,
    type VARCHAR(50) NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notif_read ON notifications(is_read);

