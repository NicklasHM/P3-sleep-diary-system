package com.questionnaire.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "questionnaires")
public class Questionnaire extends BaseEntity {
    @Id
    private String id;
    
    private QuestionnaireType type;
    
    private String name;

    public Questionnaire() {
        super();
    }

    public Questionnaire(QuestionnaireType type, String name) {
        super();
        this.type = type;
        this.name = name;
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public QuestionnaireType getType() {
        return type;
    }

    public void setType(QuestionnaireType type) {
        this.type = type;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}







