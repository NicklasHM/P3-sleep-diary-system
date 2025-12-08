package com.questionnaire.utils;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Map;

/**
 * Utility class for parsing answer values
 * Eliminates code duplication in validation logic
 */
public class AnswerParser {
    
    /**
     * Private constructor to prevent instantiation
     */
    private AnswerParser() {
        throw new UnsupportedOperationException("Utility class cannot be instantiated");
    }
    
    /**
     * Parser et Object til int
     * Håndterer både Number og String typer
     * @param answer Svaret der skal parses
     * @return Parsed integer værdi
     * @throws NumberFormatException hvis parsing fejler
     */
    public static int parseInt(Object answer) {
        if (answer instanceof Number) {
            return ((Number) answer).intValue();
        } else {
            return Integer.parseInt(answer.toString());
        }
    }
    
    /**
     * Parser et Object til double
     * Håndterer både Number og String typer
     * @param answer Svaret der skal parses
     * @return Parsed double værdi
     * @throws NumberFormatException hvis parsing fejler
     */
    public static double parseDouble(Object answer) {
        if (answer instanceof Number) {
            return ((Number) answer).doubleValue();
        } else {
            return Double.parseDouble(answer.toString());
        }
    }
    
    /**
     * Parser et Object til LocalTime
     * @param answer Svaret der skal parses
     * @param formatter DateTimeFormatter til at parse tiden
     * @return Parsed LocalTime værdi
     * @throws DateTimeParseException hvis parsing fejler
     */
    public static LocalTime parseTime(Object answer, DateTimeFormatter formatter) {
        String timeString = answer.toString().trim();
        return LocalTime.parse(timeString, formatter);
    }
    
    /**
     * Ekstraherer option ID fra et multiple choice svar
     * Håndterer både string option ID og "Andet" option objekt (Map med optionId og customText)
     * @param answer Svaret der skal parses
     * @return Option ID som string, eller null hvis ikke fundet
     */
    public static String extractOptionId(Object answer) {
        if (answer == null) {
            return null;
        }
        
        // Håndter "Andet" option objekt (Map fra JSON)
        if (answer instanceof Map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> answerMap = (Map<String, Object>) answer;
            Object optionIdObj = answerMap.get("optionId");
            if (optionIdObj != null) {
                return optionIdObj.toString();
            }
            return null;
        }
        
        // Håndter normal string option ID
        return answer.toString();
    }
    
    /**
     * Ekstraherer custom text fra et "Andet" option svar
     * @param answer Svaret der skal parses
     * @return Custom text som string, eller null hvis ikke fundet eller ikke relevant
     */
    public static String extractCustomText(Object answer) {
        if (answer == null) {
            return null;
        }
        
        // Håndter kun "Andet" option objekt (Map fra JSON)
        if (answer instanceof Map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> answerMap = (Map<String, Object>) answer;
            Object customTextObj = answerMap.get("customText");
            if (customTextObj != null) {
                return customTextObj.toString();
            }
        }
        
        return null;
    }
}


