import axios from 'axios';
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  Questionnaire,
  Question,
  Response,
  ResponseRequest,
  NextQuestionRequest,
  SleepParameters,
  User
} from '../types';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401/403 responses globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Clear auth data
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      localStorage.removeItem('fullName');
      localStorage.removeItem('role');
      
      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  checkUsername: async (username: string): Promise<{ exists: boolean }> => {
    const response = await api.get<{ exists: boolean }>(`/auth/check-username?username=${encodeURIComponent(username)}`);
    return response.data;
  },
};

// Questionnaire API
export const questionnaireAPI = {
  getQuestionnaire: async (type: string): Promise<Questionnaire> => {
    const response = await api.get<Questionnaire>(`/questionnaires/${type}`);
    return response.data;
  },

  startQuestionnaire: async (type: string, language: string = 'da'): Promise<Question[]> => {
    const response = await api.get<Question[]>(`/questionnaires/${type}/start?language=${language}`);
    return response.data;
  },
};

// Question API
export const questionAPI = {
  getQuestion: async (id: string, language: string = 'da', includeDeleted: boolean = false): Promise<Question> => {
    const response = await api.get<Question>(`/questions/${id}?language=${language}&includeDeleted=${includeDeleted}`);
    return response.data;
  },

  getQuestions: async (questionnaireId: string, language: string = 'da', includeDeleted: boolean = false): Promise<Question[]> => {
    const response = await api.get<Question[]>(`/questions?questionnaireId=${questionnaireId}&language=${language}&includeDeleted=${includeDeleted}`);
    return response.data;
  },

  createQuestion: async (question: Question): Promise<Question> => {
    const response = await api.post<Question>('/questions', question);
    return response.data;
  },

  updateQuestion: async (id: string, question: Question): Promise<Question> => {
    const response = await api.put<Question>(`/questions/${id}`, question);
    return response.data;
  },

  deleteQuestion: async (id: string): Promise<void> => {
    await api.delete(`/questions/${id}`);
  },

  addConditionalChild: async (
    questionId: string,
    optionId: string,
    childQuestionId: string
  ): Promise<Question> => {
    const response = await api.post<Question>(
      `/questions/${questionId}/conditional`,
      { optionId, childQuestionId }
    );
    return response.data;
  },

  removeConditionalChild: async (
    questionId: string,
    optionId: string,
    childQuestionId: string
  ): Promise<Question> => {
    const response = await api.delete<Question>(
      `/questions/${questionId}/conditional`,
      { data: { optionId, childQuestionId } }
    );
    return response.data;
  },

  updateConditionalChildrenOrder: async (
    questionId: string,
    optionId: string,
    childQuestionIds: string[]
  ): Promise<Question> => {
    const response = await api.put<Question>(
      `/questions/${questionId}/conditional/order`,
      { optionId, childQuestionIds }
    );
    return response.data;
  },
};

// Response API
export const responseAPI = {
  saveResponse: async (data: ResponseRequest): Promise<Response> => {
    const response = await api.post<Response>('/responses', data);
    return response.data;
  },

  getNextQuestion: async (data: NextQuestionRequest, language: string = 'da'): Promise<Question | null> => {
    try {
      const response = await api.post<Question>(`/responses/next?language=${language}`, data);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 204) {
        return null;
      }
      // Hvis backend returnerer en valideringsfejl, kast den videre med fejlbeskeden
      if (error.response?.data?.error) {
        const validationError = new Error(error.response.data.error);
        (validationError as any).response = error.response;
        throw validationError;
      }
      throw error;
    }
  },

  getResponses: async (userId: string, questionnaireId?: string): Promise<Response[]> => {
    const params = new URLSearchParams({ userId });
    if (questionnaireId) {
      params.append('questionnaireId', questionnaireId);
    }
    const response = await api.get<Response[]>(`/responses?${params.toString()}`);
    return response.data;
  },

  checkResponseForToday: async (questionnaireType: string): Promise<{ hasResponse: boolean }> => {
    const response = await api.get<{ hasResponse: boolean }>(
      `/responses/check-today?questionnaireType=${questionnaireType}`
    );
    return response.data;
  },
};

// User API
export const userAPI = {
  getAllCitizens: async (): Promise<User[]> => {
    const response = await api.get<User[]>('/users/citizens');
    return response.data;
  },

  getAllAdvisors: async (): Promise<User[]> => {
    const response = await api.get<User[]>('/users/advisors');
    return response.data;
  },

  assignAdvisor: async (citizenId: string, advisorId: string | null): Promise<User> => {
    const response = await api.put<User>(`/users/${citizenId}/assign-advisor`, { advisorId });
    return response.data;
  },

  getSleepData: async (userId: string): Promise<{
    sleepData: Array<{
      responseId: string;
      createdAt: Date;
      sleepParameters: SleepParameters;
    }>;
  }> => {
    const response = await api.get(`/users/${userId}/sleep-data`);
    return response.data;
  },
};

export default api;

