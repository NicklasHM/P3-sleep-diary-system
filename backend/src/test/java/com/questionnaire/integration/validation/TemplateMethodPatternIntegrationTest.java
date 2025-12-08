package com.questionnaire.integration.validation;

import com.questionnaire.constants.QuestionnaireConstants;
import com.questionnaire.exception.ValidationException;
import com.questionnaire.model.Question;
import com.questionnaire.model.Questionnaire;
import com.questionnaire.model.QuestionnaireType;
import com.questionnaire.model.QuestionType;
import com.questionnaire.service.interfaces.IQuestionnaireService;
import com.questionnaire.service.QuestionFinder;
import com.questionnaire.validation.MorningQuestionnaireValidator;
import com.questionnaire.validation.QuestionnaireValidator;
import com.questionnaire.validation.QuestionnaireValidatorFactory;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import static org.junit.jupiter.api.Assertions.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Integration tests demonstrating Template Method Pattern
 * Tests OOP principle: Template Method Pattern + Inheritance
 * Shows how base class defines algorithm structure and subclasses implement specific steps
 */
@SpringBootTest
@DisplayName("Template Method Pattern Integration Tests")
class TemplateMethodPatternIntegrationTest {
    
    @Autowired
    private QuestionnaireValidatorFactory validatorFactory;
    
    @Autowired
    private IQuestionnaireService questionnaireService;
    
    @Autowired
    private QuestionFinder questionFinder;
    
    @Test
    @DisplayName("Skal validere gennem template method: Base class + Subclass - Test Template Method Pattern")
    void testTemplateMethodPatternExecution() {
        // Arrange
        Questionnaire questionnaire = questionnaireService.getQuestionnaireByType(QuestionnaireType.morning);
        List<Question> questions = questionnaireService.getQuestionsByQuestionnaireId(questionnaire.getId());
        
        // Opret gyldige svar baseret på faktiske spørgsmål
        Map<String, Object> answers = createValidAnswersForQuestions(questions);
        
        QuestionnaireValidator validator = validatorFactory.getValidator(QuestionnaireType.morning);
        
        // Act - Template method kalder:
        // 1. validateBasicAnswers() (fra base class QuestionnaireValidator)
        // 2. validateSpecificRules() (fra subclass MorningQuestionnaireValidator)
        assertDoesNotThrow(() -> {
            validator.validate(questionnaire.getId(), answers);
        }, "Template method skal validere uden fejl");
        
        // Assert - Template method pattern sikrer at både fælles og specifik logik køres
        // Dette demonstrerer Template Method Pattern + Inheritance
    }
    
    @Test
    @DisplayName("Skal validere lightOffTime ikke er før wentToBedTime - Test Morning Validator Specific Rules")
    void testMorningValidatorSpecificRule() {
        // Arrange
        Questionnaire questionnaire = questionnaireService.getQuestionnaireByType(QuestionnaireType.morning);
        List<Question> questions = questionnaireService.getQuestionsByQuestionnaireId(questionnaire.getId());
        
        Map<String, Object> answers = createValidAnswersForQuestions(questions);
        
        // Sæt lightOffTime til at være før wentToBedTime (ugyldigt)
        Question wentToBedQuestion = questionFinder.findByOrderAndType(
            questions, QuestionnaireConstants.ORDER_3, QuestionType.time_picker);
        Question lightOffQuestion = questionFinder.findByOrderAndType(
            questions, QuestionnaireConstants.ORDER_4, QuestionType.time_picker);
        
        if (wentToBedQuestion != null && lightOffQuestion != null) {
            answers.put(wentToBedQuestion.getId(), "22:30");
            answers.put(lightOffQuestion.getId(), "22:00"); // Før wentToBedTime - ugyldigt!
        }
        
        QuestionnaireValidator validator = validatorFactory.getValidator(QuestionnaireType.morning);
        
        // Act & Assert - Template method skal kaste exception fra subclass specific rule
        assertThrows(ValidationException.class, () -> {
            validator.validate(questionnaire.getId(), answers);
        }, "Template method skal kaste ValidationException fra validateSpecificRules()");
    }
    
