package com.questionnaire.factory;

import com.questionnaire.model.Question;
import com.questionnaire.model.QuestionType;

/**
 * Factory interface for creating questions
 */
public interface QuestionFactory {
    /**
     * Opretter et nyt spørgsmål med korrekt validering
     * @param questionnaireId ID på spørgeskema
     * @param text Tekst på spørgsmålet
     * @param type Type af spørgsmål
     * @param isLocked Om spørgsmålet er låst
     * @param order Rækkefølge
     * @return Oprettet spørgsmål
     */
    Question createQuestion(String questionnaireId, String text, QuestionType type, boolean isLocked, int order);
    
    /**
     * Opretter et nyt spørgsmål med dansk og engelsk tekst
     * @param questionnaireId ID på spørgeskema
     * @param textDa Dansk tekst
     * @param textEn Engelsk tekst
     * @param type Type af spørgsmål
     * @param isLocked Om spørgsmålet er låst
     * @param order Rækkefølge
     * @return Oprettet spørgsmål
     */
    Question createQuestion(String questionnaireId, String textDa, String textEn, QuestionType type, boolean isLocked, int order);
}




