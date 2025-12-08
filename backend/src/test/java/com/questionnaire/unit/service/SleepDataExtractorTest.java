package com.questionnaire.unit.service;

import com.questionnaire.constants.QuestionnaireConstants;
import com.questionnaire.model.Question;
import com.questionnaire.model.QuestionType;
import com.questionnaire.service.SleepDataExtractor;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Unit tests for SleepDataExtractor
 * Tests extraction of sleep data from answers map using Map pattern
 */
@DisplayName("SleepDataExtractor Unit Tests")
class SleepDataExtractorTest {
    
    private SleepDataExtractor extractor;
    
    @BeforeEach
    void setUp() {
        extractor = new SleepDataExtractor();
    }
    
    @Test
    @DisplayName("Skal udtrække wentToBedTime fra order 3")
    void testExtractWentToBedTime() {
        // Arrange
        List<Question> questions = new ArrayList<>();
        Question question = new Question();
        question.setId("q1");
        question.setOrder(QuestionnaireConstants.ORDER_3);
        question.setType(QuestionType.time_picker);
        questions.add(question);
        
        Map<String, Object> answers = new HashMap<>();
        answers.put("q1", "22:00");
        
        // Act
        var result = extractor.extract(questions, answers);
        
        // Assert
        assertEquals("22:00", result.getWentToBedTime());
    }
    
    @Test
    @DisplayName("Skal udtrække lightOffTime fra order 4")
    void testExtractLightOffTime() {
        // Arrange
        List<Question> questions = new ArrayList<>();
        Question question = new Question();
        question.setId("q1");
        question.setOrder(QuestionnaireConstants.ORDER_4);
        question.setType(QuestionType.time_picker);
        questions.add(question);
        
        Map<String, Object> answers = new HashMap<>();
        answers.put("q1", "22:15");
        
        // Act
        var result = extractor.extract(questions, answers);
        
        // Assert
        assertEquals("22:15", result.getLightOffTime());
    }
    
    @Test
    @DisplayName("Skal udtrække fellAsleepAfter fra order 5")
    void testExtractFellAsleepAfter() {
        // Arrange
        List<Question> questions = new ArrayList<>();
        Question question = new Question();
        question.setId("q1");
        question.setOrder(QuestionnaireConstants.ORDER_5);
        question.setType(QuestionType.numeric);
        questions.add(question);
        
        Map<String, Object> answers = new HashMap<>();
        answers.put("q1", "15");
        
        // Act
        var result = extractor.extract(questions, answers);
        
        // Assert
        assertEquals("15", result.getFellAsleepAfter());
    }
    
    @Test
    @DisplayName("Skal udtrække WASO fra order 8 som double")
    void testExtractWASO() {
        // Arrange
        List<Question> questions = new ArrayList<>();
        Question question = new Question();
        question.setId("q1");
        question.setOrder(QuestionnaireConstants.ORDER_8);
        question.setType(QuestionType.numeric);
        questions.add(question);
        
        Map<String, Object> answers = new HashMap<>();
        answers.put("q1", "15.5");
        
        // Act
        var result = extractor.extract(questions, answers);
        
        // Assert
        assertEquals(15.5, result.getWASO(), 0.001);
    }
    
    @Test
    @DisplayName("Skal håndtere WASO parsing fejl gracefully")
    void testExtractWASOWithInvalidInput() {
        // Arrange
        List<Question> questions = new ArrayList<>();
        Question question = new Question();
        question.setId("q1");
        question.setOrder(QuestionnaireConstants.ORDER_8);
        question.setType(QuestionType.numeric);
        questions.add(question);
        
        Map<String, Object> answers = new HashMap<>();
        answers.put("q1", "ikke et tal");
        
        // Act
        var result = extractor.extract(questions, answers);
        
        // Assert - Skal sætte WASO til 0.0 ved parsing fejl
        assertEquals(0.0, result.getWASO(), 0.001);
    }
    
    @Test
    @DisplayName("Skal udtrække wokeUpTime fra order 9")
    void testExtractWokeUpTime() {
        // Arrange
        List<Question> questions = new ArrayList<>();
        Question question = new Question();
        question.setId("q1");
        question.setOrder(QuestionnaireConstants.ORDER_9);
        question.setType(QuestionType.time_picker);
        questions.add(question);
        
        Map<String, Object> answers = new HashMap<>();
        answers.put("q1", "07:00");
        
        // Act
        var result = extractor.extract(questions, answers);
        
        // Assert
        assertEquals("07:00", result.getWokeUpTime());
    }
    
