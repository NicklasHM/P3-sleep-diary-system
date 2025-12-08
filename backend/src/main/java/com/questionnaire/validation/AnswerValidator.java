package com.questionnaire.validation;

import com.questionnaire.exception.ValidationException;
import com.questionnaire.model.Question;

/**
 * Interface for answer validators
 * Polymorphism pattern for different answer types
 */
public interface AnswerValidator {
    /**
     * Validerer et svar mod et spørgsmål
     * @param question Spørgsmålet
     * @param answer Svaret der skal valideres
     * @throws ValidationException hvis svaret ikke er gyldig
     */
    void validate(Question question, Object answer) throws ValidationException;
}




