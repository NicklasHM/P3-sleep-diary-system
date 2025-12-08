# Questionnaire Platform

A web-based platform for daily sleep and wellness tracking through morning and evening questionnaires. Citizens can complete questionnaires while advisors can view responses and edit the evening questionnaire.

## Overview

The platform consists of two main questionnaires:
- **Morning Questionnaire** - Locked, non-editable, used for sleep parameter calculations
- **Evening Questionnaire** - Editable by advisors, supports conditional logic

## Features

### Citizen Features
- User authentication (login/registration)
- Daily morning and evening questionnaire completion
- Wizard-style interface (one question at a time)
- Conditional logic support in evening questionnaire
- Automatic sleep parameter calculation from morning responses

### Advisor Features
- User authentication
- View all citizens and their responses
- Edit evening questionnaire:
  - Add, edit, and delete questions
  - Drag-and-drop reordering
  - Add answer options
  - Create conditional follow-up questions
- View automatically calculated sleep parameters
- Read-only view of locked morning questionnaire

## Technology Stack

### Backend
- Java 17
- Spring Boot 3.2.0
- Spring Data MongoDB
- Spring Security (JWT authentication)
- MongoDB

### Frontend
- React 18
- TypeScript
- Vite
- React Router
- Axios
- @dnd-kit (drag-and-drop)

## Project Structure

```
Projekt/
├── backend/          # Spring Boot backend
├── frontend/         # React TypeScript frontend
└── README.md         # This file
```

## Getting Started

### Prerequisites
- Java 17 or newer
- Maven 3.6+
- Node.js 20+
- MongoDB (cloud or local)

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a `.env` file with the following content:
```env
MONGODB_URI
JWT_SECRET
JWT_EXPIRATION
CORS_ALLOWED_ORIGINS
```

3. Build the project:
```bash
mvn clean install
```

4. Run the application:
```bash
mvn spring-boot:run
```

The backend will run on `http://localhost:8080`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

For production build:
```bash
npm run build
```

The frontend will run on `http://localhost:3000` (proxy for `/api` til `http://localhost:8080`)
For production kan API-url sættes via `VITE_API_URL` (fx i `.env.production`).

## API Documentation

See [backend/README.md](backend/README.md) for detailed API endpoint documentation.

## Testing

Backend tests:
- `mvn test`
- `mvn test -Dtest=*IntegrationTest` (integration)
- `mvn test -Dtest=QuestionnaireSystemTest` (system)

Frontend lint (ingen krav om frontend test):
- `npm run lint`

Se [backend/src/test/README.md](backend/src/test/README.md) for detaljer om teststruktur.

## License

This project is part of a Aalborg University course project.




