import { create } from 'zustand';

interface AuthState {
  user: any;
  token: string | null;
  login: (user: any, token: string) => void;
  logout: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  token: null,

  login: (user, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));

    set({
      user,
      token,
    });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    set({
      user: null,
      token: null,
    });
  },
}));
