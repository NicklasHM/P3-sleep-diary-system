package com.questionnaire.repository;

import com.questionnaire.model.Question;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface QuestionRepository extends MongoRepository<Question, String> {
    // Find kun aktive spørgsmål (deletedAt == null)
    @Query("{ 'questionnaireId': ?0, 'deletedAt': null }")
    List<Question> findByQuestionnaireIdOrderByOrderAsc(String questionnaireId);
    
    @Query("{ 'questionnaireId': ?0, 'deletedAt': null }")
    List<Question> findByQuestionnaireId(String questionnaireId);
    
    // Find alle spørgsmål inkl. slettede (til visning af besvarelser)
    @Query("{ 'questionnaireId': ?0 }")
    List<Question> findAllByQuestionnaireIdIncludingDeleted(String questionnaireId);
    
    // Find spørgsmål uanset status (til besvarelser)
    Optional<Question> findById(String id);
}






