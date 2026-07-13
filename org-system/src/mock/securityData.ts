import type { PasswordPolicy, LockRule } from '@/types';
import { daysAgo } from '@/utils/dateUtils';

export const passwordPolicies: PasswordPolicy[] = [
  {
    id: 'pp-001',
    name: '默认密码策略',
    minLength: 8,
    maxLength: 20,
    requireUpper: true,
    requireLower: true,
    requireNumber: true,
    requireSpecial: true,
    includeUsername: false,
    noConsecutiveLetters: true,
    noConsecutiveNumbers: true,
    status: 'ACTIVE',
    createdAt: daysAgo(30),
    updatedAt: daysAgo(2),
  },
  {
    id: 'pp-002',
    name: '简易密码策略',
    minLength: 6,
    maxLength: 16,
    requireUpper: false,
    requireLower: true,
    requireNumber: true,
    requireSpecial: false,
    includeUsername: true,
    noConsecutiveLetters: false,
    noConsecutiveNumbers: false,
    status: 'INACTIVE',
    createdAt: daysAgo(15),
    updatedAt: daysAgo(5),
  },
];

export const lockRules: LockRule[] = [
  {
    id: 'lr-001',
    name: '默认锁定规则',
    failThreshold: 5,
    lockDuration: 30,
    lockUnit: 'MINUTE',
    status: 'ACTIVE',
    createdAt: daysAgo(30),
    updatedAt: daysAgo(2),
  },
  {
    id: 'lr-002',
    name: '严格锁定规则',
    failThreshold: 3,
    lockDuration: 2,
    lockUnit: 'HOUR',
    status: 'INACTIVE',
    createdAt: daysAgo(15),
    updatedAt: daysAgo(5),
  },
];

export default {
  passwordPolicies,
  lockRules,
};
