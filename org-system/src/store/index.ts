import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  username: string;
  nickname: string;
  avatar: string;
  role: string;
}

interface AppState {
  user: User | null;
  token: string | null;
  collapsed: boolean;
  orgCount: number;
  positionCount: number;
  userCount: number;
  todayLoginCount: number;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  toggleCollapsed: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      collapsed: false,
      orgCount: 28,
      positionCount: 56,
      userCount: 1248,
      todayLoginCount: 356,
      login: async (username, password) => {
        if (username === 'admin' && password === 'admin123') {
          set({
            user: {
              username: 'admin',
              nickname: '系统管理员',
              avatar: '',
              role: 'admin',
            },
            token: 'mock-token-' + Date.now(),
          });
          return true;
        }
        return false;
      },
      logout: () => {
        set({ user: null, token: null });
      },
      toggleCollapsed: () => {
        set((state) => ({ collapsed: !state.collapsed }));
      },
    }),
    {
      name: 'app-storage',
    }
  )
);
