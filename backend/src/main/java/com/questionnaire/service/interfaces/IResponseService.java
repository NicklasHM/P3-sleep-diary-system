package com.questionnaire.service.interfaces;

import com.questionnaire.model.Question;
import com.questionnaire.model.QuestionnaireType;
import com.questionnaire.model.Response;
import com.questionnaire.model.SleepParameters;

import java.util.List;
import java.util.Map;

public interface IResponseService {
    Response saveResponse(String userId, String questionnaireId, Map<String, Object> answers);
    Question getNextQuestion(String questionnaireId, Map<String, Object> currentAnswers, String currentQuestionId);
    Question getNextQuestion(String questionnaireId, Map<String, Object> currentAnswers, String currentQuestionId, String language);
    List<Response> getResponsesByUserId(String userId);
    List<Response> getResponsesByUserIdAndQuestionnaireId(String userId, String questionnaireId);
    SleepParameters calculateSleepParameters(String responseId);
    List<Response> getResponsesByUserIdAndQuestionnaireType(String userId, QuestionnaireType type);
    boolean hasResponseForToday(String userId, QuestionnaireType questionnaireType);
}




