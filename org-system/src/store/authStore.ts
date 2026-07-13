import { create } from 'zustand';
import type { AuthLog, AuthLogType, AuthLogStatus, User } from '@/types';
import { authLogs } from '@/mock/authLogData';
import { users } from '@/mock/userData';
import { generateUUID } from '@/utils/idGenerator';
import { getNow } from '@/utils/dateUtils';

const getUserAgent = (): string => {
  if (typeof navigator !== 'undefined') {
    return navigator.userAgent;
  }
  return 'Mozilla/5.0 (Unknown)';
};

interface AuthState {
  logs: AuthLog[];
  currentUser: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  failCount: Record<string, number>;

  login: (username: string, password: string) => { success: boolean; message?: string; user?: User };
  logout: (userId: string, username: string) => void;
  addLog: (log: Omit<AuthLog, 'id' | 'createdAt'>) => AuthLog;

  getLogs: (filters?: {
    userId?: string;
    username?: string;
    type?: AuthLogType;
    status?: AuthLogStatus;
    startTime?: string;
    endTime?: string;
  }) => AuthLog[];
  getLogById: (id: string) => AuthLog | undefined;
  getLoginLogs: (userId?: string) => AuthLog[];
  getFailLogs: (userId?: string) => AuthLog[];
  getLogsByDateRange: (startDate: string, endDate: string) => AuthLog[];

  getFailCount: (userId: string) => number;
  incrementFailCount: (userId: string) => number;
  resetFailCount: (userId: string) => void;

  searchLogs: (keyword: string) => AuthLog[];
  clearLogs: () => void;

  getStatistics: () => {
    total: number;
    success: number;
    fail: number;
    loginCount: number;
    logoutCount: number;
    todayCount: number;
  };
}

export const useAuthStore = create<AuthState>((set, get) => ({
  logs: authLogs,
  currentUser: null,
  isAuthenticated: false,
  loading: false,
  failCount: {},

  login: (username, _password) => {
    const user = users.find((u: User) => u.username === username);
    const ua = getUserAgent();

    if (!user) {
      get().addLog({
        userId: 'unknown',
        username,
        type: 'LOGIN',
        status: 'FAIL',
        ip: '127.0.0.1',
        userAgent: ua,
        failReason: '用户名不存在',
      });
      return { success: false, message: '用户名或密码错误' };
    }

    if (user.status === 'DISABLED') {
      get().addLog({
        userId: user.id,
        username: user.username,
        type: 'LOGIN',
        status: 'FAIL',
        ip: '127.0.0.1',
        userAgent: ua,
        failReason: '账号已禁用',
      });
      return { success: false, message: '账号已被禁用' };
    }

    if (user.status === 'CANCELLED') {
      get().addLog({
        userId: user.id,
        username: user.username,
        type: 'LOGIN',
        status: 'FAIL',
        ip: '127.0.0.1',
        userAgent: ua,
        failReason: '账号已注销',
      });
      return { success: false, message: '账号已注销' };
    }

    if (user.status === 'LOCKED') {
      return { success: false, message: '账号已锁定，请稍后再试' };
    }

    set({ currentUser: user, isAuthenticated: true });
    get().resetFailCount(user.id);
    get().addLog({
      userId: user.id,
      username: user.username,
      type: 'LOGIN',
      status: 'SUCCESS',
      ip: '127.0.0.1',
      userAgent: ua,
    });

    return { success: true, user };
  },

  logout: (userId, username) => {
    get().addLog({
      userId,
      username,
      type: 'LOGOUT',
      status: 'SUCCESS',
      ip: '127.0.0.1',
      userAgent: getUserAgent(),
    });
    set({ currentUser: null, isAuthenticated: false });
  },

  addLog: (log) => {
    const newLog: AuthLog = {
      ...log,
      id: generateUUID(),
      createdAt: getNow(),
    };
    set((state) => ({ logs: [newLog, ...state.logs] }));
    return newLog;
  },

  getLogs: (filters) => {
    let result = [...get().logs];

    if (filters?.userId) {
      result = result.filter((l) => l.userId === filters.userId);
    }
    if (filters?.username) {
      result = result.filter((l) => l.username === filters.username);
    }
    if (filters?.type) {
      result = result.filter((l) => l.type === filters.type);
    }
    if (filters?.status) {
      result = result.filter((l) => l.status === filters.status);
    }
    if (filters?.startTime) {
      result = result.filter((l) => new Date(l.createdAt) >= new Date(filters.startTime!));
    }
    if (filters?.endTime) {
      result = result.filter((l) => new Date(l.createdAt) <= new Date(filters.endTime!));
    }

    return result;
  },

  getLogById: (id) => get().logs.find((l) => l.id === id),

  getLoginLogs: (userId) => {
    return get().getLogs({ type: 'LOGIN', userId });
  },

  getFailLogs: (userId) => {
    return get().getLogs({ status: 'FAIL', userId });
  },

  getLogsByDateRange: (startDate, endDate) => {
    return get().getLogs({ startTime: startDate, endTime: endDate });
  },

  getFailCount: (userId) => get().failCount[userId] || 0,

  incrementFailCount: (userId) => {
    const current = get().failCount[userId] || 0;
    const next = current + 1;
    set((state) => ({
      failCount: { ...state.failCount, [userId]: next },
    }));
    return next;
  },

  resetFailCount: (userId) => {
    set((state) => {
      const newFailCount = { ...state.failCount };
      delete newFailCount[userId];
      return { failCount: newFailCount };
    });
  },

  searchLogs: (keyword) => {
    const kw = keyword.toLowerCase();
    return get().logs.filter(
      (l) =>
        l.username.toLowerCase().includes(kw) ||
        l.ip.includes(kw) ||
        (l.failReason && l.failReason.toLowerCase().includes(kw))
    );
  },

  clearLogs: () => {
    set({ logs: [] });
  },

  getStatistics: () => {
    const logs = get().logs;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return {
      total: logs.length,
      success: logs.filter((l) => l.status === 'SUCCESS').length,
      fail: logs.filter((l) => l.status === 'FAIL').length,
      loginCount: logs.filter((l) => l.type === 'LOGIN').length,
      logoutCount: logs.filter((l) => l.type === 'LOGOUT').length,
      todayCount: logs.filter((l) => new Date(l.createdAt) >= today).length,
    };
  },
}));

export default useAuthStore;
