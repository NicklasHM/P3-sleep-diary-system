package com.questionnaire.validation;

import com.questionnaire.constants.QuestionnaireConstants;
import com.questionnaire.model.Question;
import com.questionnaire.model.QuestionType;
import com.questionnaire.repository.QuestionRepository;
import com.questionnaire.service.QuestionFinder;
import com.questionnaire.service.interfaces.IQuestionnaireService;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;
import java.util.Map;

/**
 * Abstract base class for questionnaire-specific validators
 * Implements template method pattern for validation
 */
public abstract class QuestionnaireValidator {
    
    protected final ValidatorFactory validatorFactory;
    protected final IQuestionnaireService questionnaireService;
    protected final QuestionFinder questionFinder;
    
    @Autowired
    protected QuestionRepository questionRepository;
    
    public QuestionnaireValidator(ValidatorFactory validatorFactory,
                                 IQuestionnaireService questionnaireService,
                                 QuestionFinder questionFinder) {
        this.validatorFactory = validatorFactory;
        this.questionnaireService = questionnaireService;
        this.questionFinder = questionFinder;
    }
    
    /**
     * Template method for validation
     * Defines the algorithm structure
     */
    public final void validate(String questionnaireId, Map<String, Object> answers) {
        List<Question> questions = getQuestions(questionnaireId);
        validateBasicAnswers(questions, answers);
        validateSpecificRules(questions, answers, questionnaireId);
    }
    
    /**
     * Henter spørgsmål for questionnaire
     */
    protected List<Question> getQuestions(String questionnaireId) {
        return questionRepository.findByQuestionnaireIdOrderByOrderAsc(questionnaireId);
    }
    
    /**
     * Validerer grundlæggende svar (min/max værdier, formater, etc.)
     * Dette er fælles for alle questionnaire typer
     */
    protected void validateBasicAnswers(List<Question> questions, Map<String, Object> answers) {
        for (Question question : questions) {
            // Tjek om dette spørgsmål er et conditional child der ikke skal vises
            if (isConditionalChildThatShouldNotBeShown(question, questions, answers)) {
                continue; // Spring over conditional children der ikke skal vises
            }
            
            Object answer = answers.get(question.getId());
            if (answer == null) continue;
            
            // Brug polymorphism pattern - få korrekt validator baseret på question type
            AnswerValidator validator = validatorFactory.getValidator(question.getType());
            
            // Valider text input (spørgsmål 2 i morgenskema: max 200 tegn)
            if (question.getType() == QuestionType.text && question.getOrder() == QuestionnaireConstants.ORDER_2) {
                validator.validate(question, answer);
            } else if (question.getType() == QuestionType.numeric || question.getType() == QuestionType.slider || 
                       question.getType() == QuestionType.time_picker || 
                       question.getType() == QuestionType.multiple_choice || 
                       question.getType() == QuestionType.multiple_choice_multiple) {
                // Brug validator for alle andre typer
                validator.validate(question, answer);
            }
        }
    }
    
    /**
     * Tjekker om et spørgsmål er et conditional child der ikke skal vises baseret på parent svar
     */
    private boolean isConditionalChildThatShouldNotBeShown(Question question, List<Question> allQuestions, Map<String, Object> answers) {
        // Find parent spørgsmål der har dette spørgsmål som conditional child
        for (Question parentQuestion : allQuestions) {
            if (parentQuestion.getConditionalChildren() != null) {
                for (com.questionnaire.model.ConditionalChild cc : parentQuestion.getConditionalChildren()) {
                    if (cc.getChildQuestionId() != null && cc.getChildQuestionId().equals(question.getId())) {
                        // Dette er et conditional child - tjek om parent svar matcher
                        Object parentAnswer = answers.get(parentQuestion.getId());
                        if (parentAnswer == null) {
                            // Parent er ikke besvaret, så conditional child skal ikke vises
                            return true;
                        }
                        
                        // Tjek om parent svar matcher optionId for conditional child
                        String parentOptionId = com.questionnaire.utils.AnswerParser.extractOptionId(parentAnswer);
                        if (parentOptionId == null || !parentOptionId.equals(cc.getOptionId())) {
                            // Parent svar matcher ikke, så conditional child skal ikke vises
                            return true;
                        }
                        
                        // Parent svar matcher, så conditional child skal vises
                        return false;
                    }
                }
            }
        }
        
        // Dette er ikke et conditional child
        return false;
    }
    
    /**
     * Abstract method for questionnaire-specific validation rules
     * Must be implemented by subclasses
     */
    protected abstract void validateSpecificRules(List<Question> questions, Map<String, Object> answers, String questionnaireId);
}



