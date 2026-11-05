import re
from typing import List, Optional, Tuple
from app.schemas.question_audit import AuditedQuestion, AuditWarning, QuestionPaperAuditResponse
from app.core.logging import logger

MARKS_PATTERNS = [
    re.compile(r"\[\s*(\d+(?:\.\d+)?)\s*(?:marks?|pts?|m)?\s*\]", re.IGNORECASE),
    re.compile(r"\(\s*(\d+(?:\.\d+)?)\s*(?:marks?|pts?|m)\s*\)", re.IGNORECASE),
    re.compile(r"[\s—–-]+(\d+(?:\.\d+)?)\s*(?:marks?|pts?)\s*$", re.IGNORECASE),
]

MCQ_OPTION_PATTERN = re.compile(r"^(?:\(?([A-Da-d])[\).\:-])\s*(.*)$")

QUESTION_HEADER_PATTERNS = [
    re.compile(r"^(?:question|ques|que|q)[.\s:-]*(\d+)[.\s:-]*(.*)$", re.IGNORECASE),
    re.compile(r"^(?:\(?(\d+)[\).\:-])\s*(.*)$"),
]


class QuestionPaperAuditor:
    """
    Analyzes question paper text, extracts structured questions,
    and runs real-time pedagogical and structural audits for mistakes/ambiguity.
    """

    def parse_and_audit(self, text: str, filename: str) -> QuestionPaperAuditResponse:
        lines = [line.strip() for line in text.split("\n") if line.strip()]
        if not lines:
            return QuestionPaperAuditResponse(
                filename=filename,
                totalQuestions=0,
                totalMarksScanned=0.0,
                cleanQuestionsCount=0,
                questions=[],
                summaryWarnings=["Document contains no readable text to parse questions from."]
            )

        # Segment lines into question blocks
        raw_blocks: List[Tuple[int, str, List[str]]] = []
        current_q_num: Optional[int] = None
        current_header_rest = ""
        current_lines: List[str] = []

        for line in lines:
            matched_num = None
            matched_rest = ""

            for pat in QUESTION_HEADER_PATTERNS:
                m = pat.match(line)
                if m:
                    try:
                        matched_num = int(m.group(1))
                        matched_rest = m.group(2).strip()
                        break
                    except (ValueError, IndexError):
                        continue

            if matched_num is not None:
                if current_q_num is not None:
                    raw_blocks.append((current_q_num, current_header_rest, current_lines))
                current_q_num = matched_num
                current_header_rest = matched_rest
                current_lines = []
            else:
                if current_q_num is not None:
                    current_lines.append(line)

        if current_q_num is not None:
            raw_blocks.append((current_q_num, current_header_rest, current_lines))

        # Fallback if no numbered headers found
        if not raw_blocks:
            raw_blocks.append((1, lines[0], lines[1:]))

        audited_questions: List[AuditedQuestion] = []
        total_marks = 0.0
        clean_count = 0
        summary_warnings = []

        for q_num, header_rest, body_lines in raw_blocks:
            full_block_lines = ([header_rest] if header_rest else []) + body_lines
            combined_text = " ".join(full_block_lines).strip()

            # 1. Extract Marks
            detected_marks = None
            clean_prompt = combined_text
            for pat in MARKS_PATTERNS:
                m = pat.search(combined_text)
                if m:
                    try:
                        detected_marks = float(m.group(1))
                        clean_prompt = pat.sub("", clean_prompt).strip()
                        break
                    except (ValueError, IndexError):
                        pass

            # 2. Extract MCQ options if present
            options = []
            for b_line in body_lines:
                opt_m = MCQ_OPTION_PATTERN.match(b_line)
                if opt_m:
                    options.append(opt_m.group(2).strip())

            # 3. Detect Question Type
            lower_text = clean_prompt.lower()
            if len(options) >= 2:
                q_type = "MCQ"
            elif any(w in lower_text for w in ["write a program", "write code", "implement a function", "pseudocode", "algorithm"]):
                q_type = "CODING"
            elif any(w in lower_text for w in ["calculate", "compute", "find the value", "determine the numerical", "magnitude"]):
                q_type = "NUMERICAL"
            elif any(w in lower_text for w in ["explain in detail", "discuss", "elaborate", "critically evaluate", "describe the architecture"]):
                q_type = "DESCRIPTIVE"
            else:
                q_type = "SHORT_ANSWER"

            # 4. Run AI Audits
            warnings: List[AuditWarning] = []

            # Check 1: Missing Marks
            if detected_marks is None or detected_marks <= 0:
                rec_marks = 10.0 if q_type in ["DESCRIPTIVE", "CODING"] else (5.0 if q_type == "NUMERICAL" else 2.0)
                warnings.append(AuditWarning(
                    code="MISSING_MARKS",
                    message="No explicit mark allocation detected in the scanned question.",
                    severity="WARNING",
                    suggestion=f"Assign {rec_marks:.0f} Marks based on {q_type.replace('_', ' ').lower()} complexity."
                ))
            else:
                total_marks += detected_marks

            # Check 2: Prompt length / truncation
            if len(clean_prompt) < 15:
                warnings.append(AuditWarning(
                    code="INCOMPLETE_PROMPT",
                    message="Question prompt is unusually short and may have been clipped during scanning.",
                    severity="ERROR",
                    suggestion="Review original document to verify the entire question was captured."
                ))

            # Check 3: Ambiguous phrasing
            if any(phrase in lower_text for phrase in ["which is better", "why is it good", "write a few points", "discuss briefly"]):
                warnings.append(AuditWarning(
                    code="AMBIGUOUS_CRITERIA",
                    message="Question asks for subjective comparison without defining explicit evaluation constraints.",
                    severity="WARNING",
                    suggestion="Add explicit constraints (e.g., 'considering memory complexity and network latency') to eliminate ambiguity."
                ))

            # Check 4: MCQ missing answer options
            if q_type == "MCQ" and len(options) < 3:
                warnings.append(AuditWarning(
                    code="INSUFFICIENT_OPTIONS",
                    message=f"Only {len(options)} multiple-choice options detected. Standard MCQs require 4 options.",
                    severity="WARNING",
                    suggestion="Ensure all options (A, B, C, D) are entered."
                ))

            if not warnings:
                clean_count += 1

            audited_questions.append(AuditedQuestion(
                questionNumber=q_num,
                questionText=clean_prompt,
                questionType=q_type,
                maxMarks=detected_marks,
                options=options if options else None,
                warnings=warnings
            ))

        if total_marks == 0.0:
            summary_warnings.append("No marks detected on any scanned question. Default marks will need to be configured.")
        elif any(q.maxMarks is None for q in audited_questions):
            summary_warnings.append("One or more questions are missing mark allocations. AI suggestions have been generated.")

        return QuestionPaperAuditResponse(
            filename=filename,
            totalQuestions=len(audited_questions),
            totalMarksScanned=total_marks,
            cleanQuestionsCount=clean_count,
            questions=audited_questions,
            summaryWarnings=summary_warnings
        )

