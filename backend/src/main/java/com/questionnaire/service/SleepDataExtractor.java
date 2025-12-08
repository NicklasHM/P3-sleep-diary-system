package com.questionnaire.service;

import com.questionnaire.constants.QuestionnaireConstants;
import com.questionnaire.model.Question;
import com.questionnaire.model.SleepData;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.BiConsumer;

/**
 * Extractor klasse til at udtrække søvndata fra answers map
 * Bruger Map pattern i stedet for if-else kæde for bedre OOP
 */
@Component
public class SleepDataExtractor {
    
    private static final Logger logger = LoggerFactory.getLogger(SleepDataExtractor.class);
    
    private final Map<Integer, BiConsumer<SleepData, Object>> orderHandlers;
    
    public SleepDataExtractor() {
        this.orderHandlers = new HashMap<>();
        initializeHandlers();
    }
    
    private void initializeHandlers() {
        // Order 3: Gik i seng klokken
        orderHandlers.put(QuestionnaireConstants.ORDER_3, (data, answer) -> {
            String time = answer.toString().trim();
            data.setWentToBedTime(time);
            logger.debug("Gik i seng klokken: {}", time);
        });
        
        // Order 4: Slukkede lyset klokken
        orderHandlers.put(QuestionnaireConstants.ORDER_4, (data, answer) -> {
            String time = answer.toString().trim();
            data.setLightOffTime(time);
            logger.debug("Slukkede lyset klokken: {}", time);
        });
        
        // Order 5: Faldt i søvn efter (minutter)
        orderHandlers.put(QuestionnaireConstants.ORDER_5, (data, answer) -> {
            String time = answer.toString().trim();
            data.setFellAsleepAfter(time);
            logger.debug("Faldt i søvn efter: {}", time);
        });
        
        // Order 8: Vågen i minutter (WASO)
        orderHandlers.put(QuestionnaireConstants.ORDER_8, (data, answer) -> {
            try {
                double waso = Double.parseDouble(answer.toString());
                data.setWASO(waso);
                logger.debug("WASO: {}", waso);
            } catch (NumberFormatException e) {
                data.setWASO(0.0);
                logger.warn("Kunne ikke parse WASO: {}", answer);
            }
        });
        
        // Order 9: Vågnede klokken
        orderHandlers.put(QuestionnaireConstants.ORDER_9, (data, answer) -> {
            String time = answer.toString().trim();
            data.setWokeUpTime(time);
            logger.debug("Vågnede klokken: {}", time);
        });
        
        // Order 10: Stod op klokken
        orderHandlers.put(QuestionnaireConstants.ORDER_10, (data, answer) -> {
            String time = answer.toString().trim();
            data.setGotUpTime(time);
            logger.debug("Stod op klokken: {}", time);
        });
    }
    
    /**
     * Udtrækker søvndata fra answers map baseret på spørgsmålernes order
     * @param questions Liste af spørgsmål sorteret efter order
     * @param answers Map af question ID til answer værdi
     * @return SleepData objekt med udtrukket data
     */
    public SleepData extract(List<Question> questions, Map<String, Object> answers) {
        SleepData data = new SleepData();
        
        for (Question question : questions) {
            Object answer = answers.get(question.getId());
            if (answer == null) {
                logger.debug("Ingen svar for spørgsmål order {} (id: {})", question.getOrder(), question.getId());
                continue;
            }
            
            logger.debug("Spørgsmål order {} (id: {}) har svar: {}", question.getOrder(), question.getId(), answer);
            
            BiConsumer<SleepData, Object> handler = orderHandlers.get(question.getOrder());
            if (handler != null) {
                handler.accept(data, answer);
            }
        }
        
        logger.debug("Samlet - Gik i seng: {}, Slukkede lyset: {}, Vågnede: {}, Stod op: {}", 
                data.getWentToBedTime(), data.getLightOffTime(), data.getWokeUpTime(), data.getGotUpTime());
        
        return data;
    }
}


