package com.questionnaire.integration.validation;

import com.questionnaire.constants.QuestionnaireConstants;
import com.questionnaire.exception.ValidationException;
import com.questionnaire.model.Question;
import com.questionnaire.model.Questionnaire;
import com.questionnaire.model.QuestionnaireType;
import com.questionnaire.model.QuestionType;
import com.questionnaire.service.QuestionFinder;
import com.questionnaire.service.interfaces.IQuestionnaireService;
import com.questionnaire.validation.EveningQuestionnaireValidator;
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
 * Integration tests for QuestionnaireValidatorFactory and Template Method Pattern
 * Tests OOP principles:
 * - Factory Pattern: QuestionnaireValidatorFactory returns correct validator
 * - Template Method Pattern: QuestionnaireValidator defines algorithm structure
 * - Inheritance: MorningQuestionnaireValidator extends QuestionnaireValidator
 * - Polymorphism: Same interface, different implementations
 */
@SpringBootTest
@DisplayName("QuestionnaireValidator Integration Tests - Factory + Template Method Pattern")
class QuestionnaireValidatorIntegrationTest {
    
    @Autowired
    private QuestionnaireValidatorFactory validatorFactory;
    
    @Autowired
    private IQuestionnaireService questionnaireService;
    
    @Autowired
    private QuestionFinder questionFinder;
    
    @Test
    @DisplayName("Skal returnere MorningQuestionnaireValidator for morning type - Test Factory Pattern")
    void testFactoryReturnsMorningValidator() {
        // Act
        QuestionnaireValidator validator = validatorFactory.getValidator(QuestionnaireType.morning);
        
        // Assert - Test Factory Pattern + Inheritance
        assertNotNull(validator, "Validator skal ikke være null");
        assertInstanceOf(MorningQuestionnaireValidator.class, validator,
            "Factory skal returnere MorningQuestionnaireValidator for morning type");
    }
    
    @Test
    @DisplayName("Skal returnere EveningQuestionnaireValidator for evening type - Test Factory Pattern")
    void testFactoryReturnsEveningValidator() {
        // Act
        QuestionnaireValidator validator = validatorFactory.getValidator(QuestionnaireType.evening);
        
        // Assert
        assertNotNull(validator, "Validator skal ikke være null");
        assertInstanceOf(EveningQuestionnaireValidator.class, validator,
            "Factory skal returnere EveningQuestionnaireValidator for evening type");
    }
    
    @Test
    @DisplayName("Skal validere morning questionnaire gennem template method - Test Template Method Pattern")
    void testTemplateMethodPattern() {
        // Arrange
        Questionnaire questionnaire = questionnaireService.getQuestionnaireByType(QuestionnaireType.morning);
        Map<String, Object> answers = createValidMorningAnswers(questionnaire.getId());
        
        QuestionnaireValidator validator = validatorFactory.getValidator(QuestionnaireType.morning);
        
        // Act - Template method kalder både fælles og specifik logik
        assertDoesNotThrow(() -> {
            validator.validate(questionnaire.getId(), answers);
        }, "Template method skal validere uden fejl for gyldige svar");
        
        // Assert - Template method pattern sikrer at både:
        // 1. validateBasicAnswers() (fra base class) bliver kaldt
        // 2. validateSpecificRules() (fra subclass) bliver kaldt
        // Dette demonstrerer Template Method Pattern + Inheritance
    }
    
    @Test
    @DisplayName("Skal validere evening questionnaire med forskellige regler - Test Polymorphism")
    void testPolymorphismWithDifferentValidators() {
        // Arrange
        Questionnaire morningQuestionnaire = questionnaireService.getQuestionnaireByType(QuestionnaireType.morning);
        Questionnaire eveningQuestionnaire = questionnaireService.getQuestionnaireByType(QuestionnaireType.evening);
        
        Map<String, Object> morningAnswers = createValidMorningAnswers(morningQuestionnaire.getId());
        Map<String, Object> eveningAnswers = new HashMap<>(); // Evening kan være tom
        
        QuestionnaireValidator morningValidator = validatorFactory.getValidator(QuestionnaireType.morning);
        QuestionnaireValidator eveningValidator = validatorFactory.getValidator(QuestionnaireType.evening);
        
        // Act & Assert - Forskellige implementeringer, samme interface
        // Dette demonstrerer polymorfi
        assertInstanceOf(MorningQuestionnaireValidator.class, morningValidator);
        assertInstanceOf(EveningQuestionnaireValidator.class, eveningValidator);
        
        // De kan have forskellige valideringsregler, men samme interface
        assertDoesNotThrow(() -> {
            morningValidator.validate(morningQuestionnaire.getId(), morningAnswers);
        });
        
        assertDoesNotThrow(() -> {
            eveningValidator.validate(eveningQuestionnaire.getId(), eveningAnswers);
        });
    }
    
