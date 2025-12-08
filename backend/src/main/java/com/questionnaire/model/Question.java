package com.questionnaire.model;

import com.questionnaire.exception.QuestionLockedException;
import com.questionnaire.exception.ValidationException;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Document(collection = "questions")
public class Question extends BaseEntity implements Validatable {
    @Id
    private String id;
    
    private String questionnaireId;
    
    private String text; // For bagudkompatibilitet - brug textDa/textEn i stedet
    private String textDa; // Dansk tekst
    private String textEn; // Engelsk tekst
    
    private QuestionType type;
    
    private boolean isLocked;
    
    private int order;
    
    private List<QuestionOption> options; // For multiple_choice
    
    private List<ConditionalChild> conditionalChildren;
    
    // Validation fields
    private Integer minValue;  // For numeric og slider
    private Integer maxValue;  // For numeric og slider
    private String minTime;    // For time_picker (format: "HH:mm")
    private String maxTime;    // For time_picker (format: "HH:mm")
    
    // Color code fields for advisor visualization
    private Boolean hasColorCode;  // Om spørgsmålet har farvekoder
    private Integer colorCodeGreenMax;  // Maksimum værdi for grøn farvekode (≤ værdi)
    private Integer colorCodeGreenMin;  // Minimum værdi for grøn farvekode (≥ værdi)
    private Integer colorCodeYellowMin;  // Minimum værdi for gul farvekode
    private Integer colorCodeYellowMax;  // Maksimum værdi for gul farvekode
    private Integer colorCodeRedMin;  // Minimum værdi for rød farvekode (≥ værdi)
    private Integer colorCodeRedMax;  // Maksimum værdi for rød farvekode (< værdi)
    
    // Soft delete field
    private Date deletedAt;  // Hvis null, er spørgsmålet aktivt. Hvis sat, er det slettet.

    public Question() {
        super();
    }

