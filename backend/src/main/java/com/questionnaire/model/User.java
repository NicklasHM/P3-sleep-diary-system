package com.questionnaire.model;

import com.questionnaire.constants.QuestionnaireConstants;
import com.questionnaire.exception.ValidationException;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

@Document(collection = "users")
public class User extends BaseEntity implements Validatable {
    @Id
    private String id;
    
    @Indexed(unique = true)
    private String username;
    
    private String password;
    
    private UserRole role;
    
    private String firstName;
    
    private String lastName;
    
    private String advisorId; // ID of the assigned advisor

    public User() {
        super();
    }

    public User(String username, String password, UserRole role, String firstName, String lastName) {
        super();
        this.username = username;
        this.password = password;
        this.role = role;
        this.firstName = firstName;
        this.lastName = lastName;
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

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public UserRole getRole() {
        return role;
    }

    public void setRole(UserRole role) {
        this.role = role;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getFullName() {
        if (firstName != null && lastName != null) {
            return firstName + " " + lastName;
        } else if (firstName != null) {
            return firstName;
        } else if (lastName != null) {
            return lastName;
        }
        return username; // Fallback til username hvis navn mangler
    }

    public String getAdvisorId() {
        return advisorId;
    }

    public void setAdvisorId(String advisorId) {
        this.advisorId = advisorId;
    }
    
    // Business logic metoder
    
    /**
     * Normaliserer et navn ved at trimme whitespace og formaterer det med stort første bogstav og små bogstaver i resten.
     * Eksempel: "  NiCKlAs   " -> "Nicklas"
     * Håndterer også edge cases som ét bogstav eller tomme strenge.
     */
    public static String normalizeName(String name) {
        if (name == null) {
            return null;
        }
        // Trim alle whitespace (før og efter) - brug trim() som fjerner alle whitespace karakterer
        String trimmed = name.trim();
        if (trimmed.isEmpty()) {
            return ""; // Returner tom streng i stedet for at beholde whitespace
        }
        // Hvis kun ét tegn, returner det som stort bogstav
        if (trimmed.length() == 1) {
            return trimmed.toUpperCase();
        }
        // Første bogstav stort, resten små bogstaver
        String firstChar = trimmed.substring(0, 1).toUpperCase();
        String rest = trimmed.substring(1).toLowerCase();
        return firstChar + rest;
    }
    
    /**
     * Tjekker om brugeren kan tilknyttes en rådgiver
     */
    public boolean canBeAssignedToAdvisor() {
        return role == UserRole.BORGER;
    }
    
    /**
     * Validerer password krav
     * @param password Password der skal valideres
     * @throws ValidationException hvis password ikke opfylder krav
     */
    public static void validatePassword(String password) {
        if (password == null || password.length() < QuestionnaireConstants.MIN_PASSWORD_LENGTH) {
            throw new ValidationException("Password skal være mindst " + QuestionnaireConstants.MIN_PASSWORD_LENGTH + " tegn langt");
        }
        if (!password.matches(".*[a-zA-Z].*") || !password.matches(".*[0-9].*")) {
            throw new ValidationException("Password skal indeholde både bogstaver og tal");
        }
    }
    
    /**
     * Validerer brugeren
     */
    @Override
    public void validate() throws ValidationException {
        if (username == null || username.isEmpty()) {
            throw new ValidationException("Brugernavn er påkrævet");
        }
        if (password == null || password.isEmpty()) {
            throw new ValidationException("Password er påkrævet");
        }
        if (role == null) {
            throw new ValidationException("Rolle er påkrævet");
        }
        if (firstName == null || firstName.trim().isEmpty()) {
            throw new ValidationException("Fornavn er påkrævet");
        }
        if (lastName == null || lastName.trim().isEmpty()) {
            throw new ValidationException("Efternavn er påkrævet");
        }
    }
}


