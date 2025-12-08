package com.questionnaire.service;

import com.questionnaire.constants.QuestionnaireConstants;
import com.questionnaire.model.Question;
import com.questionnaire.model.SleepData;
import com.questionnaire.model.SleepParameters;
import com.questionnaire.repository.QuestionRepository;
import com.questionnaire.service.interfaces.ISleepParameterCalculator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Service
public class SleepParameterCalculator implements ISleepParameterCalculator {

    private static final Logger logger = LoggerFactory.getLogger(SleepParameterCalculator.class);
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern(QuestionnaireConstants.TIME_FORMAT);

    @Autowired
    private QuestionRepository questionRepository;
    
    @Autowired
    private SleepDataExtractor sleepDataExtractor;

    public SleepParameters calculate(Map<String, Object> answers, String questionnaireId) {
        // Hent alle spørgsmål for questionnaire sorteret efter order
        List<Question> questions = questionRepository.findByQuestionnaireIdOrderByOrderAsc(questionnaireId);
        
        logger.debug("Beregner søvnparametre for questionnaireId: {}", questionnaireId);
        logger.debug("Antal spørgsmål: {}, Antal svar: {}", questions.size(), answers.size());
        
        // Udtræk søvndata fra answers
        SleepData sleepData = extractSleepData(questions, answers);
        
        // Tjek om alle nødvendige værdier er fundet
        if (!sleepData.isValid()) {
            logger.error("Manglende tider! Gik i seng: {}, Stod op: {}", 
                    sleepData.getWentToBedTime(), sleepData.getGotUpTime());
            logger.debug("Alle question IDs i answers: {}", answers.keySet());
            return new SleepParameters(0, 0, 0, 0);
        }

        // Beregn søvnparametre
        double TIB = calculateTIB(sleepData);
        double SOL = calculateSOL(sleepData);
        double TST = calculateTST(sleepData, TIB, SOL);

        return new SleepParameters(SOL, sleepData.getWASO(), TIB, TST);
    }
    
    /**
     * Udtrækker søvndata fra answers map ved hjælp af SleepDataExtractor
     */
    private SleepData extractSleepData(List<Question> questions, Map<String, Object> answers) {
        return sleepDataExtractor.extract(questions, answers);
    }
    
    /**
     * Beregner TIB (Time in Bed) - tid fra gik i seng til stod op
     */
    private double calculateTIB(SleepData data) {
        double TIB = calculateTimeDifference(data.getWentToBedTime(), data.getGotUpTime());
        logger.debug("Beregnet TIB: {} minutter", TIB);
        return ensureNonNegative(TIB, "TIB");
    }
    
    /**
     * Beregner SOL (Sleep Onset Latency) - tid fra gik i seng til faldt i søvn
     */
    private double calculateSOL(SleepData data) {
        double SOL = 0.0;
        if (data.getLightOffTime() != null && data.getFellAsleepAfter() != null) {
            // Beregn tidspunkt for faldt i søvn = slukkede lyset + faldt i søvn efter
            String fellAsleepTime = addMinutesToTime(data.getLightOffTime(), calculateMinutes(data.getFellAsleepAfter()));
            logger.debug("Faldt i søvn klokken: {}", fellAsleepTime);
            
            // SOL = tid fra gik i seng til faldt i søvn
            SOL = calculateTimeDifference(data.getWentToBedTime(), fellAsleepTime);
            logger.debug("Beregnet SOL: {} minutter", SOL);
        } else {
            // Fallback: hvis vi ikke har slukkede lyset, brug kun "faldt i søvn efter"
            SOL = calculateMinutes(data.getFellAsleepAfter());
            logger.debug("Beregnet SOL (fallback): {} minutter", SOL);
        }
        return ensureNonNegative(SOL, "SOL");
    }
    
    /**
     * Beregner TST (Total Sleep Time) - tid fra faldt i søvn til vågnede
     */
    private double calculateTST(SleepData data, double TIB, double SOL) {
        double TST = 0.0;
        if (data.getLightOffTime() != null && data.getFellAsleepAfter() != null && data.getWokeUpTime() != null) {
            // Beregn tidspunkt for faldt i søvn = slukkede lyset + faldt i søvn efter
            String fellAsleepTime = addMinutesToTime(data.getLightOffTime(), calculateMinutes(data.getFellAsleepAfter()));
            
            // TST = tid fra faldt i søvn til vågnede
            TST = calculateTimeDifference(fellAsleepTime, data.getWokeUpTime());
            logger.debug("Beregnet TST: {} minutter (fra {} til {})", TST, fellAsleepTime, data.getWokeUpTime());
        } else {
            // Fallback: hvis vi mangler nødvendige data, brug formlen TIB - SOL - WASO
            TST = TIB - SOL - data.getWASO();
            logger.debug("Beregnet TST (fallback): {} minutter (TIB - SOL - WASO)", TST);
        }
        return ensureNonNegative(TST, "TST");
    }
    
    /**
     * Sikrer at en værdi ikke er negativ, sætter den til 0 hvis den er
     */
    private double ensureNonNegative(double value, String parameterName) {
        if (value < 0) {
            logger.warn("{} var negativ, sætter til 0", parameterName);
            return 0;
        }
        return value;
    }

    private double calculateMinutes(String timeString) {
        if (timeString == null || timeString.isEmpty()) {
            return 0.0;
        }
        
        // Håndterer format som "00:05" eller "5" (minutter)
        try {
            if (timeString.contains(":")) {
                LocalTime time = LocalTime.parse(timeString, TIME_FORMATTER);
                return time.getHour() * 60.0 + time.getMinute();
            } else {
                return Double.parseDouble(timeString);
            }
        } catch (Exception e) {
            return 0.0;
        }
    }

    private double calculateTimeDifference(String startTime, String endTime) {
        if (startTime == null || endTime == null) {
            return 0.0;
        }

        try {
            LocalTime start = LocalTime.parse(startTime, TIME_FORMATTER);
            LocalTime end = LocalTime.parse(endTime, TIME_FORMATTER);

            // Beregn TIB (Time in Bed) - tid fra gik i seng til stod op
            // Hvis endTime er før eller lig med startTime, er det næste dag
            if (end.isBefore(start) || end.equals(start)) {
                // Beregn fra start til midnat (24:00)
                // Minutter fra start til midnat = (24 * 60) - (start i minutter)
                int startMinutes = start.getHour() * 60 + start.getMinute();
                int minutesToMidnight = (24 * 60) - startMinutes;
                
                // Beregn fra midnat (00:00) til end
                int endMinutes = end.getHour() * 60 + end.getMinute();
                
                // Total = tid til midnat + tid fra midnat
                return (double) (minutesToMidnight + endMinutes);
            } else {
                // Samme dag - beregn direkte forskel
                long minutes = java.time.Duration.between(start, end).toMinutes();
                return (double) minutes;
            }
        } catch (Exception e) {
            return 0.0;
        }
    }

    /**
     * Tilføjer minutter til en tid og returnerer den nye tid som streng
     * Håndterer overgang over midnat
     */
    private String addMinutesToTime(String timeString, double minutesToAdd) {
        if (timeString == null || timeString.isEmpty()) {
            return null;
        }

        try {
            LocalTime time = LocalTime.parse(timeString, TIME_FORMATTER);
            LocalTime newTime = time.plusMinutes((long) minutesToAdd);
            return newTime.format(TIME_FORMATTER);
        } catch (Exception e) {
            logger.error("Fejl ved at tilføje minutter til tid: {} + {}", timeString, minutesToAdd, e);
            return timeString;
        }
    }
}


