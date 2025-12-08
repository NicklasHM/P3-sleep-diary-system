package com.questionnaire.strategy;

import com.questionnaire.model.Question;

import java.util.List;
import java.util.Map;

/**
 * Strategy interface for conditional logic evaluering
 */
public interface ConditionalLogicStrategy {
    /**
     * Evaluerer om et spørgsmål skal vises baseret på conditional logic
     * @param question Spørgsmålet der skal evalueres
     * @param answers Nuværende svar
     * @param allQuestions Alle spørgsmål i questionnaire
     * @param currentQuestionId ID på nuværende spørgsmål
     * @return Spørgsmålet hvis det skal vises, null hvis det skal skjules
     */
    Question shouldShow(Question question, Map<String, Object> answers, List<Question> allQuestions, String currentQuestionId);
}




