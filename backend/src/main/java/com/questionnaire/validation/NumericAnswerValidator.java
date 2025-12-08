package com.questionnaire.validation;

import com.questionnaire.exception.ValidationException;
import com.questionnaire.model.Question;
import org.springframework.stereotype.Component;

/**
 * Validator for numeric and slider answers
 */
@Component
public class NumericAnswerValidator implements AnswerValidator {
    
    @Override
    public void validate(Question question, Object answer) throws ValidationException {
        double value;
        try {
            if (answer instanceof Number) {
                value = ((Number) answer).doubleValue();
            } else {
                value = Double.parseDouble(answer.toString());
            }
        } catch (NumberFormatException e) {
            throw new ValidationException("Ugyldig numerisk værdi for spørgsmål: " + question.getText());
        }
        
        // Tjek minimum værdi
        if (question.getMinValue() != null && value < question.getMinValue()) {
            throw new ValidationException(
                String.format("Værdien for '%s' skal være mindst %d. Du indtastede: %.0f", 
                    question.getText(), question.getMinValue(), value)
            );
        }
        
        // Tjek maximum værdi
        if (question.getMaxValue() != null && value > question.getMaxValue()) {
            throw new ValidationException(
                String.format("Værdien for '%s' må højst være %d. Du indtastede: %.0f", 
                    question.getText(), question.getMaxValue(), value)
            );
        }
        
        // Standard validering: ingen negative værdier (hvis ikke minValue er sat)
        if (question.getMinValue() == null && value < 0) {
            throw new ValidationException(
                String.format("Værdien for '%s' kan ikke være negativ. Du indtastede: %.0f", 
                    question.getText(), value)
            );
        }
    }
}




