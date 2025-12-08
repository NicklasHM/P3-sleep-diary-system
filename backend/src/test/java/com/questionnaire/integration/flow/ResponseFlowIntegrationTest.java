package com.questionnaire.integration.flow;

import com.questionnaire.model.Question;
import com.questionnaire.model.QuestionType;
import com.questionnaire.model.Questionnaire;
import com.questionnaire.model.QuestionnaireType;
import com.questionnaire.model.Response;
import com.questionnaire.model.User;
import com.questionnaire.model.UserRole;
import com.questionnaire.repository.ResponseRepository;
import com.questionnaire.repository.UserRepository;
import com.questionnaire.service.interfaces.IResponseService;
import com.questionnaire.service.interfaces.IQuestionnaireService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import static org.junit.jupiter.api.Assertions.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Integration tests for complete Response Flow
 * Tests applikationen som helhed: Controller -> Service -> Validation -> Repository
 * Demonstrates how OOP patterns work together in practice
 */
@SpringBootTest
@DisplayName("Response Flow Integration Test - Test applikationen som helhed")
class ResponseFlowIntegrationTest {
    
    @Autowired
    private IResponseService responseService;
    
    @Autowired
    private IQuestionnaireService questionnaireService;
    
    @Autowired
    private ResponseRepository responseRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    private User testUser;
    private String questionnaireId;
    
    @BeforeEach
    void setUp() {
        // Cleanup: Slet eksisterende testuser og responses FØR testen kører
        // Dette sikrer test isolation - hver test starter med en ren database state
        Optional<User> existingTestUser = userRepository.findByUsername("testuser");
        if (existingTestUser.isPresent()) {
            User existingUser = existingTestUser.get();
            // Slet alle responses først
            List<Response> existingResponses = responseRepository.findByUserId(existingUser.getId());
            if (!existingResponses.isEmpty()) {
                responseRepository.deleteAll(existingResponses);
            }
            // Slet testuser
            userRepository.delete(existingUser);
        }
        
        // Setup test data - opret ny testuser
        testUser = createOrGetTestUser();
        Questionnaire questionnaire = questionnaireService.getQuestionnaireByType(QuestionnaireType.morning);
        questionnaireId = questionnaire.getId();
    }
    
    @AfterEach
    void tearDown() {
        // Cleanup: Slet alle responses for testuser efter testen
        // Dette sikrer at tests ikke påvirker hinanden
        if (testUser != null && testUser.getId() != null) {
            List<Response> responses = responseRepository.findByUserId(testUser.getId());
            if (!responses.isEmpty()) {
                responseRepository.deleteAll(responses);
            }
            
            // Slet også testuser så den ikke vises i UI
            // Dette sikrer at testdata ikke forurener produktionsmiljøet
            userRepository.delete(testUser);
        }
    }
    
    @Test
    @DisplayName("Skal gemme response gennem hele flowet - Test End-to-End Integration")
    void testCompleteResponseFlow() {
        // Arrange
        Map<String, Object> answers = createValidAnswers(questionnaireId);
        
        // Act - Test hele flowet: Service -> Validation -> Repository
        Response response = responseService.saveResponse(
            testUser.getId(),
            questionnaireId,
            answers
        );
        
        // Assert - Verificer at data er gemt korrekt
        assertNotNull(response, "Response skal ikke være null");
        assertNotNull(response.getId(), "Response skal have et ID");
        assertEquals(testUser.getId(), response.getUserId(), "Response skal have korrekt userId");
        assertEquals(questionnaireId, response.getQuestionnaireId(), "Response skal have korrekt questionnaireId");
        
        // Verificer at response findes i database
        Optional<Response> savedResponse = responseRepository.findById(response.getId());
        assertTrue(savedResponse.isPresent(), "Response skal være gemt i database");
        
        // Verificer at answers er korrekt gemt
        assertNotNull(savedResponse.get().getAnswers(), "Answers skal være gemt");
    }
    
    @Test
    @DisplayName("Skal validere response gennem Strategy + Factory + Template Method patterns - Test OOP Patterns Integration")
    void testValidationThroughOOPPatterns() {
        // Arrange - Opret ugyldige svar der skal triggere validation
        Map<String, Object> invalidAnswers = createInvalidAnswers(questionnaireId);
        
        // Act & Assert
        // Dette tester at:
        // 1. QuestionnaireValidatorFactory (Factory Pattern) returnerer korrekt validator
        // 2. MorningQuestionnaireValidator (Inheritance + Template Method) validerer
        // 3. ValidatorFactory (Factory Pattern for AnswerValidators) returnerer korrekte validators
        // 4. Alle virker sammen i integration
        assertThrows(Exception.class, () -> {
            responseService.saveResponse(testUser.getId(), questionnaireId, invalidAnswers);
        }, "Validation gennem OOP patterns skal fange ugyldige svar");
    }
    
