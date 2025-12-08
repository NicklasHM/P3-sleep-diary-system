package com.questionnaire.strategy;

import com.questionnaire.model.Question;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/**
 * Standard conditional logic strategi
 * Returnerer altid spørgsmålet (ingen conditional logic)
 */
@Component
public class DefaultConditionalLogic implements ConditionalLogicStrategy {
    
    @Override
    public Question shouldShow(Question question, Map<String, Object> answers, List<Question> allQuestions, String currentQuestionId) {
        // Standard logik: vis altid spørgsmålet
        return question;
    }
}




