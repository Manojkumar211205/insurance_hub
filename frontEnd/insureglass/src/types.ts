export type ViewState = 'signup' | 'login' | 'coverage' | 'upload' | 'assistant';

export interface User {
  username?: string;
  email?: string;
  isLoggedIn: boolean;
}

export interface Policy {
  id: string;
  name: string;
  description: string;
  logo: string;
  types: string[];
}
