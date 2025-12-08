package com.questionnaire.service.interfaces;

import com.questionnaire.model.Question;

import java.util.List;

public interface IQuestionService {
    Question createQuestion(Question question);
    Question updateQuestion(String id, Question questionDetails);
    void deleteQuestion(String id);
    Question findById(String id);
    Question findById(String id, String language);
    Question findByIdIncludingDeleted(String id);
    Question findByIdIncludingDeleted(String id, String language);
    List<Question> findByQuestionnaireId(String questionnaireId);
    List<Question> findByQuestionnaireId(String questionnaireId, String language);
    List<Question> findByQuestionnaireIdIncludingDeleted(String questionnaireId);
    List<Question> findByQuestionnaireIdIncludingDeleted(String questionnaireId, String language);
    Question translateQuestion(Question question, String language);
    Question addConditionalChild(String questionId, String optionId, String childQuestionId);
    Question removeConditionalChild(String questionId, String optionId, String childQuestionId);
    Question updateConditionalChildrenOrder(String questionId, String optionId, List<String> childQuestionIds);
    /**
     * Finder alle root spørgsmål (ikke conditional children) for et questionnaire
     * @param questions Alle spørgsmål i questionnaire
     * @return Liste af root spørgsmål sorteret efter order
     */
    List<Question> findRootQuestions(List<Question> questions);
}


