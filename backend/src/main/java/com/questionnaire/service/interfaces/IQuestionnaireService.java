package com.questionnaire.service.interfaces;

import com.questionnaire.model.Question;
import com.questionnaire.model.Questionnaire;
import com.questionnaire.model.QuestionnaireType;

import java.util.List;
import java.util.Optional;

public interface IQuestionnaireService {
    Questionnaire getQuestionnaireByType(QuestionnaireType type);
    List<Question> getQuestionsByQuestionnaireId(String questionnaireId);
    List<Question> getQuestionsByQuestionnaireId(String questionnaireId, String language);
    Questionnaire createQuestionnaire(QuestionnaireType type, String name);
    Optional<Questionnaire> findByType(QuestionnaireType type);
    Optional<Questionnaire> findById(String id);
}




