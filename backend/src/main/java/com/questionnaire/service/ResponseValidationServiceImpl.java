package com.questionnaire.service;

import com.questionnaire.model.Questionnaire;
import com.questionnaire.model.QuestionnaireType;
import com.questionnaire.service.interfaces.IQuestionnaireService;
import com.questionnaire.service.interfaces.IResponseValidationService;
import com.questionnaire.validation.QuestionnaireValidator;
import com.questionnaire.validation.QuestionnaireValidatorFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * Service til validering af response data
 * Delegates to questionnaire-specific validators using strategy pattern
 */
@Service
public class ResponseValidationServiceImpl implements IResponseValidationService {

    @Autowired
    private IQuestionnaireService questionnaireService;
    
    @Autowired
    private QuestionnaireValidatorFactory questionnaireValidatorFactory;

    /**
     * Validerer alle svar mod spørgsmålernes min/max værdier og tidslogik
     * Uses questionnaire-specific validators for better separation of concerns
     */
    public void validateResponse(String questionnaireId, Map<String, Object> answers) {
        // Hent questionnaire for at bestemme type
        Questionnaire questionnaire = questionnaireService.findById(questionnaireId)
                .orElseThrow(() -> new RuntimeException("Questionnaire ikke fundet: " + questionnaireId));
        
        QuestionnaireType questionnaireType = questionnaire.getType();
        
        // Brug factory til at få korrekt validator baseret på questionnaire type
        QuestionnaireValidator validator = questionnaireValidatorFactory.getValidator(questionnaireType);
        
        // Kald validator's validate metode (template method pattern)
        validator.validate(questionnaireId, answers);
    }
}

