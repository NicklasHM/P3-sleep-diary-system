package com.questionnaire.model;

public class ConditionalChild {
    private String optionId;
    private String childQuestionId;

    public ConditionalChild() {}

    public ConditionalChild(String optionId, String childQuestionId) {
        this.optionId = optionId;
        this.childQuestionId = childQuestionId;
    }

    public String getOptionId() {
        return optionId;
    }

    public void setOptionId(String optionId) {
        this.optionId = optionId;
    }

    public String getChildQuestionId() {
        return childQuestionId;
    }

    public void setChildQuestionId(String childQuestionId) {
        this.childQuestionId = childQuestionId;
    }
}










