-- Migration V3: Add question options (for MCQ) and expected concepts tables

CREATE TABLE IF NOT EXISTS question_options (
    question_id BIGINT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    option_text VARCHAR(1000) NOT NULL,
    option_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_question_options_qid ON question_options(question_id);

CREATE TABLE IF NOT EXISTS question_expected_concepts (
    question_id BIGINT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    concept VARCHAR(500) NOT NULL,
    concept_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_question_concepts_qid ON question_expected_concepts(question_id);

