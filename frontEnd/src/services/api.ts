import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface SignupData {
  username: string;
  email: string;
  password: string;
}

export interface SigninData {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface UserResponse {
  id: string;
  username: string;
}

export interface InsuranceAvailable {
  company_name: string;
  insurance_available: string[];
}

export interface InsuranceObtained {
  insurance_name: string;
  insurance_date: string;
}

export interface AddInsuranceData {
  insurance_name: string;
  insurance_date: string;
}

export interface ChatMessage {
  user_id: string;
  user_message: string;
}

export interface ChatResponse {
  reply: string;
}

export const authAPI = {
  signup: async (data: SignupData): Promise<UserResponse> => {
    const response = await api.post('/signup', data);
    return response.data;
  },

  signin: async (data: SigninData): Promise<AuthResponse> => {
    const response = await api.post('/signin', data);
    return response.data;
  },
};

export const insuranceAPI = {
  getAvailable: async (): Promise<{ insurance_available: InsuranceAvailable[] }> => {
    const response = await api.get('/insurance-available');
    return response.data;
  },

  getObtained: async (): Promise<{ insurance_obtained: InsuranceObtained[] }> => {
    const response = await api.get('/insurance-obtained');
    return response.data;
  },

  addObtained: async (data: AddInsuranceData): Promise<any> => {
    const response = await api.post('/insurance-obtained', data);
    return response.data;
  },

  addInsurance: async (insuranceName: string, file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('insurance_name', insuranceName);
    formData.append('file', file);

    const response = await api.post('/add-insurance', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export const agentAPI = {
  chat: async (data: ChatMessage): Promise<ChatResponse> => {
    const response = await api.post('/agent/chat', data);
    return response.data;
  },

  clearMemory: async (): Promise<{ message: string; deleted: { main_agent_memory: number; suggestion_memory: number } }> => {
    const response = await api.delete('/clear-memory');
    return response.data;
  },

  getUserProfile: async (): Promise<{
    user_id: string;
    username: string;
    email: string;
    insurance_obtained: Array<{ insurance_name: string; insurance_date: string }>;
  }> => {
    const response = await api.get('/user-profile');
    return response.data;
  },

  getUserFeedbacks: async (): Promise<{ feedbacks: any[] }> => {
    const response = await api.get('/feedbacks');
    return response.data;
  },

  getUserClaimRequests: async (): Promise<{ claim_requests: any[] }> => {
    const response = await api.get('/claim-requests');
    return response.data;
  },

  getUserInsuranceApplications: async (): Promise<{ insurance_applications: any[] }> => {
    const response = await api.get('/insurance-applications');
    return response.data;
  },
};

export default api;