package com.questionnaire.factory;

import com.questionnaire.model.Question;
import com.questionnaire.model.QuestionType;
import org.springframework.stereotype.Component;

/**
 * Implementation af QuestionFactory
 */
@Component
public class QuestionFactoryImpl implements QuestionFactory {
    
    @Override
    public Question createQuestion(String questionnaireId, String text, QuestionType type, boolean isLocked, int order) {
        Question question = new Question();
        question.setQuestionnaireId(questionnaireId);
        question.setText(text);
        question.setType(type);
        question.setLocked(isLocked);
        question.setOrder(order);
        
        // Valider spørgsmålet
        question.validate();
        
        return question;
    }
    
    @Override
    public Question createQuestion(String questionnaireId, String textDa, String textEn, QuestionType type, boolean isLocked, int order) {
        Question question = new Question();
        question.setQuestionnaireId(questionnaireId);
        question.setTextDa(textDa);
        question.setTextEn(textEn);
        question.setType(type);
        question.setLocked(isLocked);
        question.setOrder(order);
        
        // Valider spørgsmålet
        question.validate();
        
        return question;
    }
}




