package com.questionnaire.validation;

import com.questionnaire.model.QuestionType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 * Factory til at returnere korrekt validator baseret på question type
 * Polymorphism pattern
 */
@Component
public class ValidatorFactory {
    
    @Autowired
    private TextAnswerValidator textValidator;
    
    @Autowired
    private NumericAnswerValidator numericValidator;
    
    @Autowired
    private TimeAnswerValidator timeValidator;
    
    @Autowired
    private MultipleChoiceAnswerValidator multipleChoiceValidator;
    
    /**
     * Returnerer korrekt validator baseret på question type
     */
    public AnswerValidator getValidator(QuestionType type) {
        switch (type) {
            case text:
                return textValidator;
            case numeric:
            case slider:
                return numericValidator;
            case time_picker:
                return timeValidator;
            case multiple_choice:
            case multiple_choice_multiple:
                return multipleChoiceValidator;
            default:
                // Default validator (ingen validering)
                return (question, answer) -> {};
        }
    }
}




