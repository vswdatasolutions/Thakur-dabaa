
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, AuthState, Theme } from './types';

// Auth Store
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      token: null,
      login: (user: User) => {
        set({ user, isAuthenticated: true, token: user.token });
      },
      logout: () => {
        set({ user: null, isAuthenticated: false, token: null });
      },
      initializeAuth: () => {
        // This is primarily for rehydrating from localStorage if needed on app load
        const storedState = JSON.parse(
          (createJSONStorage(() => localStorage).getItem('auth-store')) || '{}'
        ).state;
        if (storedState && storedState.user && storedState.token) {
          set({ user: storedState.user, isAuthenticated: true, token: storedState.token });
        }
      },
    }),
    {
      name: 'auth-store', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
);

// Theme Store
interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'light', // default theme
      setTheme: (theme: Theme) => set({ theme }),
      toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
    }),
    {
      name: 'theme-store', // name of the item in the storage
      storage: createJSONStorage(() => localStorage),
    }
  )
);
