package com.questionnaire.model;

import com.questionnaire.exception.ValidationException;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.Map;

@Document(collection = "responses")
public class Response extends BaseEntity implements Validatable {
    @Id
    private String id;
    
    private String userId;
    
    private String questionnaireId; // MongoDB ObjectId for questionnaire
    
    private QuestionnaireType questionnaireType; // "morning" eller "evening"
    
    private Map<String, Object> answers; // Map<QuestionId, AnswerValue>
    
    private SleepParameters sleepParameters; // Beregnede søvnparametre (kun for morgen)

    public Response() {
        super();
    }

    public Response(String userId, String questionnaireId, QuestionnaireType questionnaireType, Map<String, Object> answers) {
        super();
        this.userId = userId;
        this.questionnaireId = questionnaireId;
        this.questionnaireType = questionnaireType;
        this.answers = answers;
    }

    // Getters and Setters
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

    public SleepParameters getSleepParameters() {
        return sleepParameters;
    }

    public void setSleepParameters(SleepParameters sleepParameters) {
        this.sleepParameters = sleepParameters;
    }
    
    // Business logic metoder
    
    /**
     * Tjekker om response er komplet (har alle nødvendige svar)
     * Dette er en simpel implementering - kan udvides med specifik validering
     */
    public boolean isComplete() {
        return answers != null && !answers.isEmpty();
    }
    
    /**
     * Validerer at response er gyldig
     * @throws ValidationException hvis response ikke er gyldig
     */
    @Override
    public void validate() throws ValidationException {
        if (userId == null || userId.isEmpty()) {
            throw new ValidationException("Bruger ID er påkrævet");
        }
        if (questionnaireId == null || questionnaireId.isEmpty()) {
            throw new ValidationException("Spørgeskema ID er påkrævet");
        }
        if (questionnaireType == null) {
            throw new ValidationException("Spørgeskema type er påkrævet");
        }
        if (answers == null || answers.isEmpty()) {
            throw new ValidationException("Svar er påkrævet");
        }
    }
    
    /**
     * Tjekker om response kan beregne søvnparametre (kun for morgenskema)
     */
    public boolean canCalculateSleepParameters() {
        return questionnaireType == QuestionnaireType.morning;
    }
}


