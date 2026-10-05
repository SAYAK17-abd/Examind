import re
from dataclasses import dataclass, field
from typing import List, Optional
from app.schemas.document import ExtractedAnswer
from app.core.logging import logger

QUESTION_VERBS = {
    "explain", "what", "define", "describe", "differentiate", "distinguish",
    "discuss", "state", "write", "how", "why", "calculate", "compare",
    "illustrate", "list", "give", "mention", "evaluate", "prove", "show",
    "briefly", "identify", "elaborate", "analyze"
}

MARKER_PATTERNS = [
    # Q1, Q.1, Q 1, Question 1, Ques 1, Que 1 (with optional colon/dot)
    re.compile(r"^(?:question|ques|que|q)[.\s:-]*(\d+)[.\s:-]*(.*)$", re.IGNORECASE),
    # Ans 1, Answer 1, Ans. 1 (with optional colon/dot)
    re.compile(r"^(?:answer|ans)[.\s:-]*(\d+)[.\s:-]*(.*)$", re.IGNORECASE),
    # 1., 1), (1), 1:
    re.compile(r"^(?:\(?(\d+)[\).\:-])\s*(.*)$"),
]

ANSWER_PREFIX_PATTERN = re.compile(r"^(?:ans|answer)[.\s:-]*(.*)$", re.IGNORECASE)


@dataclass
class SegmentationResult:
    answers: List[ExtractedAnswer]
    confidence: float
    requires_review: bool
    warnings: List[str] = field(default_factory=list)


class QuestionSegmenter:
    """
    Robust Question & Answer Segmentation Engine.
    Parses OCR raw transcript and extracts discrete question-answer pairs.
    Handles multiple formats:
    - 1. / 1) / (1)
    - Q1 / Q.1 / Question 1
    - Ans 1 / Answer 1
    Detects question prompts vs student answers and flags ambiguous segmentation for human review.
    """

    def is_question_prompt(self, text: str) -> bool:
        """Determines if a line looks like an examination question prompt."""
        cleaned = text.strip()
        if not cleaned:
            return False
        if cleaned.endswith("?"):
            return True
        first_token = re.split(r"[\s,.:;?!]+", cleaned)[0].lower()
        return first_token in QUESTION_VERBS

    def clean_answer_text(self, lines: List[str], first_line_rest: str) -> str:
        """
        Extracts clean answer text from a question block, removing question prompt
        or redundant 'Ans:' labels.
        """
        first_line_rest = first_line_rest.strip()
        remaining_lines = [l.strip() for l in lines if l.strip()]

        # Check for inline answer label, e.g. "Explain polymorphism. Ans: Java supports..."
        inline_match = re.search(r"\b(?:ans|answer)[.\s:-]+(.*)$", first_line_rest, re.IGNORECASE)
        if inline_match:
            inline_ans = inline_match.group(1).strip()
            all_answer_lines = [inline_ans] + remaining_lines if inline_ans else remaining_lines
            return "\n".join(all_answer_lines).strip()

        # Check if first line is a question prompt and we have subsequent lines
        if self.is_question_prompt(first_line_rest) and remaining_lines:
            # Strip first line prompt, take subsequent lines
            # If the next line starts with 'Ans:', strip that prefix
            if remaining_lines:
                ans_match = ANSWER_PREFIX_PATTERN.match(remaining_lines[0])
                if ans_match:
                    remaining_lines[0] = ans_match.group(1).strip()
            return "\n".join([l for l in remaining_lines if l]).strip()

        # Check if first line itself starts with 'Ans:'
        ans_match = ANSWER_PREFIX_PATTERN.match(first_line_rest)
        if ans_match:
            first_line_rest = ans_match.group(1).strip()

        # Otherwise, combine first_line_rest with remaining lines
        combined = []
        if first_line_rest:
            combined.append(first_line_rest)
        combined.extend(remaining_lines)
        return "\n".join(combined).strip()

    def segment(self, text: str) -> SegmentationResult:
        """
        Segments raw document transcript into structured question answers.
        """
        if not text or not text.strip():
            return SegmentationResult(
                answers=[],
                confidence=0.0,
                requires_review=True,
                warnings=["Document transcript is empty; no answers segmented."]
            )

        raw_lines = text.split("\n")
        blocks = []  # List of tuples: (question_number, first_line_rest, [subsequent_lines])
        current_q_num: Optional[int] = None
        current_first_rest: str = ""
        current_lines: List[str] = []

        for line in raw_lines:
            stripped = line.strip()
            if not stripped:
                continue

            # Check if this line is a question header
            matched_q: Optional[int] = None
            matched_rest: str = ""

            for pattern in MARKER_PATTERNS:
                m = pattern.match(stripped)
                if m:
                    try:
                        matched_q = int(m.group(1))
                        matched_rest = m.group(2).strip()
                        break
                    except (ValueError, IndexError):
                        continue

            if matched_q is not None:
                # Flush previous question block
                if current_q_num is not None:
                    blocks.append((current_q_num, current_first_rest, current_lines))
                current_q_num = matched_q
                current_first_rest = matched_rest
                current_lines = []
            else:
                if current_q_num is not None:
                    current_lines.append(stripped)

        # Flush final block
        if current_q_num is not None:
            blocks.append((current_q_num, current_first_rest, current_lines))

        # Handle case where no question headers were detected
        if not blocks:
            logger.info("No question markers detected in text. Falling back to single-answer representation.")
            return SegmentationResult(
                answers=[
                    ExtractedAnswer(
                        questionNumber=1,
                        text=text.strip(),
                        confidence=0.50
                    )
                ],
                confidence=0.50,
                requires_review=True,
                warnings=["No standard question markers (e.g. Q1, 1., Ans 1) detected. Treated entire document as Question 1."]
            )

        # Build answers and evaluate segmentation confidence
        answers: List[ExtractedAnswer] = []
        warnings: List[str] = []
        seen_numbers = set()
        has_duplicates = False
        is_sequential = True
        last_q_num = 0

        for q_num, first_rest, lines in blocks:
            if q_num in seen_numbers:
                has_duplicates = True
                warnings.append(f"Duplicate question number {q_num} found in document.")
            seen_numbers.add(q_num)

            if last_q_num > 0 and q_num != last_q_num + 1:
                is_sequential = False
            last_q_num = q_num

            ans_text = self.clean_answer_text(lines, first_rest)
            if len(ans_text) < 10:
                warnings.append(f"Question {q_num} has short or empty extracted text.")

            answers.append(
                ExtractedAnswer(
                    questionNumber=q_num,
                    text=ans_text,
                    confidence=0.95 if not has_duplicates else 0.70
                )
            )

        # Calculate overall segmentation confidence
        seg_conf = 0.95
        requires_review = False

        if has_duplicates:
            seg_conf = min(seg_conf, 0.65)
            requires_review = True
        elif not is_sequential and len(answers) > 1:
            seg_conf = min(seg_conf, 0.85)

        # Check for any empty answers
        if any(len(a.text.strip()) == 0 for a in answers):
            seg_conf = min(seg_conf, 0.60)
            requires_review = True
            warnings.append("One or more questions contains empty answer text.")

        if seg_conf < 0.70:
            requires_review = True

        return SegmentationResult(
            answers=answers,
            confidence=round(seg_conf, 2),
            requires_review=requires_review,
            warnings=warnings
        )
