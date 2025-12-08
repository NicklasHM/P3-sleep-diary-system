package com.questionnaire.service.interfaces;

import com.questionnaire.model.User;
import com.questionnaire.model.UserRole;

import java.util.List;
import java.util.Optional;

public interface IUserService {
    User registerUser(String username, String firstName, String lastName, String password, UserRole role);
    Optional<User> findByUsername(String username);
    boolean existsByUsername(String username);
    User findById(String id);
    List<User> getAllUsers();
    List<User> getUsersByRole(UserRole role);
    User assignAdvisor(String citizenId, String advisorId);
}




