export type OrgNodeType = 'GROUP' | 'COMPANY' | 'DEPARTMENT' | 'PROGRAM' | 'PROJECT';
export type OrgNodeStatus = 'ACTIVE' | 'INACTIVE' | 'DELETED';
export type OrgType = 'VERTICAL' | 'HORIZONTAL';
export type UserStatus = 'NORMAL' | 'LOCKED' | 'DISABLED' | 'CANCELLED' | 'DELETED';
export type TemplateStatus = 'DRAFT' | 'PUBLISHED' | 'INACTIVE' | 'DELETED';
export type TemplateType = 'ORG' | 'POSITION' | 'FUNCTION_SET';
export type TemplateMode = 'VERTICAL' | 'HORIZONTAL' | 'HYBRID';
export type ResourceType = 'CATALOG' | 'MENU' | 'BUTTON';
export type LockUnit = 'MINUTE' | 'HOUR' | 'DAY';
export type AuthLogType = 'LOGIN' | 'LOGOUT';
export type AuthLogStatus = 'SUCCESS' | 'FAIL';
export type TokenStatus = 'ACTIVE' | 'EXPIRED' | 'REVOKED';

export interface OrgNode {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  parentId: string | null;
  type: OrgNodeType;
  status: OrgNodeStatus;
  orgScale?: string;
  businessInfo?: string;
  innerOuter?: string;
  orgType?: OrgType;
  sort: number;
  remark?: string;
  // 集团/公司扩展字段
  extId?: string;
  orgId?: string;
  cooperationType?: number;
  industry?: number;
  contactWay?: number;
  phone?: string;
  address?: string;
  postalCode?: string;
  businessType?: number;
  requirementDesc?: string;
  caseDesc?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Position {
  id: string;
  code: string;
  name: string;
  orgNodeId: string;
  status: OrgNodeStatus;
  functionSetIds: string[];
  description?: string;
  // 新增字段
  positionType?: 'MANAGEMENT' | 'NON_MANAGEMENT';
  positionLevel?: 'P0' | 'P1' | 'P2';
  isInherited?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  code: string;
  username: string;
  name: string;
  positionIds: string[];
  orgNodeId: string;
  status: UserStatus;
  email?: string;
  phone?: string;
  lockReason?: string;
  lockTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FunctionSet {
  id: string;
  code: string;
  name: string;
  status: OrgNodeStatus;
  description?: string;
  resourceIds: string[];
  dataPermission?: DataPermissionConfig;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateNode {
  id: string;
  parentId?: string;
  parentNodeName: string;
  nodeName: string;
  nodeCode: string;
  nodeType: OrgNodeType;
  sort: number;
  children?: TemplateNode[];
}

export interface Template {
  id: string;
  code: string;
  name: string;
  version: string;
  versionNo: number;
  status: TemplateStatus;
  type: TemplateType;
  templateMode?: TemplateMode;
  orgScale?: string;
  parentVersionId?: string;
  content?: string;
  nodes?: TemplateNode[];
  createdAt: string;
  updatedAt: string;
}

export interface Resource {
  id: string;
  code: string;
  name: string;
  parentId: string | null;
  type: ResourceType;
  status: OrgNodeStatus;
  path?: string;
  icon?: string;
  sort: number;
  children?: Resource[];
}

export interface PasswordPolicy {
  id: string;
  name: string;
  minLength: number;
  maxLength: number;
  requireUpper: boolean;
  requireLower: boolean;
  requireNumber: boolean;
  requireSpecial: boolean;
  includeUsername: boolean;
  noConsecutiveLetters: boolean;
  noConsecutiveNumbers: boolean;
  status: OrgNodeStatus;
  createdAt: string;
  updatedAt: string;
}

export interface LockRule {
  id: string;
  name: string;
  failThreshold: number;
  lockDuration: number;
  lockUnit: LockUnit;
  status: OrgNodeStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AuthLog {
  id: string;
  userId: string;
  username: string;
  type: AuthLogType;
  status: AuthLogStatus;
  ip: string;
  userAgent: string;
  failReason?: string;
  createdAt: string;
}

export interface UserToken {
  id: string;
  userId: string;
  username: string;
  token: string;
  status: TokenStatus;
  expiredAt: string;
  lastUsedAt: string;
  createdAt: string;
  ip?: string;
  userAgent?: string;
}

export interface DataPermissionConfig {
  scope: string;
  deptIds: string[];
}
