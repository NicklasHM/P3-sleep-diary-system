package com.questionnaire.strategy;

import com.questionnaire.model.QuestionnaireType;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Factory til at returnere korrekt conditional logic strategi baseret på questionnaire type
 */
@Component
public class ConditionalLogicFactory {
    private static final Logger logger = LoggerFactory.getLogger(ConditionalLogicFactory.class);

    private final MorningQuestionnaireConditionalLogic morningStrategy;
    private final EveningQuestionnaireConditionalLogic eveningStrategy;
    private final DefaultConditionalLogic defaultStrategy;

    public ConditionalLogicFactory(
            MorningQuestionnaireConditionalLogic morningStrategy,
            EveningQuestionnaireConditionalLogic eveningStrategy,
            DefaultConditionalLogic defaultStrategy) {
        this.morningStrategy = morningStrategy;
        this.eveningStrategy = eveningStrategy;
        this.defaultStrategy = defaultStrategy;
    }
    
    /**
     * Returnerer korrekt strategi baseret på questionnaire type
     */
    public ConditionalLogicStrategy getStrategy(QuestionnaireType type) {
        if (type == QuestionnaireType.morning) {
            return morningStrategy;
        } else if (type == QuestionnaireType.evening) {
            return eveningStrategy;
        } else {
            logger.warn("Ukendt questionnaire type '{}', falder tilbage til default strategy", type);
            return defaultStrategy;
        }
    }
}




