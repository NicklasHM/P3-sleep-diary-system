package com.questionnaire.dto;

import com.questionnaire.model.UserRole;

public class AuthResponse {
    private String token;
    private String username;
    private String fullName;
    private UserRole role;

    public AuthResponse() {}

    public AuthResponse(String token, String username, String fullName, UserRole role) {
        this.token = token;
        this.username = username;
        this.fullName = fullName;
        this.role = role;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
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
}





