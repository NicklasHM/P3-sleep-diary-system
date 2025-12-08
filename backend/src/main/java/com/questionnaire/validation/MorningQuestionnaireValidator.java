package com.questionnaire.validation;

import com.questionnaire.constants.QuestionnaireConstants;
import com.questionnaire.exception.ValidationException;
import com.questionnaire.model.Question;
import com.questionnaire.model.QuestionType;
import com.questionnaire.service.QuestionFinder;
import com.questionnaire.service.interfaces.IQuestionnaireService;
import com.questionnaire.utils.AnswerParser;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

/**
 * Validator for morning questionnaire
 * Contains all morning-specific validation rules
 */
@Component
public class MorningQuestionnaireValidator extends QuestionnaireValidator {
    
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern(QuestionnaireConstants.TIME_FORMAT);
    
    @Autowired
    public MorningQuestionnaireValidator(ValidatorFactory validatorFactory,
                                       IQuestionnaireService questionnaireService,
                                       QuestionFinder questionFinder) {
        super(validatorFactory, questionnaireService, questionFinder);
    }
    
    @Override
    protected void validateSpecificRules(List<Question> questions, Map<String, Object> answers, String questionnaireId) {
        // Auto-fill logik: Hvis spørgsmål 6 er "Nej", sæt spørgsmål 8 automatisk til 0 hvis det mangler
        autoFillQuestion8(questions, answers);
        
        // Valider at spørgsmål 4 ikke er før spørgsmål 3
        validateLightOffTime(questions, answers);
        
        // Valider at spørgsmål 10 ikke er før spørgsmål 9
        validateWakeTimes(questions, answers);
        
        // Valider spørgsmål 6-8: hvis spørgsmål 6 er "Ja", skal både spørgsmål 7 og 8 være besvaret
        validateQuestion6(questions, answers);
        
        // Valider at "faldt i søvn" ikke er før "gik i seng"
        validateSleepTimes(questions, answers);
    }
    
    /**
     * Auto-fill logik: Hvis spørgsmål 6 er "Nej", sæt spørgsmål 8 automatisk til 0 hvis det mangler
     */
    private void autoFillQuestion8(List<Question> questions, Map<String, Object> answers) {
        Question question6 = questionFinder.findByOrderAndType(questions, QuestionnaireConstants.ORDER_6, QuestionType.multiple_choice);
        Question question8 = questionFinder.findByOrderAndType(questions, QuestionnaireConstants.ORDER_8, QuestionType.numeric);
        
        if (question6 != null && question8 != null) {
            Object answer6 = answers.get(question6.getId());
            if (answer6 != null) {
                String optionId = AnswerParser.extractOptionId(answer6);
                
                // Hvis spørgsmål 6 er "Nej" og spørgsmål 8 mangler, sæt det til 0
                if ("wake_no".equals(optionId) && !answers.containsKey(question8.getId())) {
                    answers.put(question8.getId(), 0);
                }
            }
        }
    }
    
    /**
     * Validerer at "slukkede lyset" (spørgsmål 4) ikke er før "gik i seng" (spørgsmål 3)
     */
    private void validateLightOffTime(List<Question> questions, Map<String, Object> answers) {
        Question wentToBedQuestion = questionFinder.findByOrderAndType(questions, QuestionnaireConstants.ORDER_3, QuestionType.time_picker);
        Question lightOffQuestion = questionFinder.findByOrderAndType(questions, QuestionnaireConstants.ORDER_4, QuestionType.time_picker);
        
        if (wentToBedQuestion != null && lightOffQuestion != null) {
            Object wentToBedAnswer = answers.get(wentToBedQuestion.getId());
            Object lightOffAnswer = answers.get(lightOffQuestion.getId());
            
            if (wentToBedAnswer != null && lightOffAnswer != null) {
                try {
                    LocalTime bedTime = AnswerParser.parseTime(wentToBedAnswer, TIME_FORMATTER);
                    LocalTime lightOff = AnswerParser.parseTime(lightOffAnswer, TIME_FORMATTER);
                    
                    if (lightOff.isBefore(bedTime)) {
                        throw new ValidationException(
                            String.format("Du kan ikke have slukket lyset (%s) før du gik i seng (%s). " +
                                "Tjek venligst dine svar.", lightOffAnswer.toString().trim(), wentToBedAnswer.toString().trim())
                        );
                    }
                } catch (Exception e) {
                    if (e instanceof RuntimeException) {
                        throw e;
                    }
                }
            }
        }
    }
    
    /**
     * Validerer at "stod op" ikke er før "vågnede"
     */
    private void validateWakeTimes(List<Question> questions, Map<String, Object> answers) {
        Question wokeUpQuestion = questionFinder.findByOrderAndType(questions, QuestionnaireConstants.ORDER_9, QuestionType.time_picker);
        Question gotOutOfBedQuestion = questionFinder.findByOrderAndType(questions, QuestionnaireConstants.ORDER_10, QuestionType.time_picker);
        
        if (wokeUpQuestion != null && gotOutOfBedQuestion != null) {
            Object wokeUpAnswer = answers.get(wokeUpQuestion.getId());
            Object gotOutOfBedAnswer = answers.get(gotOutOfBedQuestion.getId());
            
            if (wokeUpAnswer != null && gotOutOfBedAnswer != null) {
                try {
                    LocalTime wakeTime = AnswerParser.parseTime(wokeUpAnswer, TIME_FORMATTER);
                    LocalTime outOfBedTime = AnswerParser.parseTime(gotOutOfBedAnswer, TIME_FORMATTER);
                    
                    if (outOfBedTime.isBefore(wakeTime)) {
                        throw new ValidationException(
                            String.format("Du kan ikke være stået op (%s) før du vågnede (%s). " +
                                "Tjek venligst dine svar.", gotOutOfBedAnswer.toString().trim(), wokeUpAnswer.toString().trim())
                        );
                    }
                } catch (Exception e) {
                    if (e instanceof RuntimeException) {
                        throw e;
                    }
                }
            }
        }
    }
    