    @Test
    @DisplayName("Skal kaste ValidationException ved ugyldige svar - Test Template Method Pattern Error Handling")
    void testTemplateMethodThrowsExceptionOnInvalidInput() {
        // Arrange
        Questionnaire questionnaire = questionnaireService.getQuestionnaireByType(QuestionnaireType.morning);
        Map<String, Object> invalidAnswers = createInvalidMorningAnswers(questionnaire.getId());
        
        QuestionnaireValidator validator = validatorFactory.getValidator(QuestionnaireType.morning);
        
        // Act & Assert - Template method skal håndtere fejl korrekt
        assertThrows(ValidationException.class, () -> {
            validator.validate(questionnaire.getId(), invalidAnswers);
        }, "Template method skal kaste ValidationException ved ugyldige svar");
    }
    
    @Test
    @DisplayName("Skal demonstrere arv: Subclass kalder superclass metode - Test Inheritance")
    void testInheritanceThroughTemplateMethod() {
        // Arrange
        Questionnaire questionnaire = questionnaireService.getQuestionnaireByType(QuestionnaireType.morning);
        Map<String, Object> answers = createValidMorningAnswers(questionnaire.getId());
        
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
    
    /**
     * Helper method to create valid morning answers
     */
    private Map<String, Object> createValidMorningAnswers(String questionnaireId) {
        List<Question> questions = questionnaireService.getQuestionsByQuestionnaireId(questionnaireId);
        Map<String, Object> answers = new HashMap<>();
        
        // Opret gyldige svar baseret på faktiske spørgsmål
        for (Question question : questions) {
            if (question.getOrder() == QuestionnaireConstants.ORDER_1) {
                answers.put(question.getId(), "med_no");
            } else if (question.getOrder() == QuestionnaireConstants.ORDER_2) {
                answers.put(question.getId(), "Læste en bog");
            } else if (question.getOrder() == QuestionnaireConstants.ORDER_3) {
                answers.put(question.getId(), "22:00");
            } else if (question.getOrder() == QuestionnaireConstants.ORDER_4) {
                answers.put(question.getId(), "22:15"); // Efter wentToBedTime
            } else if (question.getOrder() == QuestionnaireConstants.ORDER_5) {
                answers.put(question.getId(), 20);
            } else if (question.getOrder() == QuestionnaireConstants.ORDER_6) {
                answers.put(question.getId(), "wake_yes");
            } else if (question.getOrder() == QuestionnaireConstants.ORDER_7) {
                answers.put(question.getId(), 1);
            } else if (question.getOrder() == QuestionnaireConstants.ORDER_8) {
                answers.put(question.getId(), 10);
            } else if (question.getOrder() == QuestionnaireConstants.ORDER_9) {
                answers.put(question.getId(), "07:00");
            } else if (question.getOrder() == QuestionnaireConstants.ORDER_10) {
                answers.put(question.getId(), "07:30"); // Efter wokeUpTime
            } else if (question.getOrder() == QuestionnaireConstants.ORDER_11) {
                answers.put(question.getId(), 3);
            }
        }
        
        return answers;
    }
    
    /**
     * Helper method to create invalid morning answers
     * Opretter ugyldige svar der skal triggere ValidationException
     */
    private Map<String, Object> createInvalidMorningAnswers(String questionnaireId) {
        List<Question> questions = questionnaireService.getQuestionsByQuestionnaireId(questionnaireId);
        Map<String, Object> answers = new HashMap<>();
        
        // Find spørgsmål 3 og 4 (wentToBedTime og lightOffTime)
        Question wentToBedQuestion = questionFinder.findByOrderAndType(
            questions, QuestionnaireConstants.ORDER_3, QuestionType.time_picker);
        Question lightOffQuestion = questionFinder.findByOrderAndType(
            questions, QuestionnaireConstants.ORDER_4, QuestionType.time_picker);
        
        // Sæt lightOffTime til at være FØR wentToBedTime (ugyldigt!)
        if (wentToBedQuestion != null && lightOffQuestion != null) {
            answers.put(wentToBedQuestion.getId(), "22:30");  // Gik i seng kl. 22:30
            answers.put(lightOffQuestion.getId(), "22:00");   // Slukkede lys kl. 22:00 (FØR!)
        }
        
        return answers;
    }
}

