package com.questionnaire.service.interfaces;

import com.questionnaire.model.SleepParameters;

import java.util.Map;

public interface ISleepParameterCalculator {
    SleepParameters calculate(Map<String, Object> answers, String questionnaireId);
}




