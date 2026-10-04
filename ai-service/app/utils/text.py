import re
import unicodedata
from typing import List


def normalize_text(text: str) -> str:
    """
    Normalizes whitespace and Unicode characters while preserving code syntax,
    mathematical symbols, punctuation, and structural characters.
    """
    if not text:
        return ""

    text = unicodedata.normalize("NFKC", text)
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    lines = [re.sub(r"[ \t]+", " ", line).strip() for line in text.split("\n")]
    text = "\n".join(lines).strip()
    return text


def extract_keywords_and_tokens(text: str, min_length: int = 3) -> List[str]:
    """
    Extracts lowercase tokens of at least min_length for token-level checks,
    filtering common trivial stop words.
    """
    if not text:
        return []

    words = re.findall(r"\b[a-zA-Z0-9_+#.-]+\b", text.lower())
    stop_words = {
        "the", "and", "is", "in", "to", "of", "a", "an", "for", "with", "on", "at",
        "by", "this", "that", "it", "from", "as", "are", "was", "were", "be", "been"
    }
    return [w for w in words if len(w) >= min_length and w not in stop_words]

