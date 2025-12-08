package com.questionnaire.unit.utils;

import com.questionnaire.utils.AnswerParser;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;

/**
 * Unit tests for AnswerParser utility class
 * Tests static methods for parsing different answer types
 */
@DisplayName("AnswerParser Unit Tests")
class AnswerParserTest {
    
    @Test
    @DisplayName("Skal parse integer fra Number objekt")
    void testParseIntFromNumber() {
        // Arrange
        Integer number = 42;
        
        // Act
        int result = AnswerParser.parseInt(number);
        
        // Assert
        assertEquals(42, result);
    }
    
    @Test
    @DisplayName("Skal parse integer fra String")
    void testParseIntFromString() {
        // Arrange
        String numberString = "42";
        
        // Act
        int result = AnswerParser.parseInt(numberString);
        
        // Assert
        assertEquals(42, result);
    }
    
    @Test
    @DisplayName("Skal parse integer fra Long")
    void testParseIntFromLong() {
        // Arrange
        Long longValue = 100L;
        
        // Act
        int result = AnswerParser.parseInt(longValue);
        
        // Assert
        assertEquals(100, result);
    }
    
    @Test
    @DisplayName("Skal kaste NumberFormatException ved ugyldig input")
    void testParseIntThrowsException() {
        // Arrange
        String invalidInput = "ikke et tal";
        
        // Act & Assert
        assertThrows(NumberFormatException.class, () -> {
            AnswerParser.parseInt(invalidInput);
        });
    }
    
    @Test
    @DisplayName("Skal parse double fra Number objekt")
    void testParseDoubleFromNumber() {
        // Arrange
        Double number = 42.5;
        
        // Act
        double result = AnswerParser.parseDouble(number);
        
        // Assert
        assertEquals(42.5, result, 0.001);
    }
    
    @Test
    @DisplayName("Skal parse double fra String")
    void testParseDoubleFromString() {
        // Arrange
        String numberString = "42.75";
        
        // Act
        double result = AnswerParser.parseDouble(numberString);
        
        // Assert
        assertEquals(42.75, result, 0.001);
    }
    
    @Test
    @DisplayName("Skal parse double fra Integer")
    void testParseDoubleFromInteger() {
        // Arrange
        Integer integer = 100;
        
        // Act
        double result = AnswerParser.parseDouble(integer);
        
        // Assert
        assertEquals(100.0, result, 0.001);
    }
    
    @Test
    @DisplayName("Skal kaste NumberFormatException ved ugyldig double input")
    void testParseDoubleThrowsException() {
        // Arrange
        String invalidInput = "ikke et tal";
        
        // Act & Assert
        assertThrows(NumberFormatException.class, () -> {
            AnswerParser.parseDouble(invalidInput);
        });
    }
    
    @Test
    @DisplayName("Skal parse LocalTime fra String med formatter")
    void testParseTime() {
        // Arrange
        String timeString = "22:30";
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("HH:mm");
        
        // Act
        LocalTime result = AnswerParser.parseTime(timeString, formatter);
        
        // Assert
        assertEquals(LocalTime.of(22, 30), result);
    }
    
    @Test
    @DisplayName("Skal parse LocalTime med whitespace")
    void testParseTimeWithWhitespace() {
        // Arrange
        String timeString = "  22:30  ";
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("HH:mm");
        
        // Act
        LocalTime result = AnswerParser.parseTime(timeString, formatter);
        
        // Assert
        assertEquals(LocalTime.of(22, 30), result);
    }
    
    @Test
    @DisplayName("Skal kaste DateTimeParseException ved ugyldig time format")
    void testParseTimeThrowsException() {
        // Arrange
        String invalidTime = "25:99";
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("HH:mm");
        
        // Act & Assert
        assertThrows(java.time.format.DateTimeParseException.class, () -> {
            AnswerParser.parseTime(invalidTime, formatter);
        });
    }
}