    @Test
    @DisplayName("Skal demonstrere arv: Subclass udvider base class - Test Inheritance")
    void testInheritanceThroughTemplateMethod() {
        // Arrange
        Questionnaire questionnaire = questionnaireService.getQuestionnaireByType(QuestionnaireType.morning);
        List<Question> questions = questionnaireService.getQuestionsByQuestionnaireId(questionnaire.getId());
        Map<String, Object> answers = createValidAnswersForQuestions(questions);
        
        MorningQuestionnaireValidator validator = 
            (MorningQuestionnaireValidator) validatorFactory.getValidator(QuestionnaireType.morning);
        
        // Act - Template method i base class kalder både:
        // - validateBasicAnswers() (fra base class)
        // - validateSpecificRules() (fra subclass)
        assertDoesNotThrow(() -> {
            validator.validate(questionnaire.getId(), answers);
        });
        
        // Assert - Dette demonstrerer arv: Subclass udvider base class funktionalitet
        assertTrue(validator instanceof QuestionnaireValidator,
            "MorningQuestionnaireValidator skal arve fra QuestionnaireValidator");
    }
    
    @Test
    @DisplayName("Skal validere basic answers gennem base class - Test Template Method Base Logic")
    void testTemplateMethodBaseLogic() {
        // Arrange
        Questionnaire questionnaire = questionnaireService.getQuestionnaireByType(QuestionnaireType.morning);
        List<Question> questions = questionnaireService.getQuestionsByQuestionnaireId(questionnaire.getId());
        
        Map<String, Object> answers = new HashMap<>();
        
        // Tilføj et svar der overtræder min/max (skal fanges af base class validateBasicAnswers)
        for (Question question : questions) {
            if (question.getType() == QuestionType.numeric && question.getMinValue() != null) {
                // Sæt et svar der er under minValue
                answers.put(question.getId(), question.getMinValue() - 1);
                break;
            }
        }
        
        QuestionnaireValidator validator = validatorFactory.getValidator(QuestionnaireType.morning);
        
        // Act & Assert - Base class validateBasicAnswers skal fange fejlen
        // Dette viser at template method kalder base class logik først
        if (!answers.isEmpty()) {
            assertThrows(ValidationException.class, () -> {
                validator.validate(questionnaire.getId(), answers);
            }, "Base class validateBasicAnswers skal fange min/max fejl");
        }
    }
    
    /**
     * Helper method to create valid answers for questions
     */
    private Map<String, Object> createValidAnswersForQuestions(List<Question> questions) {
        Map<String, Object> answers = new HashMap<>();
        
        for (Question question : questions) {
            if (question.getType() == QuestionType.time_picker) {
                // Sæt gyldig tid
                answers.put(question.getId(), "22:00");
            } else if (question.getType() == QuestionType.numeric) {
                // Sæt gyldig numerisk værdi
                int value = question.getMinValue() != null ? question.getMinValue() : 0;
                answers.put(question.getId(), value);
            } else if (question.getType() == QuestionType.text) {
                // Sæt gyldig tekst
                answers.put(question.getId(), "Test svar");
            }
        }
        
        // Sørg for at tider er i korrekt rækkefølge
        Question wentToBedQuestion = questionFinder.findByOrderAndType(
            questions, QuestionnaireConstants.ORDER_3, QuestionType.time_picker);
        Question lightOffQuestion = questionFinder.findByOrderAndType(
            questions, QuestionnaireConstants.ORDER_4, QuestionType.time_picker);
        Question wokeUpQuestion = questionFinder.findByOrderAndType(
            questions, QuestionnaireConstants.ORDER_9, QuestionType.time_picker);
        Question gotUpQuestion = questionFinder.findByOrderAndType(
            questions, QuestionnaireConstants.ORDER_10, QuestionType.time_picker);
        
        if (wentToBedQuestion != null) {
            answers.put(wentToBedQuestion.getId(), "22:00");
        }
        if (lightOffQuestion != null) {
            answers.put(lightOffQuestion.getId(), "22:15"); // Efter wentToBedTime
        }
        if (wokeUpQuestion != null) {
            answers.put(wokeUpQuestion.getId(), "07:00");
        }
        if (gotUpQuestion != null) {
            answers.put(gotUpQuestion.getId(), "07:30"); // Efter wokeUpTime
        }
        
        return answers;
    }
}


