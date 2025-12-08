export enum UserRole {
  BORGER = 'BORGER',
  RÅDGIVER = 'RÅDGIVER'
}

export enum QuestionnaireType {
  MORNING = 'morning',
  EVENING = 'evening'
}

export enum QuestionType {
  TEXT = 'text',
  TIME_PICKER = 'time_picker',
  NUMERIC = 'numeric',
  SLIDER = 'slider',
  MULTIPLE_CHOICE = 'multiple_choice',
  MULTIPLE_CHOICE_MULTIPLE = 'multiple_choice_multiple'
}

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  advisorId?: string;
  advisorName?: string;
}

export interface QuestionOption {
  id: string;
  text: string; // Oversat tekst baseret på valgt sprog
  textDa?: string; // Dansk tekst
  textEn?: string; // Engelsk tekst
  isOther?: boolean; // Flag for "Andet" option
  colorCode?: 'green' | 'yellow' | 'red'; // Farvekode for denne option
}

export interface ConditionalChild {
  optionId: string;
  childQuestionId: string;
}

export interface Question {
  id: string;
  questionnaireId: string;
  text: string; // Oversat tekst baseret på valgt sprog
  textDa?: string; // Dansk tekst
  textEn?: string; // Engelsk tekst
  type: QuestionType;
  isLocked: boolean;
  order: number;
  options?: QuestionOption[];
  conditionalChildren?: ConditionalChild[];
  minValue?: number;  // For numeric og slider
  maxValue?: number;  // For numeric og slider
  minTime?: string;   // For time_picker (format: "HH:mm")
  maxTime?: string;   // For time_picker (format: "HH:mm")
  // Color code fields for advisor visualization
  hasColorCode?: boolean;
  colorCodeGreenMax?: number;  // Maksimum værdi for grøn farvekode (≤ værdi)
  colorCodeGreenMin?: number;  // Minimum værdi for grøn farvekode (≥ værdi)
  colorCodeYellowMin?: number;  // Minimum værdi for gul farvekode
  colorCodeYellowMax?: number;  // Maksimum værdi for gul farvekode
  colorCodeRedMin?: number;  // Minimum værdi for rød farvekode (≥ værdi)
  colorCodeRedMax?: number;  // Maksimum værdi for rød farvekode (< værdi)
}

export interface Questionnaire {
  id: string;
  type: QuestionnaireType;
  name: string;
}

export interface Response {
  id: string;
  userId: string;
  questionnaireId: string;
  questionnaireType?: QuestionnaireType;
  answers: Record<string, any>;
  sleepParameters?: SleepParameters;
  createdAt: Date;
}

export interface SleepParameters {
  SOL: number;
  WASO: number;
  TIB: number;
  TST: number;
}

export interface AuthResponse {
  token: string;
  username: string;
  fullName: string;
  role: UserRole;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  firstName: string;
  lastName: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
}

export interface ResponseRequest {
  questionnaireId: string;
  answers: Record<string, any>;
}

export interface NextQuestionRequest {
  questionnaireId: string;
  currentQuestionId: string;
  currentAnswers: Record<string, any>;
}


