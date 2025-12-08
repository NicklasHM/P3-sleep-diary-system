package com.questionnaire.validation;

import com.questionnaire.exception.ValidationException;
import com.questionnaire.model.Question;
import com.questionnaire.model.QuestionOption;
import com.questionnaire.model.QuestionType;
import com.questionnaire.utils.AnswerParser;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Validator for multiple choice answers
 * Håndterer både normale option IDs og "Andet" option med custom text
 * Støtter både single choice (multiple_choice) og multiple choice (multiple_choice_multiple)
 */
@Component
public class MultipleChoiceAnswerValidator implements AnswerValidator {
    
    @Override
    public void validate(Question question, Object answer) throws ValidationException {
        // For multiple choice, tjek at svaret er en gyldig option ID
        if (question.getOptions() == null || question.getOptions().isEmpty()) {
            throw new ValidationException("Spørgsmålet har ingen valgmuligheder");
        }
        
        // Håndter multiple_choice_multiple (array af valg)
        if (question.getType() == QuestionType.multiple_choice_multiple) {
            validateMultipleChoices(question, answer);
        } else {
            // Håndter multiple_choice (enkelt valg)
            validateSingleChoice(question, answer);
        }
    }
    
    /**
     * Validerer enkelt valg for multiple_choice
     */
    private void validateSingleChoice(Question question, Object answer) throws ValidationException {
        // Brug AnswerParser til at ekstrahere option ID (håndterer både string og Map)
        String answerId = AnswerParser.extractOptionId(answer);
        if (answerId == null || answerId.isEmpty()) {
            throw new ValidationException("Ugyldig valgmulighed for spørgsmål: " + question.getText());
        }
        
        // Find og valider den valgte option
        QuestionOption selectedOption = findAndValidateOption(question, answerId);
        
        // Hvis det er "Andet" option, valider at customText er udfyldt
        validateOtherOption(question, selectedOption, answer);
    }
    
    /**
     * Validerer flere valg for multiple_choice_multiple
     */
    private void validateMultipleChoices(Question question, Object answer) throws ValidationException {
        // Konverter til List hvis det er et array
        List<?> answerList;
        if (answer instanceof List) {
            answerList = (List<?>) answer;
        } else if (answer instanceof Object[]) {
            answerList = java.util.Arrays.asList((Object[]) answer);
        } else {
            throw new ValidationException("Ugyldig format for multiple choice multiple svar i spørgsmål: " + question.getText());
        }
        
        if (answerList.isEmpty()) {
            throw new ValidationException("Mindst ét valg er påkrævet for spørgsmål: " + question.getText());
        }
        
        // Valider hvert valg i arrayet
        for (Object item : answerList) {
            String answerId = AnswerParser.extractOptionId(item);
            if (answerId == null || answerId.isEmpty()) {
                throw new ValidationException("Ugyldig valgmulighed for spørgsmål: " + question.getText());
            }
            
            // Find og valider option
            QuestionOption selectedOption = findAndValidateOption(question, answerId);
            
            // Hvis det er "Andet" option, valider at customText er udfyldt
            validateOtherOption(question, selectedOption, item);
        }
    }
    
    /**
     * Finder og validerer en option baseret på option ID
     */
    private QuestionOption findAndValidateOption(Question question, String answerId) throws ValidationException {
        QuestionOption selectedOption = question.getOptions().stream()
            .filter(option -> option.getId().equals(answerId))
            .findFirst()
            .orElse(null);
        
        if (selectedOption == null) {
            throw new ValidationException("Ugyldig valgmulighed for spørgsmål: " + question.getText());
        }
        
        return selectedOption;
    }
    
    /**
     * Validerer "Andet" option - tjekker at customText er udfyldt
     */
    private void validateOtherOption(Question question, QuestionOption selectedOption, Object answer) throws ValidationException {
        if (Boolean.TRUE.equals(selectedOption.getIsOther())) {
            String customText = AnswerParser.extractCustomText(answer);
            if (customText == null || customText.trim().isEmpty()) {
                throw new ValidationException("Custom tekst er påkrævet for 'Andet' option i spørgsmål: " + question.getText());
            }
        }
    }
}


