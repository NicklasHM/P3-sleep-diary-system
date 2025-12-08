package com.questionnaire.model;

public class QuestionOption {
    private String id;
    private String text; // For bagudkompatibilitet - brug textDa/textEn i stedet
    private String textDa; // Dansk tekst
    private String textEn; // Engelsk tekst
    private Boolean isOther; // Flag for "Andet" option
    private String colorCode; // Farvekode for denne option: "green", "yellow", "red", eller null

    public QuestionOption() {}

    public QuestionOption(String id, String text) {
        this.id = id;
        this.text = text;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public String getTextDa() {
        return textDa;
    }

    public void setTextDa(String textDa) {
        this.textDa = textDa;
    }

    public String getTextEn() {
        return textEn;
    }

    public void setTextEn(String textEn) {
        this.textEn = textEn;
    }

    // Hjælpemetode til at hente tekst baseret på sprog
    public String getText(String language) {
        if ("en".equals(language) && textEn != null && !textEn.isEmpty()) {
            return textEn;
        }
        if ("da".equals(language) && textDa != null && !textDa.isEmpty()) {
            return textDa;
        }
        // Fallback til text hvis textDa/textEn ikke er sat (bagudkompatibilitet)
        return text != null ? text : (textDa != null ? textDa : textEn);
    }

    public Boolean getIsOther() {
        return isOther;
    }

    public void setIsOther(Boolean isOther) {
        this.isOther = isOther;
    }

    public String getColorCode() {
        return colorCode;
    }

    public void setColorCode(String colorCode) {
        this.colorCode = colorCode;
    }
}




