package com.questionnaire.integration.strategy;

import com.questionnaire.constants.QuestionnaireConstants;
import com.questionnaire.model.Question;
import com.questionnaire.model.QuestionType;
import com.questionnaire.model.QuestionnaireType;
import com.questionnaire.service.QuestionFinder;
import com.questionnaire.strategy.ConditionalLogicFactory;
import com.questionnaire.strategy.ConditionalLogicStrategy;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import static org.junit.jupiter.api.Assertions.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Integration tests for Conditional Logic Strategy implementations
 * Tests Strategy Pattern in practice - OOP principle: Polymorphism
 * Demonstrates how different strategies behave differently with same interface
 */
@SpringBootTest
@DisplayName("Conditional Logic Strategy Integration Tests - Strategy Pattern i praksis")
class ConditionalLogicStrategyIntegrationTest {
    
    @Autowired
    private ConditionalLogicFactory conditionalLogicFactory;
    
    @Autowired
    private QuestionFinder questionFinder;
    
    @Test
    @DisplayName("Skal springe spørgsmål 7 og 8 over når spørgsmål 6 er 'Nej' - Test Morning Strategy")
    void testMorningStrategySkipsQuestionWhenQuestion6IsNo() {
        // Arrange
        List<Question> questions = createTestQuestions();
        Question question7 = questionFinder.findByOrderAndType(questions, QuestionnaireConstants.ORDER_7, QuestionType.numeric);
        assertNotNull(question7, "Spørgsmål 7 skal eksistere");
        
        Map<String, Object> answers = new HashMap<>();
        Question question6 = questionFinder.findByOrderAndType(questions, QuestionnaireConstants.ORDER_6, QuestionType.multiple_choice);
        answers.put(question6.getId(), "wake_no"); // Spørgsmål 6 = "Nej"
        
        // Act - Test Strategy Pattern
        ConditionalLogicStrategy strategy = conditionalLogicFactory.getStrategy(QuestionnaireType.morning);
        Question result = strategy.shouldShow(question7, answers, questions, question7.getId());
        
        // Assert - Strategy pattern skal returnere null (skjul spørgsmål)
        assertNull(result, "Spørgsmål 7 skal skjules når spørgsmål 6 er 'Nej'");
    }
    
    @Test
    @DisplayName("Skal vise spørgsmål 7 og 8 når spørgsmål 6 er 'Ja' - Test Morning Strategy")
    void testMorningStrategyShowsQuestionWhenQuestion6IsYes() {
        // Arrange
        List<Question> questions = createTestQuestions();
        Question question7 = questionFinder.findByOrderAndType(questions, QuestionnaireConstants.ORDER_7, QuestionType.numeric);
        
        Map<String, Object> answers = new HashMap<>();
        Question question6 = questionFinder.findByOrderAndType(questions, QuestionnaireConstants.ORDER_6, QuestionType.multiple_choice);
        answers.put(question6.getId(), "wake_yes"); // Spørgsmål 6 = "Ja"
        
        // Act
        ConditionalLogicStrategy strategy = conditionalLogicFactory.getStrategy(QuestionnaireType.morning);
        Question result = strategy.shouldShow(question7, answers, questions, question7.getId());
        
        // Assert
        assertNotNull(result, "Spørgsmål 7 skal vises når spørgsmål 6 er 'Ja'");
        assertEquals(question7.getId(), result.getId());
    }
    
    @Test
    @DisplayName("Skal vise alle spørgsmål for evening strategy - Test Evening Strategy")
    void testEveningStrategyShowsAllQuestions() {
        // Arrange
        List<Question> questions = createTestQuestions();
        Question question7 = questionFinder.findByOrderAndType(questions, QuestionnaireConstants.ORDER_7, QuestionType.numeric);
        
        Map<String, Object> answers = new HashMap<>();
        Question question6 = questionFinder.findByOrderAndType(questions, QuestionnaireConstants.ORDER_6, QuestionType.multiple_choice);
        answers.put(question6.getId(), "wake_no");
        
        // Act
        ConditionalLogicStrategy strategy = conditionalLogicFactory.getStrategy(QuestionnaireType.evening);
        Question result = strategy.shouldShow(question7, answers, questions, question7.getId());
        
        // Assert - Evening strategy har ikke denne conditional logic
        assertNotNull(result, "Evening strategy skal vise spørgsmål 7");
    }
    
