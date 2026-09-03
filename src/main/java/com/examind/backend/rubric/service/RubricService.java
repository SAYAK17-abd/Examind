package com.examind.backend.rubric.service;

import com.examind.backend.common.exception.BadRequestException;
import com.examind.backend.common.exception.ResourceNotFoundException;
import com.examind.backend.question.entity.Question;
import com.examind.backend.question.repository.QuestionRepository;
import com.examind.backend.rubric.dto.RubricCriterionDto;
import com.examind.backend.rubric.dto.RubricDto;
import com.examind.backend.rubric.entity.Rubric;
import com.examind.backend.rubric.entity.RubricCriterion;
import com.examind.backend.rubric.repository.RubricRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RubricService {

    private final RubricRepository rubricRepository;
    private final QuestionRepository questionRepository;

    public RubricService(RubricRepository rubricRepository, QuestionRepository questionRepository) {
        this.rubricRepository = rubricRepository;
        this.questionRepository = questionRepository;
    }

    @Transactional
    public RubricDto saveRubric(Long questionId, RubricDto dto) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Question", "id", questionId));

        Rubric rubric = rubricRepository.findByQuestion_Id(questionId)
                .orElse(new Rubric(question, dto.getName(), dto.getDescription()));

        rubric.setName(dto.getName());
        rubric.setDescription(dto.getDescription());
        rubric.getCriteria().clear();

        double totalCriteriaMarks = 0.0;
        if (dto.getCriteria() != null) {
            for (RubricCriterionDto cDto : dto.getCriteria()) {
                RubricCriterion criterion = new RubricCriterion(
                        cDto.getCriterion(),
                        cDto.getDescription(),
                        cDto.getMaxMarks(),
                        cDto.getWeight()
                );
                rubric.addCriterion(criterion);
                totalCriteriaMarks += cDto.getMaxMarks();
            }
        }

        if (totalCriteriaMarks > question.getMaxMarks()) {
            throw new BadRequestException("Sum of rubric criteria max marks (" + totalCriteriaMarks +
                    ") cannot exceed question max marks (" + question.getMaxMarks() + ")");
        }

        Rubric saved = rubricRepository.save(rubric);
        return RubricDto.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public RubricDto getRubricByQuestionId(Long questionId) {
        Rubric rubric = rubricRepository.findByQuestion_Id(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Rubric for question", "questionId", questionId));
        return RubricDto.fromEntity(rubric);
    }

    public Rubric getRubricEntityByQuestionId(Long questionId) {
        return rubricRepository.findByQuestion_Id(questionId).orElse(null);
    }
}
