package com.questionnaire.constants;

/**
 * Constants for questionnaire system
 */
public class QuestionnaireConstants {
    
    // Question order constants for morning questionnaire
    public static final int ORDER_1 = 1; // Medicin/kosttilskud
    public static final int ORDER_2 = 2; // Hvad foretog du dig
    public static final int ORDER_3 = 3; // Gik i seng klokken
    public static final int ORDER_4 = 4; // Slukkede lyset klokken
    public static final int ORDER_5 = 5; // Faldt i søvn efter (minutter)
    public static final int ORDER_6 = 6; // Vågnede du i løbet af natten? (multiple_choice)
    public static final int ORDER_7 = 7; // Hvor mange gange? (numeric)
    public static final int ORDER_8 = 8; // Hvor mange minutter? (numeric - WASO)
    public static final int ORDER_9 = 9; // Vågnede klokken
    public static final int ORDER_10 = 10; // Stod op klokken
    public static final int ORDER_11 = 11; // Følte mig (slider)
    
    // Validation limits
    public static final int MAX_TEXT_LENGTH = 200;
    public static final int MIN_PASSWORD_LENGTH = 8;
    
    // Time format
    public static final String TIME_FORMAT = "HH:mm";
    
    // Copenhagen timezone
    public static final String COPENHAGEN_TIMEZONE = "Europe/Copenhagen";
    
    // Questionnaire type string constants
    public static final String QUESTIONNAIRE_TYPE_MORNING = "morning";
    public static final String QUESTIONNAIRE_TYPE_EVENING = "evening";
    
    // Private constructor to prevent instantiation
    private QuestionnaireConstants() {
        throw new UnsupportedOperationException("Constants class cannot be instantiated");
    }
}

