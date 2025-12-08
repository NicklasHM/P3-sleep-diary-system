# Project Scope – Questionnaire Platform  
_Version 1.3_  
_Study Project – Software Engineering, 3rd Semester_

---

## 🎯 Purpose

The purpose is to develop a web platform where citizens daily register information via morning and evening questionnaires.  
Advisors can view responses and edit the evening questionnaire.  
The morning questionnaire is **locked**, as it is used for calculating sleep parameters.

It must **not** be possible to create additional questionnaires.

Questionnaires:
- **Morning Questionnaire** → *locked, non-editable*  
- **Evening Questionnaire** → *editable, supports conditional logic*

---

# 🧩 Functional Requirements

## User Roles

### 👤 Citizen
- Can log in.
- Can complete morning and evening questionnaires as a wizard (one question at a time).
- Conditional logic in the evening questionnaire determines which questions are shown.
- Data from the morning questionnaire is used for calculating sleep parameters.

### 🧑‍💼 Advisor
- Can log in.
- Can view list of citizens + individual responses.
- Can edit **evening questionnaire**:
  - Add questions  
  - Edit text  
  - Delete questions  
  - Reorder (drag-and-drop)  
  - Add answer options  
  - Create **conditional follow-up questions**
- **Cannot** change the morning questionnaire.
- Can view automatically calculated sleep parameters from the morning questionnaire.

---

# 🌅 Locked Morning Questionnaire

The morning questionnaire consists of 9 fixed questions. These are seeded in the database and have `isLocked = true`.

Advisors **cannot**:
- change text  
- change type  
- change order  
- delete  
- add conditional logic  

### **Questions in the morning questionnaire:**

| No | Question | Type | Locked |
|----|----------|------|--------|
| 1 | What did you do in the last few hours before going to bed? | Text | ✔ |
| 2 | Yesterday I went to bed at: | Time picker | ✔ |
| 3 | I turned off the light at: | Time picker | ✔ |
| 4 | After I turned off the light, I fell asleep approximately after: | Time picker (5 min interval) | ✔ |
| 5 | I woke up approximately X times during the night. | Numeric | ✔ |
| 6 | I was awake for a total of X minutes during the night. | Numeric | ✔ |
| 7 | This morning I woke up at? | Time picker | ✔ |
| 8 | And I got up at? | Time picker | ✔ |
| 9 | A few hours after I got up, I felt? (1–5) | Slider | ✔ |

---

# 📊 Sleep Parameters (automatically calculated)

The backend calculates the following from the morning questionnaire:

### **SOL – Sleep Onset Latency**  
Time from going to bed → to falling asleep.

### **WASO – Wake After Sleep Onset**  
Total time awake after sleep onset.

### **TIB – Time in Bed**  
Time in bed from bedtime → getting up.

### **TST – Total Sleep Time**  
Formula:
```
TST = TIB - SOL - WASO
```

Parameters are stored in `responses.sleepParameters`.

---

# 🌙 Evening Questionnaire (editable)

The evening questionnaire is flexible and can be edited by advisors.

## Capabilities:
- Add questions  
- Edit questions  
- Remove questions  
- Drag-and-drop reordering  
- Add answer options  
- Create **conditional logic**

---

# 🔄 Conditional Logic (only in evening questionnaire)

The advisor must be able to create questions that are only shown if the citizen selects a specific answer option.

### Example:
Question 1:  
*"Did you drink coffee after 6 PM?"*  
- Yes → show question 2  
- No → continue

Question 2 (conditional):  
*"How many cups did you drink?"*

## The advisor must be able to:
- Click "Add follow-up question" at an answer option  
- Create a child question directly  
- Create deep chains (nested logic)

## Data Model:
```json
"conditionalChildren": [
  {
    "optionId": "opt1",
    "childQuestionId": "q_new"
  }
]
```

## Limitations:
- Conditional logic can **only** be created in the evening questionnaire  
- The morning questionnaire **cannot** have conditional logic  
- Conditional chains are executed automatically in the backend

---

# 🗄️ Technical Architecture

## Backend
- Java 17  
- Spring Boot  
- Spring Web  
- Spring Data MongoDB  
- Spring Security (JWT)

## Database Collections
- `questionnaires`
- `questions`
- `responses`
- `users`

### Locked example:
```json
{
  "_id": "q7",
  "questionnaireId": "morning",
  "text": "This morning I woke up at?",
  "type": "time_picker",
  "isLocked": true,
  "order": 7
}
```

---

# 🔌 API Endpoints

## Citizen
- `GET /api/questionnaires/{type}/start`
- `POST /api/responses`
- `POST /api/responses/next`

## Advisor
- `GET /api/questionnaires/{type}`
- `POST /api/questions` *(evening questionnaire)*
- `PUT /api/questions/{id}` *(forbidden for locked)*
- `DELETE /api/questions/{id}` *(forbidden for locked)*
- `POST /api/questions/{id}/conditional`
- `GET /api/users/{id}/sleep-data`

The backend returns **403 Forbidden** for changes to locked questions.

---

# 🎨 UI Scope

## Citizen UI
- Wizard-style (one question at a time).  
- Time pickers and sliders.  
- Conditional logic controls the next question.

## Advisor UI
- Overview of citizens.  
- History view.  
- Evening questionnaire editor:
  - Text editing  
  - Multiple choice editor  
  - Drag-and-drop  
  - Conditional logic building (branching)  
- Morning questionnaire is read-only.

---

# 🧪 Acceptance Criteria
- Locked morning questionnaire seeded.  
- Sleep parameters calculated correctly.  
- Evening questionnaire can be edited and conditional logic works.  
- Backend blocks all changes to locked questions.  
- UI shows morning questionnaire in read-only mode.  
- All flows work in Chrome/Firefox.  

---

# 📅 Iteration Plan
1. Login + user roles  
2. Seed morning questionnaire (locked)  
3. Editor for evening questionnaire  
4. Conditional logic builder  
5. Citizen flow  
6. Sleep parameter calculation  
7. Advisor UI  
8. Tests + styling

---

# ✔️ Completion

This document describes the entire platform's functionality, including the locked morning questionnaire, editable evening questionnaire, conditional logic, and sleep parameter calculation.
