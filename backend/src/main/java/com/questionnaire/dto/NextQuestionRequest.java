package com.questionnaire.dto;

import java.util.Map;

public class NextQuestionRequest {
    private String questionnaireId;
    private String currentQuestionId;
    private Map<String, Object> currentAnswers;

    public NextQuestionRequest() {}

    public String getQuestionnaireId() {
        return questionnaireId;
    }

    public void setQuestionnaireId(String questionnaireId) {
        this.questionnaireId = questionnaireId;
    }

    public String getCurrentQuestionId() {
        return currentQuestionId;
    }

    public void setCurrentQuestionId(String currentQuestionId) {
        this.currentQuestionId = currentQuestionId;
    }

    public Map<String, Object> getCurrentAnswers() {
        return currentAnswers;
    }

    public void setCurrentAnswers(Map<String, Object> currentAnswers) {
        this.currentAnswers = currentAnswers;
    }
}










