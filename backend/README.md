# Questionnaire Platform - Backend

Backend implementation in Java 17 with Spring Boot 3.2.0 and MongoDB.

## Requirements

- Java 17 or newer
- Maven 3.6+
- MongoDB (cloud or local)

## Setup

1. Create a `.env` file in the `backend/` directory with the following keys (placér filen i `backend/`, UTF-8 uden BOM):

```env
MONGODB_URI=your-mongodb-uri
JWT_SECRET=your-secret-key-minimum-32-characters-long
JWT_EXPIRATION=86400000
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

**Note:** `JWT_SECRET` must be at least 32 characters long (256 bits) for security. `JWT_EXPIRATION` is in milliseconds (default: 86400000 = 24 hours).

2. Build the project:

```bash
cd backend
mvn clean install
```

3. Run the application:

```bash
mvn spring-boot:run
```

The backend runs on `http://localhost:8080`

**Dotenv indlæsning:** `MongoConfig` forsøger først environment variabler, derefter `.env` i `backend/`. Filen skal ligge i samme mappe som `pom.xml` og må ikke indeholde BOM.

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register user
- `GET /api/auth/check-username?username={username}` - Check if username exists

### Questionnaires
- `GET /api/questionnaires/{type}` - Get questionnaire (morning/evening)
- `GET /api/questionnaires/{type}/start` - Start questionnaire (returns first question)

### Questions
- `GET /api/questions/{id}` - Get question by ID
- `GET /api/questions?questionnaireId={id}` - Get all questions for a questionnaire
- `POST /api/questions` - Create question (evening questionnaire only)
- `PUT /api/questions/{id}` - Update question (403 if locked)
- `DELETE /api/questions/{id}` - Delete question (403 if locked)
- `POST /api/questions/{id}/conditional` - Add conditional child question
- `DELETE /api/questions/{id}/conditional` - Remove conditional child
- `PUT /api/questions/{id}/conditional/order` - Update conditional children order

### Responses
- `POST /api/responses` - Save response
- `POST /api/responses/next` - Get next question
- `GET /api/responses?userId={id}&questionnaireId={id}` - Get responses
- `GET /api/responses/check-today?questionnaireType={type}` - Check if response exists for today

### Users
- `GET /api/users/citizens` - Get all citizens (advisor only)
- `GET /api/users/advisors` - Get all advisors (advisor only)
- `GET /api/users/{id}/sleep-data` - Get sleep parameters for user
- `PUT /api/users/{id}/assign-advisor` - Assign advisor to citizen

## Database Seeding

On startup, the morning questionnaire is automatically seeded with 9 locked questions via `DatabaseSeeder`.

## Security

- JWT token authentication
- Password hashing with BCrypt
- CORS configured via `CORS_ALLOWED_ORIGINS` environment variable
- Role-based access control (Citizen/Advisor)
- Locked questions cannot be modified (403 Forbidden)

## Project Structure

```
backend/
├── src/main/java/com/questionnaire/
│   ├── model/          # Domain entities
│   ├── repository/     # MongoDB repositories
│   ├── service/        # Business logic
│   ├── controller/     # REST controllers
│   ├── security/       # JWT and Spring Security
│   ├── config/         # Configuration (MongoDB, Seeder, JWT)
│   ├── dto/            # Data Transfer Objects
│   └── exception/      # Exception handling
├── src/test/java/      # Test classes
└── pom.xml
```

## Environment Variables

The application uses environment variables or a `.env` file for configuration:

- `MONGODB_URI` - MongoDB connection string (required)
- `JWT_SECRET` - Secret key for JWT tokens, minimum 32 characters (required)
- `JWT_EXPIRATION` - Token expiration time in milliseconds (optional, default: 86400000)
- `CORS_ALLOWED_ORIGINS` - Comma-separated list of allowed origins (optional, defaults to localhost)

## Building for Production

```bash
mvn clean package -DskipTests
```

This creates a JAR file in `target/questionnaire-platform-1.0.0.jar` that can be run with:

```bash
java -jar target/questionnaire-platform-1.0.0.jar
```

Eksempel på kørsel med miljøvariabler (erstatt værdier med egne):
```bash
MONGODB_URI=<your-uri> JWT_SECRET=<your-secret> \
JWT_EXPIRATION=86400000 CORS_ALLOWED_ORIGINS=http://localhost:3000 \
java -jar target/questionnaire-platform-1.0.0.jar
```
