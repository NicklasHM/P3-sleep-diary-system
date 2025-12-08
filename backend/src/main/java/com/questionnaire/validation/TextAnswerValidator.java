package com.questionnaire.validation;

import com.questionnaire.constants.QuestionnaireConstants;
import com.questionnaire.exception.ValidationException;
import com.questionnaire.model.Question;
import org.springframework.stereotype.Component;

/**
 * Validator for text answers
 */
@Component
public class TextAnswerValidator implements AnswerValidator {
    
    @Override
    public void validate(Question question, Object answer) throws ValidationException {
        String text = answer.toString();
        
        // Valider max længde (spørgsmål 2 i morgenskema: max 200 tegn)
        if (question.getOrder() == QuestionnaireConstants.ORDER_2) {
            if (text.length() > QuestionnaireConstants.MAX_TEXT_LENGTH) {
                throw new ValidationException(
                    String.format("Teksten for '%s' må højst være %d tegn. Du indtastede %d tegn.", 
                        question.getText(), QuestionnaireConstants.MAX_TEXT_LENGTH, text.length())
                );
            }
        }
        
        if (text.trim().isEmpty()) {
            throw new ValidationException(
                String.format("Teksten for '%s' skal indeholde mindst 1 tegn.", question.getText())
            );
        }
    }
}



