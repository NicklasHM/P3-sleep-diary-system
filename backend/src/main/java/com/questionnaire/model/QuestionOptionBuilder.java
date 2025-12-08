package com.questionnaire.model;

/**
 * Builder pattern for QuestionOption klasse
 * Giver fluent interface til at oprette og kopiere QuestionOption objekter
 */
public class QuestionOptionBuilder {
    private QuestionOption option;
    
    public QuestionOptionBuilder() {
        this.option = new QuestionOption();
    }
    
    /**
     * Starter builder fra en eksisterende QuestionOption (kopierer alle felter)
     */
    public static QuestionOptionBuilder from(QuestionOption source) {
        QuestionOptionBuilder builder = new QuestionOptionBuilder();
        builder.option = new QuestionOption();
        builder.option.setId(source.getId());
        builder.option.setText(source.getText());
        builder.option.setTextDa(source.getTextDa());
        builder.option.setTextEn(source.getTextEn());
        builder.option.setIsOther(source.getIsOther());
        builder.option.setColorCode(source.getColorCode());
        return builder;
    }
    
    /**
     * Oversætter tekstfelter baseret på sprog
     * Sætter text feltet til den oversatte tekst
     */
    public QuestionOptionBuilder withLanguage(String language) {
        if (language != null && option != null) {
            String translatedText = option.getText(language);
            option.setText(translatedText);
        }
        return this;
    }
    
    // Fluent interface metoder for alle felter
    public QuestionOptionBuilder id(String id) {
        option.setId(id);
        return this;
    }
    
    public QuestionOptionBuilder text(String text) {
        option.setText(text);
        return this;
    }
    
    public QuestionOptionBuilder textDa(String textDa) {
        option.setTextDa(textDa);
        return this;
    }
    
    public QuestionOptionBuilder textEn(String textEn) {
        option.setTextEn(textEn);
        return this;
    }
    
    public QuestionOptionBuilder isOther(Boolean isOther) {
        option.setIsOther(isOther);
        return this;
    }
    
    public QuestionOptionBuilder colorCode(String colorCode) {
        option.setColorCode(colorCode);
        return this;
    }
    
    /**
     * Bygger QuestionOption objektet
     */
    public QuestionOption build() {
        return option;
    }
}




