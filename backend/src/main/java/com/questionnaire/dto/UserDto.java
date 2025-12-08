package com.questionnaire.dto;

import com.questionnaire.model.UserRole;

public class UserDto {
    private String id;
    private String username;
    private String fullName;
    private UserRole role;
    private String advisorId;
    private String advisorName;

    public UserDto() {}

    public UserDto(String id, String username, String fullName, UserRole role, String advisorId, String advisorName) {
        this.id = id;
        this.username = username;
        this.fullName = fullName;
        this.role = role;
        this.advisorId = advisorId;
        this.advisorName = advisorName;
    }

    public static UserDto fromUser(com.questionnaire.model.User user, com.questionnaire.model.User advisor) {
        return new UserDto(
            user.getId(),
            user.getUsername(),
            user.getFullName(),
            user.getRole(),
            user.getAdvisorId(),
            advisor != null ? advisor.getFullName() : null
        );
    }
    
    public static UserDto fromUser(com.questionnaire.model.User user) {
        return fromUser(user, null);
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public UserRole getRole() {
        return role;
    }

    public void setRole(UserRole role) {
        this.role = role;
    }

    public String getAdvisorId() {
        return advisorId;
    }

    public void setAdvisorId(String advisorId) {
        this.advisorId = advisorId;
    }

    public String getAdvisorName() {
        return advisorName;
    }

    public void setAdvisorName(String advisorName) {
        this.advisorName = advisorName;
    }
}


