package com.questionnaire.controller;

import com.questionnaire.dto.UserDto;
import com.questionnaire.model.QuestionnaireType;
import com.questionnaire.model.Response;
import com.questionnaire.model.SleepParameters;
import com.questionnaire.model.UserRole;
import com.questionnaire.service.interfaces.IResponseService;
import com.questionnaire.service.interfaces.IUserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private IResponseService responseService;

    @Autowired
    private IUserService userService;

    @GetMapping
    public ResponseEntity<List<UserDto>> getAllUsers() {
        List<UserDto> users = userService.getAllUsers().stream()
                .map(UserDto::fromUser)
                .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    @GetMapping("/citizens")
    public ResponseEntity<List<UserDto>> getAllCitizens() {
        List<com.questionnaire.model.User> citizens = userService.getUsersByRole(UserRole.BORGER);
        List<UserDto> citizenDtos = citizens.stream()
                .map(citizen -> {
                    com.questionnaire.model.User advisor = null;
                    if (citizen.getAdvisorId() != null && !citizen.getAdvisorId().isEmpty()) {
                        try {
                            advisor = userService.findById(citizen.getAdvisorId());
                        } catch (Exception e) {
                            // Advisor not found, ignore
                        }
                    }
                    return UserDto.fromUser(citizen, advisor);
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(citizenDtos);
    }

    @GetMapping("/advisors")
    public ResponseEntity<List<UserDto>> getAllAdvisors() {
        List<UserDto> advisors = userService.getUsersByRole(UserRole.RÅDGIVER).stream()
                .map(UserDto::fromUser)
                .collect(Collectors.toList());
        return ResponseEntity.ok(advisors);
    }

    @PutMapping("/{citizenId}/assign-advisor")
    public ResponseEntity<UserDto> assignAdvisor(
            @PathVariable String citizenId,
            @RequestBody(required = false) Map<String, String> request) {
        String advisorId = request != null ? request.get("advisorId") : null;
        com.questionnaire.model.User updatedCitizen = userService.assignAdvisor(citizenId, advisorId);
        
        com.questionnaire.model.User advisor = null;
        if (updatedCitizen.getAdvisorId() != null && !updatedCitizen.getAdvisorId().isEmpty()) {
            try {
                advisor = userService.findById(updatedCitizen.getAdvisorId());
            } catch (Exception e) {
                // Advisor not found, ignore
            }
        }
        
        return ResponseEntity.ok(UserDto.fromUser(updatedCitizen, advisor));
    }

    @GetMapping("/{id}/sleep-data")
    public ResponseEntity<Map<String, Object>> getSleepData(@PathVariable String id) {
        List<Response> morningResponses = responseService.getResponsesByUserIdAndQuestionnaireType(id, QuestionnaireType.morning);
        
        List<Map<String, Object>> sleepData = morningResponses.stream()
                .map(response -> {
                    // Genberegn altid søvnparametre for at sikre korrekt beregning
                    // Dette sikrer at eventuelle rettelser i beregningen anvendes
                    SleepParameters params = responseService.calculateSleepParameters(response.getId());
                    
                    // Formater TIB som HH:MM
                    double tibMinutes = params.getTIB();
                    // Sikr at TIB ikke er negativ
                    if (tibMinutes < 0) {
                        tibMinutes = 0;
                    }
                    int tibHours = (int) (tibMinutes / 60);
                    int tibMins = (int) (tibMinutes % 60);
                    // Håndter negativt modulo korrekt
                    if (tibMins < 0) {
                        tibMins = 60 + tibMins;
                        tibHours--;
                    }
                    String tibFormatted = String.format("%02d:%02d", tibHours, tibMins);
                    
                    // Formater TST som HH:MM
                    double tstMinutes = params.getTST();
                    // Sikr at TST ikke er negativ
                    if (tstMinutes < 0) {
                        tstMinutes = 0;
                    }
                    int tstHours = (int) (tstMinutes / 60);
                    int tstMins = (int) (tstMinutes % 60);
                    // Håndter negativt modulo korrekt
                    if (tstMins < 0) {
                        tstMins = 60 + tstMins;
                        tstHours--;
                    }
                    String tstFormatted = String.format("%02d:%02d", tstHours, tstMins);
                    
                    return Map.of(
                            "responseId", response.getId(),
                            "createdAt", response.getCreatedAt(),
                            "sleepParameters", Map.of(
                                    "SOL", params.getSOL(),
                                    "WASO", params.getWASO(),
                                    "TIB", tibFormatted,
                                    "TIBMinutes", tibMinutes, // Behold også i minutter for reference
                                    "TST", tstFormatted,
                                    "TSTMinutes", tstMinutes // Behold også i minutter for reference
                            )
                    );
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(Map.of("sleepData", sleepData));
    }
}

