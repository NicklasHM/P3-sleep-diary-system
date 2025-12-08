package com.questionnaire.controller;

import com.questionnaire.model.Question;
import com.questionnaire.model.Questionnaire;
import com.questionnaire.model.QuestionnaireType;
import com.questionnaire.service.interfaces.IQuestionnaireService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/questionnaires")
@CrossOrigin(origins = "*")
public class QuestionnaireController {

    @Autowired
    private IQuestionnaireService questionnaireService;

    @GetMapping("/{type}")
    public ResponseEntity<Questionnaire> getQuestionnaire(@PathVariable String type) {
        QuestionnaireType questionnaireType = QuestionnaireType.valueOf(type);
        Questionnaire questionnaire = questionnaireService.getQuestionnaireByType(questionnaireType);
        return ResponseEntity.ok(questionnaire);
    }

    @GetMapping("/{type}/start")
    public ResponseEntity<List<Question>> startQuestionnaire(
            @PathVariable String type,
            @RequestParam(required = false, defaultValue = "da") String language) {
        QuestionnaireType questionnaireType = QuestionnaireType.valueOf(type);
        Questionnaire questionnaire = questionnaireService.getQuestionnaireByType(questionnaireType);
        List<Question> questions = questionnaireService.getQuestionsByQuestionnaireId(questionnaire.getId(), language);
        
        // Returner kun første spørgsmål
        if (!questions.isEmpty()) {
            return ResponseEntity.ok(List.of(questions.get(0)));
        }
        return ResponseEntity.ok(List.of());
    }
}





