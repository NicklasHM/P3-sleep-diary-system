package com.questionnaire.repository;

import com.questionnaire.model.Questionnaire;
import com.questionnaire.model.QuestionnaireType;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface QuestionnaireRepository extends MongoRepository<Questionnaire, String> {
    Optional<Questionnaire> findByType(QuestionnaireType type);
}










