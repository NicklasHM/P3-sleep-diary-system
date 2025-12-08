package com.questionnaire.system;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.questionnaire.dto.LoginRequest;
import com.questionnaire.model.User;
import com.questionnaire.model.UserRole;
import com.questionnaire.repository.UserRepository;
import java.util.Optional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * System tests for Questionnaire Platform
 * Tests applikationen som helhed gennem API endpoints
 * Demonstrates end-to-end testing of the complete system
 */
@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("System Test - Test applikationen som helhed gennem API")
class QuestionnaireSystemTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @Autowired
    private ObjectMapper objectMapper;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @BeforeEach
    void setUp() {
        // Cleanup: Slet eksisterende testuser FØR testen kører
        // Dette sikrer at testuseren ikke vises i UI fra tidligere testkørsel
        Optional<User> existingUser = userRepository.findByUsername("testuser");
        if (existingUser.isPresent()) {
            userRepository.delete(existingUser.get());
        }
        
        // Opret ny testuser med hashet password
        User user = new User();
        user.setUsername("testuser");
        user.setPassword(passwordEncoder.encode("testpassword")); // Hash password!
        user.setFirstName("Test");
        user.setLastName("User");
        user.setRole(UserRole.BORGER);
        userRepository.save(user);
    }
    
    @AfterEach
    void tearDown() {
        // Cleanup: Slet testuser efter testen så den ikke vises i UI
        // Dette sikrer at testdata ikke forurener produktionsmiljøet
        Optional<User> testUser = userRepository.findByUsername("testuser");
        if (testUser.isPresent()) {
            userRepository.delete(testUser.get());
        }
    }
    
    @Test
    @WithMockUser(username = "testuser", roles = {"BORGER"})
    @DisplayName("Skal hente questionnaire gennem API - Test System Integration")
    void testGetQuestionnaire() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/questionnaires/morning")
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.type").value("morning"))
            .andExpect(jsonPath("$.id").exists());
    }
    
    @Test
    @WithMockUser(username = "testuser", roles = {"BORGER"})
    @DisplayName("Skal starte questionnaire og få første spørgsmål - Test System Flow")
    void testStartQuestionnaire() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/questionnaires/morning/start")
                .param("language", "da")
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").exists())
            .andExpect(jsonPath("$[0].order").exists());
    }
    
    @Test
    @DisplayName("Skal håndtere login flow - Test Authentication System")
    void testLoginFlow() throws Exception {
        // Arrange
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("testuser");
        loginRequest.setPassword("testpassword");
        
        // Act & Assert
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.token").exists());
    }
    
    @Test
    @WithMockUser(username = "testuser", roles = {"BORGER"})
    @DisplayName("Skal håndtere komplet questionnaire flow - Test End-to-End System")
    void testCompleteQuestionnaireFlow() throws Exception {
        // 1. Start questionnaire (med mocked user)
        mockMvc.perform(get("/api/questionnaires/morning/start")
                .param("language", "da")
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").exists());
        
        // 2. Get questionnaire
        mockMvc.perform(get("/api/questionnaires/morning")
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.type").value("morning"));
        
        // 3. Get next question (hvis implementeret)
        // 4. Save response (kræver authentication)
        // Dette tester applikationen som helhed
    }
    
    @Test
    @DisplayName("Skal håndtere fejl korrekt gennem hele systemet - Test Error Handling")
    void testErrorHandling() throws Exception {
        // Act & Assert - Test at systemet håndterer fejl korrekt
        mockMvc.perform(get("/api/questionnaires/invalid")
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(result -> {
                int status = result.getResponse().getStatus();
                assertTrue(status >= 400 && status < 600, 
                    "Skal returnere fejl status (4xx eller 5xx)");
            });
    }
    
}

