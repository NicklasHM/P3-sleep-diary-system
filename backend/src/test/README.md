# Test Documentation

This document describes the test structure for the Questionnaire Platform project.

## Test Structure

Tests are organized into three categories:

```
src/test/java/com/questionnaire/
├── unit/                          # Unit tests (isolated tests)
│   ├── utils/
│   │   └── AnswerParserTest.java
│   └── service/
│       └── SleepDataExtractorTest.java
│
├── integration/                   # Integration tests
│   ├── strategy/
│   │   ├── ConditionalLogicFactoryIntegrationTest.java
│   │   └── ConditionalLogicStrategyIntegrationTest.java
│   ├── validation/
│   │   ├── QuestionnaireValidatorIntegrationTest.java
│   │   └── TemplateMethodPatternIntegrationTest.java
│   └── flow/
│       └── ResponseFlowIntegrationTest.java
│
└── system/                        # System test
    └── QuestionnaireSystemTest.java
```

## Test Categories

### 1. Unit Tests (`unit/`)

**Purpose:** Test isolated classes and methods without dependencies.

**Examples:**
- `AnswerParserTest` - Tests parsing of different data types
- `SleepDataExtractorTest` - Tests extraction of sleep data

**Run tests:**
```bash
mvn test -Dtest=AnswerParserTest
mvn test -Dtest=SleepDataExtractorTest
```

### 2. Integration Tests (`integration/`) - MAIN FOCUS

**Purpose:** Test how OOP principles work together in practice.

#### Strategy Pattern Tests
- `ConditionalLogicFactoryIntegrationTest` - Tests Factory Pattern that returns Strategy implementations
- `ConditionalLogicStrategyIntegrationTest` - Tests Strategy Pattern in practice

**OOP principles tested:**
- **Strategy Pattern:** Different strategies implement the same interface
- **Polymorphism:** Same interface, different behavior
- **Factory Pattern:** Factory returns correct strategy based on type

#### Factory + Template Method Pattern Tests
- `QuestionnaireValidatorIntegrationTest` - Tests Factory Pattern + Inheritance
- `TemplateMethodPatternIntegrationTest` - Tests Template Method Pattern

**OOP principles tested:**
- **Factory Pattern:** QuestionnaireValidatorFactory returns correct validator
- **Template Method Pattern:** Base class defines algorithm structure, subclasses implement specific logic
- **Inheritance:** MorningQuestionnaireValidator extends QuestionnaireValidator
- **Polymorphism:** Different validators, same interface

#### Response Flow Tests
- `ResponseFlowIntegrationTest` - Tests entire flow from Service to Repository

**OOP principles tested:**
- Integration of all patterns: Strategy + Factory + Template Method
- End-to-end flow through the application

**Run tests:**
```bash
# All integration tests
mvn test -Dtest=*IntegrationTest

# Specific integration test
mvn test -Dtest=ConditionalLogicFactoryIntegrationTest
```

### 3. System Test (`system/`)

**Purpose:** Test the application as a whole through API endpoints.

**Examples:**
- `QuestionnaireSystemTest` - Tests API endpoints end-to-end

**Run tests:**
```bash
mvn test -Dtest=QuestionnaireSystemTest
```

## Run All Tests

```bash
# Run all tests
mvn test

## OOP Principles Tested

### Strategy Pattern
- **Where:** `ConditionalLogicFactory` + `ConditionalLogicStrategy` implementations
- **Tests:** `ConditionalLogicFactoryIntegrationTest`, `ConditionalLogicStrategyIntegrationTest`
- **Demonstrates:** Polymorphism - same interface, different behavior

### Factory Pattern
- **Where:** `ConditionalLogicFactory`, `QuestionnaireValidatorFactory`, `ValidatorFactory`
- **Tests:** `ConditionalLogicFactoryIntegrationTest`, `QuestionnaireValidatorIntegrationTest`
- **Demonstrates:** Centralized object creation based on type

### Template Method Pattern
- **Where:** `QuestionnaireValidator` (abstract class) + subclasses
- **Tests:** `TemplateMethodPatternIntegrationTest`
- **Demonstrates:** Inheritance - base class defines algorithm, subclasses implement specific logic

### Inheritance
- **Where:** `MorningQuestionnaireValidator extends QuestionnaireValidator`
- **Tests:** `TemplateMethodPatternIntegrationTest`, `QuestionnaireValidatorIntegrationTest`
- **Demonstrates:** Subclass extends base class functionality

### Polymorphism
- **Where:** All Strategy and Validator interfaces
- **Tests:** All integration tests
- **Demonstrates:** Same interface, different implementations

## Test Best Practices

1. **Use `@DisplayName`** for readable test names
2. **Arrange-Act-Assert (AAA)** structure in all tests
3. **One assertion per test** when possible
4. **Test both happy path and edge cases**
5. **Use `@BeforeEach`** for setup
6. **Use `@ExtendWith(MockitoExtension.class)`** for Mockito tests

## Test Coverage

Tests focus on:
- ✅ OOP principles (Strategy, Factory, Template Method, Inheritance, Polymorphism)
- ✅ Integration between components
- ✅ End-to-end flows
- ✅ Error handling

## Test Isolation and Cleanup

Tests implement automatic cleanup to ensure test isolation:

- **ResponseFlowIntegrationTest**: Deletes all responses and test users after each test
- **QuestionnaireSystemTest**: Deletes test users after each test
- This ensures test data does not contaminate the production environment or appear in the UI

**Important**: The test user (`testuser`) is automatically deleted after each test run, so it does not appear in the UI.

## Notes

- Integration tests require Spring Boot context (use `@SpringBootTest`)
- System test requires MockMvc for API testing
- Some tests may require database setup (MongoDB)
- Tests can be adjusted based on actual database structure
- **Test data cleanup**: All test data (responses and test users) is automatically deleted after tests
