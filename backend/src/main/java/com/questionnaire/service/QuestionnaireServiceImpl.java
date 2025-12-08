package com.questionnaire.service;

import com.questionnaire.model.Question;
import com.questionnaire.model.Questionnaire;
import com.questionnaire.model.QuestionnaireType;
import com.questionnaire.repository.QuestionRepository;
import com.questionnaire.repository.QuestionnaireRepository;
import com.questionnaire.service.interfaces.IQuestionService;
import com.questionnaire.service.interfaces.IQuestionnaireService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class QuestionnaireServiceImpl implements IQuestionnaireService {

    @Autowired
    private QuestionnaireRepository questionnaireRepository;

    @Autowired
    private QuestionRepository questionRepository;

    public Questionnaire getQuestionnaireByType(QuestionnaireType type) {
        return questionnaireRepository.findByType(type)
                .orElseGet(() -> {
                    // Opret spørgeskema hvis det ikke findes
                    String name = type == QuestionnaireType.morning ? "Morgenskema" : "Aftenskema";
                    Questionnaire questionnaire = new Questionnaire(type, name);
                    return questionnaireRepository.save(questionnaire);
                });
    }

    public List<Question> getQuestionsByQuestionnaireId(String questionnaireId) {
        return questionRepository.findByQuestionnaireIdOrderByOrderAsc(questionnaireId);
    }

    @Autowired
    private IQuestionService questionService;

    public List<Question> getQuestionsByQuestionnaireId(String questionnaireId, String language) {
        List<Question> questions = getQuestionsByQuestionnaireId(questionnaireId);
        // Oversæt spørgsmål baseret på sprog
        return questions.stream()
                .map(q -> questionService.translateQuestion(q, language))
                .collect(java.util.stream.Collectors.toList());
    }

    public Questionnaire createQuestionnaire(QuestionnaireType type, String name) {
        Questionnaire questionnaire = new Questionnaire(type, name);
        return questionnaireRepository.save(questionnaire);
    }

    public Optional<Questionnaire> findByType(QuestionnaireType type) {
        return questionnaireRepository.findByType(type);
    }

    public Optional<Questionnaire> findById(String id) {
        return questionnaireRepository.findById(id);
    }
}




