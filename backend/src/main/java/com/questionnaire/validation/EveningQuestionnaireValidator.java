package com.questionnaire.validation;

import com.questionnaire.model.Question;
import com.questionnaire.service.QuestionFinder;
import com.questionnaire.service.interfaces.IQuestionnaireService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/**
 * Validator for evening questionnaire
 * Currently no evening-specific validation rules
 * Can be extended in the future if needed
 */
@Component
public class EveningQuestionnaireValidator extends QuestionnaireValidator {
    
    @Autowired
    public EveningQuestionnaireValidator(ValidatorFactory validatorFactory,
                                       IQuestionnaireService questionnaireService,
                                       QuestionFinder questionFinder) {
        super(validatorFactory, questionnaireService, questionFinder);
    }
    
    @Override
    protected void validateSpecificRules(List<Question> questions, Map<String, Object> answers, String questionnaireId) {
        // Currently no evening-specific validation rules
        // Can be extended in the future if needed
    }
}

