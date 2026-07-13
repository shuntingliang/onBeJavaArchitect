import { create } from 'zustand';
import type { UserToken, TokenStatus } from '@/types';
import { userTokens } from '@/mock/tokenData';
import { generateUUID } from '@/utils/idGenerator';
import { getNow } from '@/utils/dateUtils';

interface TokenState {
  tokens: UserToken[];

  getTokensByUser: (userId: string) => UserToken[];
  refreshToken: (id: string) => UserToken | undefined;
  revokeToken: (id: string) => void;
  revokeUserTokens: (userId: string) => void;
}

export const useTokenStore = create<TokenState>((set, get) => ({
  tokens: userTokens,

  getTokensByUser: (userId) => {
    return get().tokens.filter((t) => t.userId === userId);
  },

  refreshToken: (id) => {
    let refreshed: UserToken | undefined;
    set((state) => ({
      tokens: state.tokens.map((t) => {
        if (t.id === id) {
          const now = getNow();
          const newExpiredAt = new Date();
          newExpiredAt.setDate(newExpiredAt.getDate() + 30);
          refreshed = {
            ...t,
            token: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify({ sub: t.username, exp: Math.floor(newExpiredAt.getTime() / 1000) }))}.${generateUUID().slice(0, 12)}`,
            status: 'ACTIVE',
            expiredAt: newExpiredAt.toISOString(),
            lastUsedAt: now,
          };
          return refreshed;
        }
        return t;
      }),
    }));
    return refreshed;
  },

  revokeToken: (id) => {
    set((state) => ({
      tokens: state.tokens.map((t) =>
        t.id === id ? { ...t, status: 'REVOKED' as TokenStatus } : t
      ),
    }));
  },

  revokeUserTokens: (userId) => {
    set((state) => ({
      tokens: state.tokens.map((t) =>
        t.userId === userId ? { ...t, status: 'REVOKED' as TokenStatus } : t
      ),
    }));
  },
}));

export default useTokenStore;
