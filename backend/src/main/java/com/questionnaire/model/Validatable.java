package com.questionnaire.model;

import com.questionnaire.exception.ValidationException;

/**
 * Interface for entities der kan valideres
 */
public interface Validatable {
    /**
     * Validerer entity'en
     * @throws ValidationException hvis entity'en ikke er gyldig
     */
    void validate() throws ValidationException;
}




