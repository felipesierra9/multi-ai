import { MediaType } from './generation.models';
import { Role } from './auth.models';

export interface ChartPoint {
  label: string;
  value: number;
}

export interface AdminStatistics {
  totalUsers: number;
  activeUsers: number;
  blockedUsers: number;
  totalGenerations: number;
  imageGenerations: number;
  videoGenerations: number;
  audioGenerations: number;
  textGenerations: number;
  topProvider: string | null;
  busiestDay: string | null;
  topUser: string | null;
  activityByDay: ChartPoint[];
  activityByMonth: ChartPoint[];
  registrationsByMonth: ChartPoint[];
  byCategory: ChartPoint[];
  byProvider: ChartPoint[];
}

export interface StatisticsFilters {
  from?: string;
  to?: string;
  user?: string;
  mediaType?: MediaType | '';
  provider?: string;
}

/* ---------- Usuarios ---------- */
export type UserStatus = 'ACTIVE' | 'BLOCKED' | 'UNVERIFIED';

export interface AdminUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  status: UserStatus;
  createdAt: string;
  generationsCount: number;
}

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: Role;
}

export interface UpdateUserRequest {
  firstName: string;
  lastName: string;
  role: Role;
}

/* ---------- Auditoría ---------- */
export type AuditResult = 'SUCCESS' | 'FAILURE';

export interface AuditEntry {
  id: number;
  userEmail: string | null;
  action: string;
  description: string;
  createdAt: string;
  ipAddress: string | null;
  userAgent: string | null;
  result: AuditResult;
}

export interface AuditFilters {
  from?: string;
  to?: string;
  action?: string;
  result?: AuditResult | '';
  search?: string;
}

export const AUDIT_ACTIONS: string[] = [
  'USER_REGISTERED',
  'LOGIN_SUCCESS',
  'LOGIN_FAILED',
  'EMAIL_VERIFIED',
  'PASSWORD_RESET_REQUESTED',
  'PASSWORD_CHANGED',
  'CONTENT_GENERATED',
  'FILE_DOWNLOADED',
  'ADMIN_USER_UPDATED',
  'USER_BLOCKED',
  'USER_DELETED'
];

/* ---------- Reportes ---------- */
export type ReportType = 'users' | 'generations' | 'audit' | 'statistics';
export type ReportFormat = 'csv' | 'xlsx' | 'pdf';

export interface ReportFile {
  blob: Blob;
  filename: string;
}
