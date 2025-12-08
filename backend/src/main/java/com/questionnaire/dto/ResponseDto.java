package com.questionnaire.dto;

import com.questionnaire.model.QuestionnaireType;
import com.questionnaire.model.SleepParameters;

import java.util.Date;
import java.util.Map;

public class ResponseDto {
    private String id;
    private String userId;
    private String questionnaireId;
    private QuestionnaireType questionnaireType;
    private Map<String, Object> answers;
    private Map<String, String> questionTexts; // Map<QuestionId, QuestionText>
    private SleepParameters sleepParameters;
    private Date createdAt;

    public ResponseDto() {}

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getQuestionnaireId() {
        return questionnaireId;
    }

    public void setQuestionnaireId(String questionnaireId) {
        this.questionnaireId = questionnaireId;
    }

    public QuestionnaireType getQuestionnaireType() {
        return questionnaireType;
    }

    public void setQuestionnaireType(QuestionnaireType questionnaireType) {
        this.questionnaireType = questionnaireType;
    }

    public Map<String, Object> getAnswers() {
        return answers;
    }

    public void setAnswers(Map<String, Object> answers) {
        this.answers = answers;
    }

    public Map<String, String> getQuestionTexts() {
        return questionTexts;
    }

    public void setQuestionTexts(Map<String, String> questionTexts) {
        this.questionTexts = questionTexts;
    }

    public SleepParameters getSleepParameters() {
        return sleepParameters;
    }

    public void setSleepParameters(SleepParameters sleepParameters) {
        this.sleepParameters = sleepParameters;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }
}









