package com.questionnaire.service;

import com.questionnaire.constants.QuestionnaireConstants;
import com.questionnaire.model.Question;
import com.questionnaire.model.Questionnaire;
import com.questionnaire.model.QuestionnaireType;
import com.questionnaire.model.ResolvedQuestionnaire;
import com.questionnaire.repository.QuestionRepository;
import com.questionnaire.service.interfaces.IQuestionnaireService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

/**
 * Resolver klasse til at håndtere questionnaire ID resolution
 * Håndterer både "morning"/"evening" strings og MongoDB ObjectIds
 */
@Component
public class QuestionnaireResolver {
    
    @Autowired
    private IQuestionnaireService questionnaireService;
    
    @Autowired
    private QuestionRepository questionRepository;
    
    /**
     * Resolver questionnaire ID til faktisk ID og type
     * Håndterer "morning"/"evening" strings, MongoDB ObjectIds, og fallback via questions
     * @param questionnaireId Input ID (kan være "morning", "evening", eller MongoDB ObjectId)
     * @return ResolvedQuestionnaire med faktisk ID og type, eller null hvis ikke fundet
     */
    public ResolvedQuestionnaire resolveQuestionnaireId(String questionnaireId) {
        // Tjek om questionnaireId er "morning" eller "evening" (string)
        if (QuestionnaireConstants.QUESTIONNAIRE_TYPE_MORNING.equals(questionnaireId)) {
            Questionnaire questionnaire = questionnaireService.getQuestionnaireByType(QuestionnaireType.morning);
            return new ResolvedQuestionnaire(questionnaire.getId(), QuestionnaireType.morning);
        } else if (QuestionnaireConstants.QUESTIONNAIRE_TYPE_EVENING.equals(questionnaireId)) {
            Questionnaire questionnaire = questionnaireService.getQuestionnaireByType(QuestionnaireType.evening);
            return new ResolvedQuestionnaire(questionnaire.getId(), QuestionnaireType.evening);
        } else {
            // Hvis det er en MongoDB ObjectId, find questionnaire ved ID
            Optional<Questionnaire> questionnaireOpt = questionnaireService.findById(questionnaireId);
            if (questionnaireOpt.isPresent()) {
                Questionnaire questionnaire = questionnaireOpt.get();
                return new ResolvedQuestionnaire(questionnaireId, questionnaire.getType());
            } else {
                // Hvis ikke fundet, prøv at finde via spørgsmålene
                List<Question> questions = questionRepository.findByQuestionnaireIdOrderByOrderAsc(questionnaireId);
                if (!questions.isEmpty()) {
                    String foundQuestionnaireId = questions.get(0).getQuestionnaireId();
                    questionnaireOpt = questionnaireService.findById(foundQuestionnaireId);
                    if (questionnaireOpt.isPresent()) {
                        Questionnaire questionnaire = questionnaireOpt.get();
                        return new ResolvedQuestionnaire(foundQuestionnaireId, questionnaire.getType());
                    }
                }
            }
        }
        
        return null;
    }
}




