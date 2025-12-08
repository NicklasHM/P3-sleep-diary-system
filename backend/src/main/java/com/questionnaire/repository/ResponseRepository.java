package com.questionnaire.repository;

import com.questionnaire.model.QuestionnaireType;
import com.questionnaire.model.Response;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.Date;
import java.util.List;

@Repository
public interface ResponseRepository extends MongoRepository<Response, String> {
    List<Response> findByUserId(String userId);
    List<Response> findByUserIdAndQuestionnaireId(String userId, String questionnaireId);
    List<Response> findByUserIdAndQuestionnaireType(String userId, QuestionnaireType questionnaireType);
    
    @Query("{ 'userId': ?0, 'questionnaireType': ?1, 'createdAt': { $gte: ?2, $lt: ?3 } }")
    List<Response> findByUserIdAndQuestionnaireTypeAndDateRange(
        String userId, 
        QuestionnaireType questionnaireType, 
        Date startOfDay, 
        Date endOfDay
    );
}


