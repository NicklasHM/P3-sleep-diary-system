package com.questionnaire.config;

import com.mongodb.ConnectionString;
import com.mongodb.MongoClientSettings;
import com.mongodb.ServerApi;
import com.mongodb.ServerApiVersion;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Configuration
public class MongoConfig {

    private static final Logger logger = LoggerFactory.getLogger(MongoConfig.class);

    @Bean
    @Primary
    public MongoClient mongoClient() {
        String connectionString = getMongoConnectionString();
        
        ServerApi serverApi = ServerApi.builder()
                .version(ServerApiVersion.V1)
                .build();

        MongoClientSettings settings = MongoClientSettings.builder()
                .applyConnectionString(new ConnectionString(connectionString))
                .serverApi(serverApi)
                .build();

        logger.info("MongoDB client configured successfully");
        return MongoClients.create(settings);
    }

    private String getMongoConnectionString() {
        // Prøv først environment variable
        String mongoUri = System.getenv("MONGODB_URI");
        
        if (mongoUri == null || mongoUri.isEmpty()) {
            // Prøv at læse fra .env fil i backend mappen
            try {
                String currentDir = System.getProperty("user.dir");
                logger.info("Læser .env fil fra: {}", currentDir);
                
                Dotenv dotenv = Dotenv.configure()
                        .directory(currentDir)
                        .ignoreIfMissing()
                        .systemProperties()
                        .load();
                
                mongoUri = dotenv.get("MONGODB_URI");
                
                // Hvis der stadig er null, prøv at læse direkte fra filen
                if (mongoUri == null || mongoUri.isEmpty()) {
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
                                if (line.startsWith("MONGODB_URI=")) {
                                    mongoUri = line.substring("MONGODB_URI=".length()).trim();
                                    // Fjern quotes hvis de findes
                                    if (mongoUri.startsWith("\"") && mongoUri.endsWith("\"")) {
                                        mongoUri = mongoUri.substring(1, mongoUri.length() - 1);
                                    }
                                    if (mongoUri.startsWith("'") && mongoUri.endsWith("'")) {
                                        mongoUri = mongoUri.substring(1, mongoUri.length() - 1);
                                    }
                                    break;
                                }
                            }
                        } catch (Exception fileEx) {
                            logger.warn("Kunne ikke læse .env fil direkte: {}", fileEx.getMessage());
                        }
                    }
                }
                
                if (mongoUri != null && !mongoUri.isEmpty()) {
                    logger.info("MongoDB URI fundet i .env fil");
                }
            } catch (Exception e) {
                logger.error("Kunne ikke indlæse .env fil: {}", e.getMessage());
                logger.error("Detaljeret fejl: ", e);
            }
        } else {
            logger.info("MongoDB URI fundet i environment variable");
        }
        
        if (mongoUri == null || mongoUri.isEmpty()) {
            throw new IllegalStateException("MONGODB_URI skal være sat i .env filen i backend mappen eller som environment variable");
        }
        
        return mongoUri.trim();
    }
}

