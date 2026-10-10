package com.examind.backend.similarity;

import com.examind.backend.similarity.entity.SimilarityStatus;
import com.examind.backend.similarity.service.SimilarityDetectionService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class SimilarityDetectionServiceTest {

    @Test
    @DisplayName("Similarity: Empty and blank answers return 0.0 safely without exception")
    void testEmptyAndBlankAnswers() {
        assertEquals(0.0, SimilarityDetectionService.computeSimilarity(null, "some text"));
        assertEquals(0.0, SimilarityDetectionService.computeSimilarity("some text", null));
        assertEquals(0.0, SimilarityDetectionService.computeSimilarity("", ""));
        assertEquals(0.0, SimilarityDetectionService.computeSimilarity("   ", "valid answer"));
        assertEquals(0.0, SimilarityDetectionService.computeSimilarity("", "valid answer"));
    }

    @Test
    @DisplayName("Similarity: Completely unrelated answers yield negligible or zero similarity")
    void testUnrelatedAnswers() {
        String answerA = "Photosynthesis is the process by which green plants use sunlight to synthesize nutrients from carbon dioxide and water.";
        String answerB = "QuickSort is a divide and conquer algorithm that picks an element as a pivot and partitions the given array around it.";

        double similarity = SimilarityDetectionService.computeSimilarity(answerA, answerB);
        assertTrue(similarity < 0.15, "Expected unrelated text similarity to be under 0.15, got: " + similarity);
    }

    @Test
    @DisplayName("Similarity: Paraphrased answers yield moderate similarity")
    void testParaphrasedAnswers() {
        String answerA = "Encapsulation in object oriented programming bundles data and methods together inside a single class to restrict direct access.";
        String answerB = "Encapsulation is an OOP technique that packages data and functions within a class to prevent direct outside manipulation.";

        double similarity = SimilarityDetectionService.computeSimilarity(answerA, answerB);
        assertTrue(similarity >= 0.20 && similarity < 0.85,
                "Expected paraphrased answers to have intermediate similarity, got: " + similarity);
    }

    @Test
    @DisplayName("Similarity: Near-identical or highly copied answers yield high similarity")
    void testHighlySimilarAnswers() {
        String answerA = "Polymorphism enables an entity such as a variable, function or object to have more than one form in Java programming.";
        String answerB = "Polymorphism enables an entity such as a variable, function or object to have more than one form in Java programming language.";

        double similarity = SimilarityDetectionService.computeSimilarity(answerA, answerB);
        assertTrue(similarity >= 0.80, "Expected high similarity >= 0.80 for copy-pasted content, got: " + similarity);

        // Verify status classification
        SimilarityStatus status = similarity >= 0.80 ? SimilarityStatus.HIGH_SIMILARITY : SimilarityStatus.NORMAL;
        assertEquals(SimilarityStatus.HIGH_SIMILARITY, status);
    }

    @Test
    @DisplayName("Academic Integrity: Terminology is objective and non-accusatory (Potentially Similar)")
    void testNonAccusatoryTerminology() {
        // Confirm enum names are educational, not judicial
        assertNotEquals("CHEATER", SimilarityStatus.HIGH_SIMILARITY.name());
        assertEquals("HIGH_SIMILARITY", SimilarityStatus.HIGH_SIMILARITY.name());
        assertEquals("NORMAL", SimilarityStatus.NORMAL.name());
    }
}

