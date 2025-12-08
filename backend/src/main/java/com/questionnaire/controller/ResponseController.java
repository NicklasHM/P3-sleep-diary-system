package com.questionnaire.controller;

import com.questionnaire.dto.NextQuestionRequest;
import com.questionnaire.dto.ResponseRequest;
import com.questionnaire.model.Question;
import com.questionnaire.model.Response;
import com.questionnaire.model.User;
import com.questionnaire.service.interfaces.IResponseService;
import com.questionnaire.service.interfaces.IUserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/responses")
@CrossOrigin(origins = "*")
public class ResponseController {

    @Autowired
    private IResponseService responseService;

    @Autowired
    private IUserService userService;

    @PostMapping
    public ResponseEntity<Response> saveResponse(
            @RequestBody ResponseRequest request,
            Authentication authentication) {
        String username = authentication.getName();
        User user = userService.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Bruger ikke fundet"));
        String userId = user.getId();
        
        Response response = responseService.saveResponse(
                userId,
                request.getQuestionnaireId(),
                request.getAnswers()
        );

        // Hvis det er morgenskema, beregn søvnparametre (beregnes on-the-fly når det anmodes)

        return ResponseEntity.ok(response);
    }

    @PostMapping("/next")
    public ResponseEntity<Question> getNextQuestion(
            @RequestBody NextQuestionRequest request,
            @RequestParam(required = false, defaultValue = "da") String language) {
        Question nextQuestion = responseService.getNextQuestion(
                request.getQuestionnaireId(),
                request.getCurrentAnswers(),
                request.getCurrentQuestionId(),
                language
        );

        if (nextQuestion == null) {
            return ResponseEntity.noContent().build();
        }

        return ResponseEntity.ok(nextQuestion);
    }

    @GetMapping
    public ResponseEntity<List<Response>> getResponses(
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String questionnaireId) {
        List<Response> responses;
        
        if (userId != null && questionnaireId != null) {
            responses = responseService.getResponsesByUserIdAndQuestionnaireId(userId, questionnaireId);
        } else if (userId != null) {
            responses = responseService.getResponsesByUserId(userId);
        } else {
            return ResponseEntity.badRequest().build();
        }
        
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/check-today")
    public ResponseEntity<Map<String, Boolean>> checkResponseForToday(
            @RequestParam String questionnaireType,
            Authentication authentication) {
        String username = authentication.getName();
        User user = userService.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Bruger ikke fundet"));
        
        com.questionnaire.model.QuestionnaireType type = com.questionnaire.model.QuestionnaireType.valueOf(questionnaireType.toLowerCase());
        boolean hasResponse = responseService.hasResponseForToday(user.getId(), type);
        
        Map<String, Boolean> result = new HashMap<>();
        result.put("hasResponse", hasResponse);
        
        return ResponseEntity.ok(result);
    }
}

