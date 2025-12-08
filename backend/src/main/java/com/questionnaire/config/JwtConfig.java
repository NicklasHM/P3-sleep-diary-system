package com.questionnaire.config;

import io.github.cdimascio.dotenv.Dotenv;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;

@Configuration
public class JwtConfig {

    private static final Logger logger = LoggerFactory.getLogger(JwtConfig.class);

    /**
     * Henter JWT secret fra miljøvariabler eller .env fil
     * Secret skal være mindst 256 bits (32 bytes) lang for sikkerhed
     */
    public static String getJwtSecret() {
        // Prøv først environment variable
        String secret = System.getenv("JWT_SECRET");
        
        if (secret == null || secret.isEmpty()) {
            // Prøv at læse fra .env fil i backend mappen
            try {
                String currentDir = System.getProperty("user.dir");
                
                Dotenv dotenv = Dotenv.configure()
                        .directory(currentDir)
                        .ignoreIfMissing()
                        .systemProperties()
                        .load();
                
                secret = dotenv.get("JWT_SECRET");
                
                // Hvis der stadig er null, prøv at læse direkte fra filen
                if (secret == null || secret.isEmpty()) {
                    java.io.File envFile = new java.io.File(currentDir, ".env");
                    if (envFile.exists()) {
                        try {
                            String content = new String(java.nio.file.Files.readAllBytes(envFile.toPath()), java.nio.charset.StandardCharsets.UTF_8);
                            // Fjern BOM hvis det findes
                            if (content.startsWith("\uFEFF")) {
                                content = content.substring(1);
                            }
                            // Parse manuelt
                            for (String line : content.split("\n")) {
                                line = line.trim();
                                if (line.startsWith("JWT_SECRET=")) {
                                    secret = line.substring("JWT_SECRET=".length()).trim();
                                    // Fjern quotes hvis de findes
                                    if (secret.startsWith("\"") && secret.endsWith("\"")) {
                                        secret = secret.substring(1, secret.length() - 1);
                                    }
                                    if (secret.startsWith("'") && secret.endsWith("'")) {
                                        secret = secret.substring(1, secret.length() - 1);
                                    }
                                    break;
                                }
                            }
                        } catch (Exception fileEx) {
                            logger.warn("Kunne ikke læse .env fil direkte: {}", fileEx.getMessage());
                        }
                    }
                }
                
                if (secret != null && !secret.isEmpty()) {
                    logger.info("JWT secret fundet i .env fil");
                }
            } catch (Exception e) {
                logger.error("Kunne ikke indlæse .env fil: {}", e.getMessage());
            }
        } else {
            logger.info("JWT secret fundet i environment variable");
        }
        
        if (secret == null || secret.isEmpty()) {
            throw new IllegalStateException("JWT_SECRET skal være sat i .env filen i backend mappen eller som environment variable. Secret skal være mindst 256 bits (32 bytes) lang.");
        }
        
        // Valider at secret er lang nok (mindst 32 tegn for 256 bits)
        if (secret.length() < 32) {
            logger.warn("JWT_SECRET er for kort (mindst 32 tegn anbefales for sikkerhed). Nuværende længde: {}", secret.length());
        }
        
        return secret.trim();
    }

    /**
     * Henter JWT expiration fra miljøvariabler eller .env fil
     * Default er 86400000 ms (24 timer)
     */
    public static long getJwtExpiration() {
        String expirationStr = System.getenv("JWT_EXPIRATION");
        
        if (expirationStr == null || expirationStr.isEmpty()) {
            try {
                String currentDir = System.getProperty("user.dir");
                Dotenv dotenv = Dotenv.configure()
                        .directory(currentDir)
                        .ignoreIfMissing()
                        .systemProperties()
                        .load();
                
                expirationStr = dotenv.get("JWT_EXPIRATION");
            } catch (Exception e) {
                logger.warn("Kunne ikke læse JWT_EXPIRATION fra .env: {}", e.getMessage());
            }
        }
        
        if (expirationStr != null && !expirationStr.isEmpty()) {
            try {
                return Long.parseLong(expirationStr.trim());
            } catch (NumberFormatException e) {
                logger.warn("Ugyldig JWT_EXPIRATION værdi: {}. Bruger default 86400000 ms", expirationStr);
            }
        }
        
        return 86400000; // Default: 24 timer
    }
}