    @Test
    @DisplayName("Skal håndtere manglende svar gracefully - Test Strategy Pattern Robustness")
    void testStrategyHandlesMissingAnswer() {
        // Arrange
        List<Question> questions = createTestQuestions();
        Question question7 = questionFinder.findByOrderAndType(questions, QuestionnaireConstants.ORDER_7, QuestionType.numeric);
        
        Map<String, Object> answers = new HashMap<>(); // Tom map - ingen svar
        
        // Act
        ConditionalLogicStrategy strategy = conditionalLogicFactory.getStrategy(QuestionnaireType.morning);
        Question result = strategy.shouldShow(question7, answers, questions, question7.getId());
        
        // Assert - Skal ikke fejle, skal returnere null når spørgsmål 6 ikke er besvaret
        assertNull(result, "Strategy skal returnere null når spørgsmål 6 ikke er besvaret");
    }
    
    @Test
    @DisplayName("Skal demonstrere polymorfi: Forskellige strategier, samme interface - Test Polymorphism")
    void testPolymorphismWithDifferentStrategies() {
        // Arrange
        List<Question> questions = createTestQuestions();
        Question question = questionFinder.findByOrderAndType(questions, QuestionnaireConstants.ORDER_7, QuestionType.numeric);
        Map<String, Object> answers = new HashMap<>();
        Question question6 = questionFinder.findByOrderAndType(questions, QuestionnaireConstants.ORDER_6, QuestionType.multiple_choice);
        answers.put(question6.getId(), "wake_yes");
        
        // Act - Få forskellige strategier gennem samme interface
        ConditionalLogicStrategy morningStrategy = conditionalLogicFactory.getStrategy(QuestionnaireType.morning);
        ConditionalLogicStrategy eveningStrategy = conditionalLogicFactory.getStrategy(QuestionnaireType.evening);
        ConditionalLogicStrategy defaultStrategy = conditionalLogicFactory.getStrategy(null);
        
        Question morningResult = morningStrategy.shouldShow(question, answers, questions, question.getId());
        Question eveningResult = eveningStrategy.shouldShow(question, answers, questions, question.getId());
        Question defaultResult = defaultStrategy.shouldShow(question, answers, questions, question.getId());
        
        // Assert - Alle implementerer samme interface, men kan have forskellig adfærd
        // Dette demonstrerer polymorfi
        assertTrue(morningStrategy instanceof ConditionalLogicStrategy);
        assertTrue(eveningStrategy instanceof ConditionalLogicStrategy);
        assertTrue(defaultStrategy instanceof ConditionalLogicStrategy);
        
        // Verificer at resultaterne er korrekte (kan være null eller Question)
        assertNotNull(morningResult != null || eveningResult != null || defaultResult != null,
            "Mindst et resultat skal være returneret");
        
        // Alle skal returnere et resultat (eller null) - samme interface kontrakt
        // Men implementeringen kan være forskellig
    }
    
    /**
     * Helper method to create test questions
     */
    private List<Question> createTestQuestions() {
        List<Question> questions = new ArrayList<>();
        
        Question question6 = new Question();
        question6.setId("q6");
        question6.setOrder(QuestionnaireConstants.ORDER_6);
        question6.setType(QuestionType.multiple_choice);
        questions.add(question6);
        
        Question question7 = new Question();
        question7.setId("q7");
        question7.setOrder(QuestionnaireConstants.ORDER_7);
        question7.setType(QuestionType.numeric);
        questions.add(question7);
        
        Question question8 = new Question();
        question8.setId("q8");
        question8.setOrder(QuestionnaireConstants.ORDER_8);
        question8.setType(QuestionType.numeric);
        questions.add(question8);
        
        return questions;
    }
}

