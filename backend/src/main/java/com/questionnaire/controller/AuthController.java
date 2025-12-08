package com.questionnaire.controller;

import com.questionnaire.dto.AuthResponse;
import com.questionnaire.dto.LoginRequest;
import com.questionnaire.dto.RegisterRequest;
import com.questionnaire.exception.InvalidCredentialsException;
import com.questionnaire.exception.ValidationException;
import com.questionnaire.model.User;
import com.questionnaire.security.JwtTokenProvider;
import com.questionnaire.service.interfaces.IUserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private IUserService userService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        User user = userService.findByUsername(request.getUsername())
                .orElseThrow(() -> new InvalidCredentialsException("Forkert brugernavn eller password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new InvalidCredentialsException("Forkert brugernavn eller password");
        }

        String token = tokenProvider.generateToken(user.getUsername(), user.getRole().name());
        AuthResponse response = new AuthResponse(token, user.getUsername(), user.getFullName(), user.getRole());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/check-username")
    public ResponseEntity<Map<String, Boolean>> checkUsername(@RequestParam String username) {
        boolean exists = userService.existsByUsername(username);
        Map<String, Boolean> response = new HashMap<>();
        response.put("exists", exists);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        // Valider at passwords matcher
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new ValidationException("Passwords matcher ikke");
        }

        // Valider at alle påkrævede felter er udfyldt
        if (request.getFirstName() == null || request.getFirstName().trim().isEmpty()) {
            throw new ValidationException("Fornavn er påkrævet");
        }
        if (request.getLastName() == null || request.getLastName().trim().isEmpty()) {
            throw new ValidationException("Efternavn er påkrævet");
        }
        if (request.getUsername() == null || request.getUsername().trim().isEmpty()) {
            throw new ValidationException("Brugernavn er påkrævet");
        }

        User user = userService.registerUser(
                request.getUsername(),
                request.getFirstName(),
                request.getLastName(),
                request.getPassword(),
                request.getRole()
        );

        String token = tokenProvider.generateToken(user.getUsername(), user.getRole().name());
        AuthResponse response = new AuthResponse(token, user.getUsername(), user.getFullName(), user.getRole());

        return ResponseEntity.ok(response);
    }
}





