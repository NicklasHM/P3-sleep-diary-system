package com.questionnaire.validation;

import com.questionnaire.model.QuestionnaireType;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Factory til at returnere korrekt questionnaire validator baseret på questionnaire type
 */
@Component
public class QuestionnaireValidatorFactory {
    private static final Logger logger = LoggerFactory.getLogger(QuestionnaireValidatorFactory.class);

    private final MorningQuestionnaireValidator morningValidator;
    private final EveningQuestionnaireValidator eveningValidator;

    public QuestionnaireValidatorFactory(
            MorningQuestionnaireValidator morningValidator,
            EveningQuestionnaireValidator eveningValidator) {
        this.morningValidator = morningValidator;
        this.eveningValidator = eveningValidator;
    }
    
    /**
     * Returnerer korrekt validator baseret på questionnaire type
     * @param type Questionnaire type
     * @return Korrekt validator implementation
     */
    public QuestionnaireValidator getValidator(QuestionnaireType type) {
        if (type == QuestionnaireType.morning) {
            return morningValidator;
        } else if (type == QuestionnaireType.evening) {
            return eveningValidator;
        } else {
            // Default til evening validator hvis type ikke er kendt
            logger.warn("Ukendt questionnaire type '{}', falder tilbage til evening validator", type);
            return eveningValidator;
        }
    }
}




