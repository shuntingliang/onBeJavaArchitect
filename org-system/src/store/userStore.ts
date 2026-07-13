import { create } from 'zustand';
import type { User, UserStatus } from '@/types';
import { users } from '@/mock/userData';
import { generateUUID, generateUserCode } from '@/utils/idGenerator';
import { getNow } from '@/utils/dateUtils';

interface UserState {
  users: User[];
  selectedUserId: string | null;
  loading: boolean;
  setSelectedUserId: (id: string | null) => void;
  getUserById: (id: string) => User | undefined;
  getUserByUsername: (username: string) => User | undefined;
  getUsersByOrgNode: (orgNodeId: string) => User[];
  getUsersByPosition: (positionId: string) => User[];
  getUsersByStatus: (status: UserStatus) => User[];
  addUser: (user: Omit<User, 'id' | 'code' | 'createdAt' | 'updatedAt'>) => User;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  lockUser: (id: string, reason: string) => void;
  unlockUser: (id: string) => void;
  disableUser: (id: string) => void;
  enableUser: (id: string) => void;
  cancelUser: (id: string) => void;
  changePassword: (id: string, newPassword: string) => boolean;
  searchUsers: (keyword: string) => User[];
  batchUpdateStatus: (ids: string[], status: UserStatus) => void;
  getNextCode: () => string;
}

export const useUserStore = create<UserState>((set, get) => ({
  users: users,
  selectedUserId: null,
  loading: false,

  setSelectedUserId: (id) => set({ selectedUserId: id }),

  getUserById: (id) => get().users.find((u) => u.id === id),

  getUserByUsername: (username) => get().users.find((u) => u.username === username),

  getUsersByOrgNode: (orgNodeId) => get().users.filter((u) => u.orgNodeId === orgNodeId),

  getUsersByPosition: (positionId) =>
    get().users.filter((u) => u.positionIds.includes(positionId)),

  getUsersByStatus: (status) => get().users.filter((u) => u.status === status),

  getNextCode: () => {
    const maxCode = get().users.reduce((max, u) => {
      const num = parseInt(u.code.replace('USR_', ''), 10);
      return num > max ? num : max;
    }, 0);
    return generateUserCode(maxCode + 1);
  },

  addUser: (user) => {
    const newUser: User = {
      ...user,
      id: generateUUID(),
      code: get().getNextCode(),
      status: user.status || 'NORMAL',
      createdAt: getNow(),
      updatedAt: getNow(),
    };
    set((state) => ({ users: [...state.users, newUser] }));
    return newUser;
  },

  updateUser: (id, updates) => {
    set((state) => ({
      users: state.users.map((u) =>
        u.id === id ? { ...u, ...updates, updatedAt: getNow() } : u
      ),
    }));
  },

  deleteUser: (id) => {
    set((state) => ({
      users: state.users.filter((u) => u.id !== id),
      selectedUserId: state.selectedUserId === id ? null : state.selectedUserId,
    }));
  },

  lockUser: (id, reason) => {
    get().updateUser(id, {
      status: 'LOCKED' as UserStatus,
      lockReason: reason,
      lockTime: getNow(),
    });
  },

  unlockUser: (id) => {
    get().updateUser(id, {
      status: 'NORMAL' as UserStatus,
      lockReason: undefined,
      lockTime: undefined,
    });
  },

  disableUser: (id) => {
    get().updateUser(id, { status: 'DISABLED' as UserStatus });
  },

  enableUser: (id) => {
    get().updateUser(id, { status: 'NORMAL' as UserStatus });
  },

  cancelUser: (id) => {
    get().updateUser(id, { status: 'CANCELLED' as UserStatus });
  },

  changePassword: (_id, _newPassword) => {
    return true;
  },

  searchUsers: (keyword) => {
    const kw = keyword.toLowerCase();
    return get().users.filter(
      (u) =>
        u.name.toLowerCase().includes(kw) ||
        u.username.toLowerCase().includes(kw) ||
        u.code.toLowerCase().includes(kw) ||
        (u.email && u.email.toLowerCase().includes(kw)) ||
        (u.phone && u.phone.includes(kw))
    );
  },

  batchUpdateStatus: (ids, status) => {
    set((state) => ({
      users: state.users.map((u) =>
        ids.includes(u.id) ? { ...u, status, updatedAt: getNow() } : u
      ),
    }));
  },
}));

export default useUserStore;