    @Test
    @DisplayName("Skal håndtere conditional logic gennem Strategy Pattern - Test Strategy Pattern Integration")
    void testConditionalLogicThroughStrategyPattern() {
        // Arrange
        Questionnaire questionnaire = questionnaireService.getQuestionnaireByType(QuestionnaireType.morning);
        List<Question> questions = questionnaireService.getQuestionsByQuestionnaireId(questionnaire.getId());
        
        Map<String, Object> answers = new HashMap<>();
        
        // Sæt spørgsmål 6 til "Nej" (skal skjule spørgsmål 7 og 8 gennem Strategy Pattern)
        Question question6 = questions.stream()
            .filter(q -> q.getOrder() == 6 && q.getType() == QuestionType.multiple_choice)
            .findFirst()
            .orElse(null);
        
        if (question6 != null) {
            answers.put(question6.getId(), "wake_no");
        }
        
        // Act - Test at getNextQuestion bruger Strategy Pattern
        Question nextQuestion = responseService.getNextQuestion(
            questionnaire.getId(),
            answers,
            question6 != null ? question6.getId() : questions.get(0).getId()
        );
        
        // Assert - Strategy Pattern skal springe spørgsmål 7 og 8 over
        if (nextQuestion != null) {
            assertNotEquals(7, nextQuestion.getOrder(), 
                "Strategy Pattern skal springe spørgsmål 7 over når spørgsmål 6 er 'Nej'");
            assertNotEquals(8, nextQuestion.getOrder(), 
                "Strategy Pattern skal springe spørgsmål 8 over når spørgsmål 6 er 'Nej'");
        }
    }
    
    @Test
    @DisplayName("Skal beregne sleep parameters efter response er gemt - Test Complete Flow")
    void testSleepParameterCalculation() {
        // Arrange
        Map<String, Object> answers = createValidAnswers(questionnaireId);
        
        // Act
        Response response = responseService.saveResponse(
            testUser.getId(),
            questionnaireId,
            answers
        );
        
        // Act - Beregn sleep parameters
        var sleepParameters = responseService.calculateSleepParameters(response.getId());
        
        // Assert - Sleep parameters skal være beregnet
        assertNotNull(sleepParameters, "Sleep parameters skal være beregnet");
        // Yderligere assertions baseret på sleep parameter structure
    }
    
    /**
     * Helper method to create or get test user
     */
    private User createOrGetTestUser() {
        Optional<User> existingUser = userRepository.findByUsername("testuser");
        if (existingUser.isPresent()) {
            return existingUser.get();
        }
        
        User user = new User();
        user.setUsername("testuser");
        user.setFirstName("Test");
        user.setLastName("User");
        user.setPassword("testpassword123"); // Skal være hashet i praksis
        user.setRole(UserRole.BORGER);
        return userRepository.save(user);
    }
    
    /**
     * Helper method to create valid answers
     */
    private Map<String, Object> createValidAnswers(String questionnaireId) {
        List<Question> questions = questionnaireService.getQuestionsByQuestionnaireId(questionnaireId);
        Map<String, Object> answers = new HashMap<>();
        
        for (Question question : questions) {
            if (question.getOrder() == 1 && question.getType() == QuestionType.multiple_choice) {
                answers.put(question.getId(), "med_no");
            } else if (question.getOrder() == 2 && question.getType() == QuestionType.text) {
                answers.put(question.getId(), "Læste en bog");
            } else if (question.getOrder() == 3 && question.getType() == QuestionType.time_picker) {
                answers.put(question.getId(), "22:00");
            } else if (question.getOrder() == 4 && question.getType() == QuestionType.time_picker) {
                answers.put(question.getId(), "22:15");
            } else if (question.getOrder() == 5 && question.getType() == QuestionType.numeric) {
                answers.put(question.getId(), 20);
            } else if (question.getOrder() == 6 && question.getType() == QuestionType.multiple_choice) {
                answers.put(question.getId(), "wake_yes");
            } else if (question.getOrder() == 7 && question.getType() == QuestionType.numeric) {
                answers.put(question.getId(), 1);
            } else if (question.getOrder() == 8 && question.getType() == QuestionType.numeric) {
                answers.put(question.getId(), 10);
            } else if (question.getOrder() == 9 && question.getType() == QuestionType.time_picker) {
                answers.put(question.getId(), "07:00");
            } else if (question.getOrder() == 10 && question.getType() == QuestionType.time_picker) {
                answers.put(question.getId(), "07:30");
            } else if (question.getOrder() == 11 && question.getType() == QuestionType.slider) {
                answers.put(question.getId(), 3);
            }
        }
        
        return answers;
    }
    
    /**
     * Helper method to create invalid answers
     */
    private Map<String, Object> createInvalidAnswers(String questionnaireId) {
        List<Question> questions = questionnaireService.getQuestionsByQuestionnaireId(questionnaireId);
        Map<String, Object> answers = new HashMap<>();
        
        // Sæt lightOffTime til at være før wentToBedTime (ugyldigt)
        for (Question question : questions) {
            if (question.getOrder() == 3 && question.getType() == QuestionType.time_picker) {
                answers.put(question.getId(), "22:30");
            } else if (question.getOrder() == 4 && question.getType() == QuestionType.time_picker) {
                answers.put(question.getId(), "22:00"); // Før wentToBedTime - ugyldigt!
            }
        }
        
        return answers;
    }
}

