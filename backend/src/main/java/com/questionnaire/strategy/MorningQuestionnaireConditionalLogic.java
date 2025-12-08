package com.questionnaire.strategy;

import com.questionnaire.constants.QuestionnaireConstants;
import com.questionnaire.model.Question;
import com.questionnaire.model.QuestionType;
import com.questionnaire.service.QuestionFinder;
import com.questionnaire.utils.AnswerParser;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/**
 * Conditional logic strategi for morgenskema
 * Håndterer betingelser for opvågningsspørgsmål (order 6-8)
 */
@Component
public class MorningQuestionnaireConditionalLogic implements ConditionalLogicStrategy {
    
    private static final Logger logger = LoggerFactory.getLogger(MorningQuestionnaireConditionalLogic.class);
    
    private final QuestionFinder questionFinder;
    
    @Autowired
    public MorningQuestionnaireConditionalLogic(QuestionFinder questionFinder) {
        this.questionFinder = questionFinder;
    }
    
    @Override
    public Question shouldShow(Question question, Map<String, Object> answers, List<Question> allQuestions, String currentQuestionId) {
        // Hvis spørgsmål 6 er "Nej", skal conditional børn (order 7/8) ikke vises
        if ((question.getOrder() == QuestionnaireConstants.ORDER_7 || question.getOrder() == QuestionnaireConstants.ORDER_8) 
                && question.getType() == QuestionType.numeric) {
            Question question6 = questionFinder.findByOrderAndType(allQuestions, QuestionnaireConstants.ORDER_6, QuestionType.multiple_choice);
            
            if (question6 != null) {
                Object answer6 = answers.get(question6.getId());
                if (answer6 != null) {
                    String optionId = AnswerParser.extractOptionId(answer6);
                    
                    // Hvis spørgsmål 6 er "Nej", spring spørgsmål 7 og 8 over
                    if ("wake_no".equals(optionId)) {
                        logger.debug("Skipping question {} because question 6 is 'No'", question.getOrder());
                        return null;
                    }
                } else {
                    // Hvis spørgsmål 6 ikke er besvaret endnu, spring conditional children over
                    logger.debug("Skipping question {} because question 6 is not answered yet", question.getOrder());
                    return null;
                }
            }
        }
        
        // Returner spørgsmålet hvis det skal vises
        return question;
    }
}

