package com.questionnaire.service;

import com.questionnaire.exception.InvalidPasswordException;
import com.questionnaire.exception.UserNotFoundException;
import com.questionnaire.exception.UsernameAlreadyExistsException;
import com.questionnaire.exception.ValidationException;
import com.questionnaire.model.User;
import com.questionnaire.model.UserRole;
import com.questionnaire.repository.UserRepository;
import com.questionnaire.service.interfaces.IUserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UserServiceImpl implements IUserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public User registerUser(String username, String firstName, String lastName, String password, UserRole role) {
        if (userRepository.existsByUsername(username)) {
            throw new UsernameAlreadyExistsException("Brugernavn findes allerede");
        }

        // Brug domain logic fra User-klassen
        try {
            User.validatePassword(password);
        } catch (ValidationException e) {
            throw new InvalidPasswordException(e.getMessage());
        }

        // Normaliser firstName og lastName - brug domain logic fra User-klassen
        String normalizedFirstName = User.normalizeName(firstName);
        String normalizedLastName = User.normalizeName(lastName);
        
        // Valider at normaliserede navne ikke er tomme
        if (normalizedFirstName == null || normalizedFirstName.trim().isEmpty()) {
            throw new ValidationException("Fornavn er påkrævet");
        }
        if (normalizedLastName == null || normalizedLastName.trim().isEmpty()) {
            throw new ValidationException("Efternavn er påkrævet");
        }

        User user = new User();
        user.setUsername(username);
        user.setFirstName(normalizedFirstName);
        user.setLastName(normalizedLastName);
        user.setPassword(passwordEncoder.encode(password));
        user.setRole(role);

        return userRepository.save(user);
    }

    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public boolean existsByUsername(String username) {
        return userRepository.existsByUsername(username);
    }

    public User findById(String id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("Bruger ikke fundet"));
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public List<User> getUsersByRole(UserRole role) {
        return userRepository.findByRole(role);
    }

    public User assignAdvisor(String citizenId, String advisorId) {
        User citizen = findById(citizenId);
        
        // Brug domain logic fra User-klassen
        if (!citizen.canBeAssignedToAdvisor()) {
            throw new RuntimeException("Kun borgere kan tilknyttes en rådgiver");
        }
        
        if (advisorId != null && !advisorId.isEmpty()) {
            User advisor = findById(advisorId);
            if (advisor.getRole() != UserRole.RÅDGIVER) {
                throw new RuntimeException("Den valgte bruger er ikke en rådgiver");
            }
            citizen.setAdvisorId(advisorId);
        } else {
            citizen.setAdvisorId(null);
        }
        
        return userRepository.save(citizen);
    }
}

