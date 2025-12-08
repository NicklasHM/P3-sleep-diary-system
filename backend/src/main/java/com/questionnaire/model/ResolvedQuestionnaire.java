package com.questionnaire.model;

/**
 * Value object til at holde resultatet af questionnaire ID resolution
 */
public class ResolvedQuestionnaire {
    private String questionnaireId;
    private QuestionnaireType questionnaireType;

    public ResolvedQuestionnaire() {
    }

    public ResolvedQuestionnaire(String questionnaireId, QuestionnaireType questionnaireType) {
        this.questionnaireId = questionnaireId;
        this.questionnaireType = questionnaireType;
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
}




