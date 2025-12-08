package com.questionnaire.model;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

/**
 * Builder pattern for Question klasse
 * Giver fluent interface til at oprette og kopiere Question objekter
 */
public class QuestionBuilder {
    private Question question;
    
    public QuestionBuilder() {
        this.question = new Question();
    }
    
    /**
     * Starter builder fra en eksisterende Question (kopierer alle felter)
     */
    public static QuestionBuilder from(Question source) {
        QuestionBuilder builder = new QuestionBuilder();
        builder.question = new Question();
        
        // Kopier BaseEntity felter
        builder.question.setId(source.getId());
        builder.question.setCreatedAt(source.getCreatedAt());
        builder.question.setUpdatedAt(source.getUpdatedAt());
        
        // Kopier Question felter
        builder.question.setQuestionnaireId(source.getQuestionnaireId());
        builder.question.setText(source.getText());
        builder.question.setTextDa(source.getTextDa());
        builder.question.setTextEn(source.getTextEn());
        builder.question.setType(source.getType());
        builder.question.setLocked(source.isLocked());
        builder.question.setOrder(source.getOrder());
        builder.question.setOptions(source.getOptions() != null ? new ArrayList<>(source.getOptions()) : null);
        builder.question.setConditionalChildren(source.getConditionalChildren() != null ? 
                new ArrayList<>(source.getConditionalChildren()) : null);
        builder.question.setMinValue(source.getMinValue());
        builder.question.setMaxValue(source.getMaxValue());
        builder.question.setMinTime(source.getMinTime());
        builder.question.setMaxTime(source.getMaxTime());
        builder.question.setHasColorCode(source.getHasColorCode());
        builder.question.setColorCodeGreenMax(source.getColorCodeGreenMax());
        builder.question.setColorCodeGreenMin(source.getColorCodeGreenMin());
        builder.question.setColorCodeYellowMin(source.getColorCodeYellowMin());
        builder.question.setColorCodeYellowMax(source.getColorCodeYellowMax());
        builder.question.setColorCodeRedMin(source.getColorCodeRedMin());
        builder.question.setColorCodeRedMax(source.getColorCodeRedMax());
        builder.question.setDeletedAt(source.getDeletedAt());
        
        return builder;
    }
    
    /**
     * Oversætter tekstfelter baseret på sprog
     * Sætter text feltet til den oversatte tekst
     */
    public QuestionBuilder withLanguage(String language) {
        if (language != null && question != null) {
            String translatedText = question.getText(language);
            question.setText(translatedText);
        }
        return this;
    }
    
    // Fluent interface metoder for alle felter
    public QuestionBuilder id(String id) {
        question.setId(id);
        return this;
    }
    
    public QuestionBuilder questionnaireId(String questionnaireId) {
        question.setQuestionnaireId(questionnaireId);
        return this;
    }
    
    public QuestionBuilder text(String text) {
        question.setText(text);
        return this;
    }
    
    public QuestionBuilder textDa(String textDa) {
        question.setTextDa(textDa);
        return this;
    }
    
    public QuestionBuilder textEn(String textEn) {
        question.setTextEn(textEn);
        return this;
    }
    
    public QuestionBuilder type(QuestionType type) {
        question.setType(type);
        return this;
    }
    
    public QuestionBuilder locked(boolean isLocked) {
        question.setLocked(isLocked);
        return this;
    }
    
    public QuestionBuilder order(int order) {
        question.setOrder(order);
        return this;
    }
    
    public QuestionBuilder options(List<QuestionOption> options) {
        question.setOptions(options);
        return this;
    }
    
    public QuestionBuilder conditionalChildren(List<ConditionalChild> conditionalChildren) {
        question.setConditionalChildren(conditionalChildren);
        return this;
    }
    
    public QuestionBuilder minValue(Integer minValue) {
        question.setMinValue(minValue);
        return this;
    }
    
    public QuestionBuilder maxValue(Integer maxValue) {
        question.setMaxValue(maxValue);
        return this;
    }
    
    public QuestionBuilder minTime(String minTime) {
        question.setMinTime(minTime);
        return this;
    }
    
    public QuestionBuilder maxTime(String maxTime) {
        question.setMaxTime(maxTime);
        return this;
    }
    
    public QuestionBuilder hasColorCode(Boolean hasColorCode) {
        question.setHasColorCode(hasColorCode);
        return this;
    }
    
    public QuestionBuilder colorCodeGreenMax(Integer colorCodeGreenMax) {
        question.setColorCodeGreenMax(colorCodeGreenMax);
        return this;
    }
    
    public QuestionBuilder colorCodeGreenMin(Integer colorCodeGreenMin) {
        question.setColorCodeGreenMin(colorCodeGreenMin);
        return this;
    }
    
    public QuestionBuilder colorCodeYellowMin(Integer colorCodeYellowMin) {
        question.setColorCodeYellowMin(colorCodeYellowMin);
        return this;
    }
    
    public QuestionBuilder colorCodeYellowMax(Integer colorCodeYellowMax) {
        question.setColorCodeYellowMax(colorCodeYellowMax);
        return this;
    }
    
    public QuestionBuilder colorCodeRedMin(Integer colorCodeRedMin) {
        question.setColorCodeRedMin(colorCodeRedMin);
        return this;
    }
    
    public QuestionBuilder colorCodeRedMax(Integer colorCodeRedMax) {
        question.setColorCodeRedMax(colorCodeRedMax);
        return this;
    }
    
    public QuestionBuilder deletedAt(Date deletedAt) {
        question.setDeletedAt(deletedAt);
        return this;
    }
    
    /**
     * Bygger Question objektet
     */
    public Question build() {
        return question;
    }
}


