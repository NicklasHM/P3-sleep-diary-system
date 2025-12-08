package com.questionnaire.integration.strategy;

import com.questionnaire.model.Question;
import com.questionnaire.model.QuestionType;
import com.questionnaire.model.QuestionnaireType;
import com.questionnaire.strategy.ConditionalLogicFactory;
import com.questionnaire.strategy.ConditionalLogicStrategy;
import com.questionnaire.strategy.DefaultConditionalLogic;
import com.questionnaire.strategy.EveningQuestionnaireConditionalLogic;
import com.questionnaire.strategy.MorningQuestionnaireConditionalLogic;
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
 * Integration tests for ConditionalLogicFactory
 * Tests Strategy Pattern - OOP principle: Polymorphism
 * Demonstrates how Factory Pattern returns different Strategy implementations
 */
@SpringBootTest
@DisplayName("ConditionalLogicFactory Integration Tests - Strategy Pattern")
class ConditionalLogicFactoryIntegrationTest {
    
    @Autowired
    private ConditionalLogicFactory factory;
    
    @Test
    @DisplayName("Skal returnere MorningQuestionnaireConditionalLogic for morning type - Test Factory Pattern")
    void testGetStrategyForMorning() {
        // Act
        ConditionalLogicStrategy strategy = factory.getStrategy(QuestionnaireType.morning);
        
        // Assert - Test polymorfi: Strategy interface med konkret implementering
        assertNotNull(strategy, "Strategy skal ikke være null");
        assertInstanceOf(MorningQuestionnaireConditionalLogic.class, strategy, 
            "Factory skal returnere MorningQuestionnaireConditionalLogic for morning type");
    }
    
    @Test
    @DisplayName("Skal returnere EveningQuestionnaireConditionalLogic for evening type - Test Factory Pattern")
    void testGetStrategyForEvening() {
        // Act
        ConditionalLogicStrategy strategy = factory.getStrategy(QuestionnaireType.evening);
        
        // Assert - Test polymorfi
        assertNotNull(strategy, "Strategy skal ikke være null");
        assertInstanceOf(EveningQuestionnaireConditionalLogic.class, strategy,
            "Factory skal returnere EveningQuestionnaireConditionalLogic for evening type");
    }
    
    @Test
    @DisplayName("Skal returnere DefaultConditionalLogic for null type - Test Factory Pattern")
    void testGetStrategyForNull() {
        // Act - Test med null type
        ConditionalLogicStrategy strategy = factory.getStrategy(null);
        
        // Assert
        assertNotNull(strategy, "Strategy skal ikke være null selv ved null type");
        assertInstanceOf(DefaultConditionalLogic.class, strategy,
            "Factory skal returnere DefaultConditionalLogic for null type");
    }
    
    @Test
    @DisplayName("Skal evaluere conditional logic korrekt gennem strategy interface - Test Polymorphism")
    void testStrategyPolymorphism() {
        // Arrange
        Question question = new Question();
        question.setId("q7");
        question.setOrder(7);
        question.setType(QuestionType.numeric);
        
        List<Question> allQuestions = new ArrayList<>();
        Question question6 = new Question();
        question6.setId("q6");
        question6.setOrder(6);
        question6.setType(QuestionType.multiple_choice);
        allQuestions.add(question6);
        allQuestions.add(question);
        
        Map<String, Object> answers = new HashMap<>();
        answers.put("q6", "wake_no"); // Spørgsmål 6 = "Nej"
        
        // Act - Test polymorfi: Samme interface, forskellige implementeringer
        ConditionalLogicStrategy morningStrategy = factory.getStrategy(QuestionnaireType.morning);
        ConditionalLogicStrategy eveningStrategy = factory.getStrategy(QuestionnaireType.evening);
        
        Question morningResult = morningStrategy.shouldShow(question, answers, allQuestions, "q7");
        Question eveningResult = eveningStrategy.shouldShow(question, answers, allQuestions, "q7");
        
        // Assert - Forskellige strategier kan give forskellige resultater
        // Morning strategy skal skjule spørgsmål 7 når spørgsmål 6 er "Nej"
        assertNull(morningResult, 
            "Morning strategy skal returnere null (skjul spørgsmål) når spørgsmål 6 er 'Nej'");
        
        // Evening strategy skal returnere spørgsmålet (ingen conditional logic for denne case)
        assertNotNull(eveningResult, 
            "Evening strategy skal returnere spørgsmålet");
        
        // Dette demonstrerer polymorfi: Samme interface, forskellig adfærd
    }
    
    @Test
    @DisplayName("Skal håndtere forskellige questionnaire typer korrekt - Test Strategy Pattern")
    void testDifferentQuestionnaireTypes() {
        // Act
        ConditionalLogicStrategy morning = factory.getStrategy(QuestionnaireType.morning);
        ConditionalLogicStrategy evening = factory.getStrategy(QuestionnaireType.evening);
        
        // Assert - Verificer at de er forskellige instanser
        assertNotSame(morning, evening, 
            "Morning og Evening strategier skal være forskellige instanser");
        
        // Verificer at de implementerer samme interface (polymorfi)
        assertTrue(morning instanceof ConditionalLogicStrategy);
        assertTrue(evening instanceof ConditionalLogicStrategy);
    }
    
    @Test
    @DisplayName("Skal returnere konsistente strategier ved gentagne kald - Test Factory Pattern")
    void testFactoryConsistency() {
        // Act - Kald factory flere gange
        ConditionalLogicStrategy strategy1 = factory.getStrategy(QuestionnaireType.morning);
        ConditionalLogicStrategy strategy2 = factory.getStrategy(QuestionnaireType.morning);
        ConditionalLogicStrategy strategy3 = factory.getStrategy(QuestionnaireType.evening);
        
        // Assert - Skal returnere samme type, men kan være forskellige instanser
        assertInstanceOf(MorningQuestionnaireConditionalLogic.class, strategy1);
        assertInstanceOf(MorningQuestionnaireConditionalLogic.class, strategy2);
        assertInstanceOf(EveningQuestionnaireConditionalLogic.class, strategy3);
    }
}