    public Question(String questionnaireId, String text, QuestionType type, boolean isLocked, int order) {
        super();
        this.questionnaireId = questionnaireId;
        this.text = text;
        this.type = type;
        this.isLocked = isLocked;
        this.order = order;
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getQuestionnaireId() {
        return questionnaireId;
    }

    public void setQuestionnaireId(String questionnaireId) {
        this.questionnaireId = questionnaireId;
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

    public QuestionType getType() {
        return type;
    }

    public void setType(QuestionType type) {
        this.type = type;
    }

    public boolean isLocked() {
        return isLocked;
    }

    public void setLocked(boolean locked) {
        isLocked = locked;
    }

    public int getOrder() {
        return order;
    }

    public void setOrder(int order) {
        this.order = order;
    }

    public List<QuestionOption> getOptions() {
        return options;
    }

    public void setOptions(List<QuestionOption> options) {
        this.options = options;
    }

    public List<ConditionalChild> getConditionalChildren() {
        return conditionalChildren;
    }

    public void setConditionalChildren(List<ConditionalChild> conditionalChildren) {
        this.conditionalChildren = conditionalChildren;
    }

    public Integer getMinValue() {
        return minValue;
    }

    public void setMinValue(Integer minValue) {
        this.minValue = minValue;
    }

    public Integer getMaxValue() {
        return maxValue;
    }

    public void setMaxValue(Integer maxValue) {
        this.maxValue = maxValue;
    }

    public String getMinTime() {
        return minTime;
    }

    public void setMinTime(String minTime) {
        this.minTime = minTime;
    }

    public String getMaxTime() {
        return maxTime;
    }

    public void setMaxTime(String maxTime) {
        this.maxTime = maxTime;
    }

    public Boolean getHasColorCode() {
        return hasColorCode;
    }

    public void setHasColorCode(Boolean hasColorCode) {
        this.hasColorCode = hasColorCode;
    }

    public Integer getColorCodeGreenMax() {
        return colorCodeGreenMax;
    }

    public void setColorCodeGreenMax(Integer colorCodeGreenMax) {
        this.colorCodeGreenMax = colorCodeGreenMax;
    }

    public Integer getColorCodeGreenMin() {
        return colorCodeGreenMin;
    }

    public void setColorCodeGreenMin(Integer colorCodeGreenMin) {
        this.colorCodeGreenMin = colorCodeGreenMin;
    }

    public Integer getColorCodeYellowMin() {
        return colorCodeYellowMin;
    }

    public void setColorCodeYellowMin(Integer colorCodeYellowMin) {
        this.colorCodeYellowMin = colorCodeYellowMin;
    }

    public Integer getColorCodeYellowMax() {
        return colorCodeYellowMax;
    }

    public void setColorCodeYellowMax(Integer colorCodeYellowMax) {
        this.colorCodeYellowMax = colorCodeYellowMax;
    }

    public Integer getColorCodeRedMin() {
        return colorCodeRedMin;
    }

    public void setColorCodeRedMin(Integer colorCodeRedMin) {
        this.colorCodeRedMin = colorCodeRedMin;
    }

    public Integer getColorCodeRedMax() {
        return colorCodeRedMax;
    }

    public void setColorCodeRedMax(Integer colorCodeRedMax) {
        this.colorCodeRedMax = colorCodeRedMax;
    }

    public Date getDeletedAt() {
        return deletedAt;
    }

    public void setDeletedAt(Date deletedAt) {
        this.deletedAt = deletedAt;
    }
    
    // Hjælpemetode til at tjekke om spørgsmålet er slettet
    public boolean isDeleted() {
        return deletedAt != null;
    }
    
    // Business logic metoder
    
    /**
     * Tjekker om spørgsmålet kan redigeres
     */
    public boolean canBeEdited() {
        return !isLocked() && !isDeleted();
    }
    
    /**
     * Validerer om spørgsmålet kan opdateres
     * @throws QuestionLockedException hvis spørgsmålet er låst
     */
    public void validateUpdate() {
        if (isLocked()) {
            throw new QuestionLockedException("Spørgsmål er låst og kan ikke redigeres");
        }
        if (isDeleted()) {
            throw new RuntimeException("Spørgsmål er slettet og kan ikke redigeres");
        }
    }
    
    /**
     * Opdaterer spørgsmålet med data fra et andet spørgsmål
     * @param other Spørgsmålet med nye data
     */
    public void updateFrom(Question other) {
        validateUpdate();
        
        // Opdater tekstfelter (både text og textDa/textEn for bagudkompatibilitet)
        if (other.getTextDa() != null) {
            this.textDa = other.getTextDa();
        }
        if (other.getTextEn() != null) {
            this.textEn = other.getTextEn();
        }
        // Hvis kun text er sat (bagudkompatibilitet), sæt det også
        if (other.getText() != null && 
            (other.getTextDa() == null && other.getTextEn() == null)) {
            this.text = other.getText();
        }
        
        this.type = other.getType();
        this.order = other.getOrder();
        this.options = other.getOptions();
        
        // Opdater valideringsfelter
        this.minValue = other.getMinValue();
        this.maxValue = other.getMaxValue();
        this.minTime = other.getMinTime();
        this.maxTime = other.getMaxTime();
        
        // Opdater farvekode-felter
        this.hasColorCode = other.getHasColorCode();
        this.colorCodeGreenMax = other.getColorCodeGreenMax();
        this.colorCodeGreenMin = other.getColorCodeGreenMin();
        this.colorCodeYellowMin = other.getColorCodeYellowMin();
        this.colorCodeYellowMax = other.getColorCodeYellowMax();
        this.colorCodeRedMin = other.getColorCodeRedMin();
        this.colorCodeRedMax = other.getColorCodeRedMax();
        
        // Bevar eksisterende conditional children hvis de ikke sendes med i update
        // Kun opdater hvis conditionalChildren eksplicit sendes med
        if (other.getConditionalChildren() != null) {
            this.conditionalChildren = other.getConditionalChildren();
        }
        // Hvis null, beholde de eksisterende conditional children
    }
    
    /**
     * Tilføjer et conditional child til spørgsmålet
     * @param optionId ID på option der trigger conditional child
     * @param childQuestionId ID på child spørgsmålet
     * @throws QuestionLockedException hvis spørgsmålet er låst
     */
    public void addConditionalChild(String optionId, String childQuestionId) {
        validateUpdate();
        
        if (this.conditionalChildren == null) {
            this.conditionalChildren = new ArrayList<>();
        }
        
        // Tjek om denne childQuestionId allerede findes for denne option
        // Hvis ja, tilføj ikke en duplikat
        boolean alreadyExists = this.conditionalChildren.stream()
            .anyMatch(cc -> cc.getOptionId().equals(optionId) && 
                           cc.getChildQuestionId().equals(childQuestionId));
        
        if (!alreadyExists) {
            ConditionalChild conditionalChild = new ConditionalChild(optionId, childQuestionId);
            this.conditionalChildren.add(conditionalChild);
        }
    }
    
    /**
     * Fjerner et conditional child fra spørgsmålet
     * @param optionId ID på option
     * @param childQuestionId ID på child spørgsmålet
     * @throws QuestionLockedException hvis spørgsmålet er låst
     */
    public void removeConditionalChild(String optionId, String childQuestionId) {
        validateUpdate();
        
        if (this.conditionalChildren != null) {
            this.conditionalChildren.removeIf(cc -> 
                cc.getOptionId().equals(optionId) && cc.getChildQuestionId().equals(childQuestionId)
            );
        }
    }
    
    /**
     * Opdaterer rækkefølgen af conditional children for en specifik option
     * @param optionId ID på option
     * @param childQuestionIds Liste af child question IDs i den ønskede rækkefølge
     * @throws QuestionLockedException hvis spørgsmålet er låst
     */
    public void updateConditionalChildrenOrder(String optionId, List<String> childQuestionIds) {
        validateUpdate();
        
        if (this.conditionalChildren != null) {
            // Fjern alle conditional children for denne option
            List<ConditionalChild> otherOptionChildren = new ArrayList<>();
            List<ConditionalChild> thisOptionChildren = new ArrayList<>();
            
            for (ConditionalChild cc : this.conditionalChildren) {
                if (cc.getOptionId().equals(optionId)) {
                    thisOptionChildren.add(cc);
                } else {
                    otherOptionChildren.add(cc);
                }
            }
            
            // Opret nye conditional children i den nye rækkefølge
            List<ConditionalChild> newChildren = new ArrayList<>(otherOptionChildren);
            for (String childQuestionId : childQuestionIds) {
                ConditionalChild cc = thisOptionChildren.stream()
                    .filter(c -> c.getChildQuestionId().equals(childQuestionId))
                    .findFirst()
                    .orElse(new ConditionalChild(optionId, childQuestionId));
                newChildren.add(cc);
            }
            
            this.conditionalChildren = newChildren;
        }
    }
    
    /**
     * Validerer spørgsmålet
     */
    @Override
    public void validate() throws ValidationException {
        if (questionnaireId == null || questionnaireId.isEmpty()) {
            throw new ValidationException("Spørgeskema ID er påkrævet");
        }
        if (type == null) {
            throw new ValidationException("Spørgsmål type er påkrævet");
        }
        if (text == null && (textDa == null || textDa.isEmpty()) && (textEn == null || textEn.isEmpty())) {
            throw new ValidationException("Spørgsmål tekst er påkrævet");
        }
    }
}




