package com.questionnaire.strategy;

import com.questionnaire.model.Question;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/**
 * Conditional logic strategi for aftenskema
 * Håndterer conditional children logik
 */
@Component
public class EveningQuestionnaireConditionalLogic implements ConditionalLogicStrategy {
    
    private static final Logger logger = LoggerFactory.getLogger(EveningQuestionnaireConditionalLogic.class);
    
    @Override
    public Question shouldShow(Question question, Map<String, Object> answers, List<Question> allQuestions, String currentQuestionId) {
        // Tjek om dette spørgsmål er et conditional child af et tidligere spørgsmål
        // Conditional children håndteres i frontend, så de skal altid springes over her
        for (Question parentQuestion : allQuestions) {
            if (parentQuestion.getConditionalChildren() != null) {
                for (com.questionnaire.model.ConditionalChild cc : parentQuestion.getConditionalChildren()) {
                    if (cc.getChildQuestionId() != null && cc.getChildQuestionId().equals(question.getId())) {
                        // Dette er et conditional child - spring over det, da det håndteres i frontend
                        logger.debug("Skipping conditional child {} - handled in frontend", question.getId());
                        return null;
                    }
                }
            }
        }
        
        // Returner spørgsmålet hvis det skal vises
        return question;
    }
}




