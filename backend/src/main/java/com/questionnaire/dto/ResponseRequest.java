package com.questionnaire.dto;

import java.util.Map;

public class ResponseRequest {
    private String questionnaireId;
    private Map<String, Object> answers;

    public ResponseRequest() {}

    public String getQuestionnaireId() {
        return questionnaireId;
    }

    public void setQuestionnaireId(String questionnaireId) {
        this.questionnaireId = questionnaireId;
    }

    public Map<String, Object> getAnswers() {
        return answers;
    }

    public void setAnswers(Map<String, Object> answers) {
        this.answers = answers;
    }
}