    @Test
    @DisplayName("Skal udtrække gotUpTime fra order 10")
    void testExtractGotUpTime() {
        // Arrange
        List<Question> questions = new ArrayList<>();
        Question question = new Question();
        question.setId("q1");
        question.setOrder(QuestionnaireConstants.ORDER_10);
        question.setType(QuestionType.time_picker);
        questions.add(question);
        
        Map<String, Object> answers = new HashMap<>();
        answers.put("q1", "07:30");
        
        // Act
        var result = extractor.extract(questions, answers);
        
        // Assert
        assertEquals("07:30", result.getGotUpTime());
    }
    
    @Test
    @DisplayName("Skal håndtere manglende svar gracefully")
    void testExtractWithMissingAnswer() {
        // Arrange
        List<Question> questions = new ArrayList<>();
        Question question = new Question();
        question.setId("q1");
        question.setOrder(QuestionnaireConstants.ORDER_3);
        question.setType(QuestionType.time_picker);
        questions.add(question);
        
        Map<String, Object> answers = new HashMap<>(); // Tom map
        
        // Act
        var result = extractor.extract(questions, answers);
        
        // Assert
        assertNull(result.getWentToBedTime());
    }
    
    @Test
    @DisplayName("Skal udtrække alle felter fra komplet answers map")
    void testExtractAllFields() {
        // Arrange
        List<Question> questions = new ArrayList<>();
        
        Question q3 = new Question();
        q3.setId("q3");
        q3.setOrder(QuestionnaireConstants.ORDER_3);
        q3.setType(QuestionType.time_picker);
        questions.add(q3);
        
        Question q4 = new Question();
        q4.setId("q4");
        q4.setOrder(QuestionnaireConstants.ORDER_4);
        q4.setType(QuestionType.time_picker);
        questions.add(q4);
        
        Question q5 = new Question();
        q5.setId("q5");
        q5.setOrder(QuestionnaireConstants.ORDER_5);
        q5.setType(QuestionType.numeric);
        questions.add(q5);
        
        Question q8 = new Question();
        q8.setId("q8");
        q8.setOrder(QuestionnaireConstants.ORDER_8);
        q8.setType(QuestionType.numeric);
        questions.add(q8);
        
        Question q9 = new Question();
        q9.setId("q9");
        q9.setOrder(QuestionnaireConstants.ORDER_9);
        q9.setType(QuestionType.time_picker);
        questions.add(q9);
        
        Question q10 = new Question();
        q10.setId("q10");
        q10.setOrder(QuestionnaireConstants.ORDER_10);
        q10.setType(QuestionType.time_picker);
        questions.add(q10);
        
        Map<String, Object> answers = new HashMap<>();
        answers.put("q3", "22:00");
        answers.put("q4", "22:15");
        answers.put("q5", "20");
        answers.put("q8", "10.5");
        answers.put("q9", "07:00");
        answers.put("q10", "07:30");
        
        // Act
        var result = extractor.extract(questions, answers);
        
        // Assert
        assertEquals("22:00", result.getWentToBedTime());
        assertEquals("22:15", result.getLightOffTime());
        assertEquals("20", result.getFellAsleepAfter());
        assertEquals(10.5, result.getWASO(), 0.001);
        assertEquals("07:00", result.getWokeUpTime());
        assertEquals("07:30", result.getGotUpTime());
    }
    
    @Test
    @DisplayName("Skal ignorere spørgsmål uden handler")
    void testExtractIgnoresUnhandledQuestions() {
        // Arrange
        List<Question> questions = new ArrayList<>();
        Question question = new Question();
        question.setId("q1");
        question.setOrder(999); // Order der ikke har en handler
        question.setType(QuestionType.text);
        questions.add(question);
        
        Map<String, Object> answers = new HashMap<>();
        answers.put("q1", "test");
        
        // Act
        var result = extractor.extract(questions, answers);
        
        // Assert - Skal ikke fejle, bare ignorere
        assertNotNull(result);
    }
}