    /**
     * Validerer spørgsmål 6-8: hvis spørgsmål 6 er "Ja", skal både spørgsmål 7 og 8 være besvaret
     */
    private void validateQuestion6(List<Question> questions, Map<String, Object> answers) {
        Question question6 = questionFinder.findByOrderAndType(questions, QuestionnaireConstants.ORDER_6, QuestionType.multiple_choice);
        Question question7 = questionFinder.findByOrderAndType(questions, QuestionnaireConstants.ORDER_7, QuestionType.numeric);
        Question question8 = questionFinder.findByOrderAndType(questions, QuestionnaireConstants.ORDER_8, QuestionType.numeric);
        
        if (question6 != null && question7 != null && question8 != null) {
            Object answer6 = answers.get(question6.getId());
            
            if (answer6 != null) {
                String optionId = AnswerParser.extractOptionId(answer6);
                
                if ("wake_yes".equals(optionId)) {
                    // Hvis spørgsmål 6 er "Ja", skal både spørgsmål 7 og 8 være besvaret
                    Object answer7 = answers.get(question7.getId());
                    Object answer8 = answers.get(question8.getId());
                    
                    if (answer7 == null || answer8 == null) {
                        throw new ValidationException(
                            "Hvis du vågnede i løbet af natten, skal du angive både hvor mange gange og hvor mange minutter du var vågen."
                        );
                    }
                    
                    try {
                        int value7 = AnswerParser.parseInt(answer7);
                        int value8 = AnswerParser.parseInt(answer8);
                        
                        if (value7 >= 1 && value8 == 0) {
                            throw new ValidationException(
                                String.format("Hvis du vågnede %d gange i løbet af natten, skal du også angive hvor længe du var vågen. " +
                                    "Værdien kan ikke være 0.", value7)
                            );
                        }
                    } catch (NumberFormatException e) {
                        // Hvis parsing fejler, fortsæt normalt
                    }
                } else if ("wake_no".equals(optionId)) {
                    // Hvis spørgsmål 6 er "Nej", skal spørgsmål 8 være 0
                    Object answer8 = answers.get(question8.getId());
                    if (answer8 != null) {
                        try {
                            int value8 = AnswerParser.parseInt(answer8);
                            if (value8 != 0) {
                                throw new ValidationException(
                                    String.format("Hvis du ikke vågnede i løbet af natten, kan du ikke have været vågen i flere minutter. " +
                                        "Værdien skal være 0. Du indtastede: %d", value8)
                                );
                            }
                        } catch (NumberFormatException e) {
                            // Hvis parsing fejler, fortsæt normalt
                        }
                    }
                }
            }
        }
    }
    
    /**
     * Validerer at "faldt i søvn" ikke er før "gik i seng"
     */
    private void validateSleepTimes(List<Question> questions, Map<String, Object> answers) {
        Question wentToBedQuestion = questionFinder.findByOrderAndType(questions, QuestionnaireConstants.ORDER_3, QuestionType.time_picker);
        Question fellAsleepQuestion = questionFinder.findByOrder(questions, QuestionnaireConstants.ORDER_5);
        
        if (wentToBedQuestion != null && fellAsleepQuestion != null) {
            Object wentToBedAnswer = answers.get(wentToBedQuestion.getId());
            Object fellAsleepAnswer = answers.get(fellAsleepQuestion.getId());
            
            if (wentToBedAnswer != null && fellAsleepAnswer != null) {
                try {
                    LocalTime bedTime = AnswerParser.parseTime(wentToBedAnswer, TIME_FORMATTER);
                    String fellAsleepStr = fellAsleepAnswer.toString().trim();
                    
                    if (fellAsleepQuestion.getType() == QuestionType.time_picker && fellAsleepStr.contains(":")) {
                        LocalTime sleepTime = AnswerParser.parseTime(fellAsleepAnswer, TIME_FORMATTER);
                        if (sleepTime.isBefore(bedTime)) {
                            throw new ValidationException(
                                String.format("Du kan ikke være faldet i søvn (%s) før du gik i seng (%s). " +
                                    "Tjek venligst dine svar.", fellAsleepStr, wentToBedAnswer.toString().trim())
                            );
                        }
                    } else if (fellAsleepQuestion.getType() == QuestionType.numeric) {
                        int minutes = AnswerParser.parseInt(fellAsleepAnswer);
                        
                        if (minutes < 0) {
                            throw new ValidationException(
                                String.format("Du kan ikke være faldet i søvn før du gik i seng. " +
                                    "Antal minutter skal være positivt. Du indtastede: %d", minutes)
                            );
                        }
                    }
                } catch (Exception e) {
                    if (e instanceof RuntimeException) {
                        throw e;
                    }
                }
            }
        }
    }
}


