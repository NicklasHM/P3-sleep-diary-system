package com.questionnaire.validation;

import com.questionnaire.constants.QuestionnaireConstants;
import com.questionnaire.exception.ValidationException;
import com.questionnaire.model.Question;
import org.springframework.stereotype.Component;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;

/**
 * Validator for time picker answers
 */
@Component
public class TimeAnswerValidator implements AnswerValidator {
    
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern(QuestionnaireConstants.TIME_FORMAT);
    
    @Override
    public void validate(Question question, Object answer) throws ValidationException {
        String timeString = answer.toString().trim();
        
        try {
            LocalTime time = LocalTime.parse(timeString, TIME_FORMATTER);
            
            // Tjek minimum tid
            if (question.getMinTime() != null && !question.getMinTime().isEmpty()) {
                LocalTime minTime = LocalTime.parse(question.getMinTime(), TIME_FORMATTER);
                if (time.isBefore(minTime)) {
                    throw new ValidationException(
                        String.format("Tiden for '%s' skal være senest %s. Du indtastede: %s", 
                            question.getText(), question.getMinTime(), timeString)
                    );
                }
            }
            
            // Tjek maximum tid
            if (question.getMaxTime() != null && !question.getMaxTime().isEmpty()) {
                LocalTime maxTime = LocalTime.parse(question.getMaxTime(), TIME_FORMATTER);
                if (time.isAfter(maxTime)) {
                    throw new ValidationException(
                        String.format("Tiden for '%s' må højst være %s. Du indtastede: %s", 
                            question.getText(), question.getMaxTime(), timeString)
                    );
                }
            }
        } catch (Exception e) {
            if (e instanceof ValidationException) {
                throw e;
            }
            throw new ValidationException("Ugyldig tidsformat for spørgsmål: " + question.getText() + ". Forventet format: " + QuestionnaireConstants.TIME_FORMAT);
        }
    }
}




