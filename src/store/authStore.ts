import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, LoginCredentials } from '../types';

// Mock users for demonstration
const MOCK_USERS: (User & { password: string })[] = [
  {
    id: '1',
    name: 'Dr. Admin',
    email: 'admin@hospital.com',
    role: 'admin',
    token: 'mock-admin-token',
    password: 'admin123',
  },
  {
    id: '2',
    name: 'Nurse Ana',
    email: 'nurse@hospital.com',
    role: 'nurse',
    token: 'mock-nurse-token',
    password: 'nurse123',
  },
];

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async ({ email, password }: LoginCredentials) => {
        set({ isLoading: true, error: null });
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 800));

        const found = MOCK_USERS.find(
          (u) => u.email === email && u.password === password
        );

        if (!found) {
          set({ isLoading: false, error: 'Email atau password salah' });
          return;
        }

        const { password: _pw, ...user } = found;
        set({ user, isAuthenticated: true, isLoading: false, error: null });
      },

      logout: () => {
        set({ user: null, isAuthenticated: false, error: null });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'sibor-auth',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
