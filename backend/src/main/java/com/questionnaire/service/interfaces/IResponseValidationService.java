package com.questionnaire.service.interfaces;

import java.util.Map;

public interface IResponseValidationService {
    void validateResponse(String questionnaireId, Map<String, Object> answers);
}




