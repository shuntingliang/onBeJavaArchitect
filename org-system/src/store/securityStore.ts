import { create } from 'zustand';
import type { PasswordPolicy, LockRule, OrgNodeStatus } from '@/types';
import { passwordPolicies, lockRules } from '@/mock/securityData';
import { generateUUID } from '@/utils/idGenerator';
import { getNow } from '@/utils/dateUtils';

interface SecurityState {
  passwordPolicies: PasswordPolicy[];
  lockRules: LockRule[];
  activePasswordPolicyId: string | null;
  activeLockRuleId: string | null;
  loading: boolean;

  getPasswordPolicyById: (id: string) => PasswordPolicy | undefined;
  getActivePasswordPolicy: () => PasswordPolicy | undefined;
  addPasswordPolicy: (policy: Omit<PasswordPolicy, 'id' | 'createdAt' | 'updatedAt'>) => PasswordPolicy;
  updatePasswordPolicy: (id: string, updates: Partial<PasswordPolicy>) => void;
  deletePasswordPolicy: (id: string) => void;
  activatePasswordPolicy: (id: string) => void;
  deactivatePasswordPolicy: (id: string) => void;
  setActivePasswordPolicy: (id: string) => void;

  getLockRuleById: (id: string) => LockRule | undefined;
  getActiveLockRule: () => LockRule | undefined;
  addLockRule: (rule: Omit<LockRule, 'id' | 'createdAt' | 'updatedAt'>) => LockRule;
  updateLockRule: (id: string, updates: Partial<LockRule>) => void;
  deleteLockRule: (id: string) => void;
  activateLockRule: (id: string) => void;
  deactivateLockRule: (id: string) => void;
  setActiveLockRule: (id: string) => void;

  validatePassword: (password: string, username?: string) => { valid: boolean; errors: string[] };
}

export const useSecurityStore = create<SecurityState>((set, get) => ({
  passwordPolicies: passwordPolicies,
  lockRules: lockRules,
  activePasswordPolicyId: passwordPolicies.find((p) => p.status === 'ACTIVE')?.id || null,
  activeLockRuleId: lockRules.find((r) => r.status === 'ACTIVE')?.id || null,
  loading: false,

  getPasswordPolicyById: (id) => get().passwordPolicies.find((p) => p.id === id),

  getActivePasswordPolicy: () => {
    const activeId = get().activePasswordPolicyId;
    return activeId ? get().getPasswordPolicyById(activeId) : undefined;
  },

  addPasswordPolicy: (policy) => {
    const now = getNow();
    const newPolicy: PasswordPolicy = {
      ...policy,
      id: generateUUID(),
      createdAt: now,
      updatedAt: now,
    };
    set((state) => ({ passwordPolicies: [...state.passwordPolicies, newPolicy] }));
    return newPolicy;
  },

  updatePasswordPolicy: (id, updates) => {
    set((state) => ({
      passwordPolicies: state.passwordPolicies.map((p) =>
        p.id === id ? { ...p, ...updates, updatedAt: getNow() } : p
      ),
    }));
  },

  deletePasswordPolicy: (id) => {
    set((state) => ({
      passwordPolicies: state.passwordPolicies.filter((p) => p.id !== id),
      activePasswordPolicyId: state.activePasswordPolicyId === id ? null : state.activePasswordPolicyId,
    }));
  },

  activatePasswordPolicy: (id) => {
    get().updatePasswordPolicy(id, { status: 'ACTIVE' as OrgNodeStatus });
  },

  deactivatePasswordPolicy: (id) => {
    get().updatePasswordPolicy(id, { status: 'INACTIVE' as OrgNodeStatus });
  },

  setActivePasswordPolicy: (id) => {
    set({ activePasswordPolicyId: id });
  },

  getLockRuleById: (id) => get().lockRules.find((r) => r.id === id),

  getActiveLockRule: () => {
    const activeId = get().activeLockRuleId;
    return activeId ? get().getLockRuleById(activeId) : undefined;
  },

  addLockRule: (rule) => {
    const now = getNow();
    const newRule: LockRule = {
      ...rule,
      id: generateUUID(),
      createdAt: now,
      updatedAt: now,
    };
    set((state) => ({ lockRules: [...state.lockRules, newRule] }));
    return newRule;
  },

  updateLockRule: (id, updates) => {
    set((state) => ({
      lockRules: state.lockRules.map((r) =>
        r.id === id ? { ...r, ...updates, updatedAt: getNow() } : r
      ),
    }));
  },

  deleteLockRule: (id) => {
    set((state) => ({
      lockRules: state.lockRules.filter((r) => r.id !== id),
      activeLockRuleId: state.activeLockRuleId === id ? null : state.activeLockRuleId,
    }));
  },

  activateLockRule: (id) => {
    get().updateLockRule(id, { status: 'ACTIVE' as OrgNodeStatus });
  },

  deactivateLockRule: (id) => {
    get().updateLockRule(id, { status: 'INACTIVE' as OrgNodeStatus });
  },

  setActiveLockRule: (id) => {
    set({ activeLockRuleId: id });
  },

  validatePassword: (password, username) => {
    const policy = get().getActivePasswordPolicy();
    const errors: string[] = [];

    if (!policy) {
      return { valid: true, errors: [] };
    }

    if (password.length < policy.minLength) {
      errors.push(`密码长度不能少于 ${policy.minLength} 位`);
    }
    if (password.length > policy.maxLength) {
      errors.push(`密码长度不能超过 ${policy.maxLength} 位`);
    }
    if (policy.requireUpper && !/[A-Z]/.test(password)) {
      errors.push('密码必须包含大写字母');
    }
    if (policy.requireLower && !/[a-z]/.test(password)) {
      errors.push('密码必须包含小写字母');
    }
    if (policy.requireNumber && !/[0-9]/.test(password)) {
      errors.push('密码必须包含数字');
    }
    if (policy.requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('密码必须包含特殊字符');
    }
    if (!policy.includeUsername && username && password.toLowerCase().includes(username.toLowerCase())) {
      errors.push('密码不能包含用户名');
    }
    if (policy.noConsecutiveLetters && /(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i.test(password)) {
      errors.push('密码不能包含连续字母');
    }
    if (policy.noConsecutiveNumbers && /(012|123|234|345|456|567|678|789)/.test(password)) {
      errors.push('密码不能包含连续数字');
    }

    return { valid: errors.length === 0, errors };
  },
}));

export default useSecurityStore;
