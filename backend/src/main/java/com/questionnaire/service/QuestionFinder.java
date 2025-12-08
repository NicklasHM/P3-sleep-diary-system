package com.questionnaire.service;

import com.questionnaire.model.Question;
import com.questionnaire.model.QuestionType;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Service for finding questions in a list
 * Eliminates code duplication in search logic
 */
@Service
public class QuestionFinder {
    
    /**
     * Finder et spørgsmål baseret på order og type
     * @param questions Liste af spørgsmål
     * @param order Rækkefølgen af spørgsmålet
     * @param type Typen af spørgsmålet
     * @return Spørgsmålet hvis fundet, null ellers
     */
    public Question findByOrderAndType(List<Question> questions, int order, QuestionType type) {
        for (Question q : questions) {
            if (q.getOrder() == order && q.getType() == type) {
                return q;
            }
        }
        return null;
    }
    
    /**
     * Finder et spørgsmål baseret på order
     * @param questions Liste af spørgsmål
     * @param order Rækkefølgen af spørgsmålet
     * @return Spørgsmålet hvis fundet, null ellers
     */
    public Question findByOrder(List<Question> questions, int order) {
        for (Question q : questions) {
            if (q.getOrder() == order) {
                return q;
            }
        }
        return null;
    }
}




