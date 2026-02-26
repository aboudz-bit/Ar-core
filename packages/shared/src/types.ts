// ============================================
// AR-Core Shared Types
// ============================================

export enum Role {
  PLATFORM_ADMIN = 'platform_admin',
  COMPANY_OWNER = 'company_owner',
  COMPANY_ADMIN = 'company_admin',
  COMPANY_STAFF = 'company_staff',
}

export enum CompanyStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  TRIAL = 'trial',
}

export enum ProductStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DRAFT = 'draft',
}

export enum AssetType {
  PLACEMENT_GLB = 'placement_glb',
  TRYON_GLB = 'tryon_glb',
  USDZ = 'usdz',
}

export enum ViewerType {
  PLACEMENT = 'placement',
  TRYON = 'tryon',
}

export enum InvoiceStatus {
  DRAFT = 'draft',
  ISSUED = 'issued',
  PAID = 'paid',
  OVERDUE = 'overdue',
}

export enum EventType {
  SESSION_START = 'session_start',
  SESSION_END = 'session_end',
  MODEL_LOADED = 'model_loaded',
  AR_ACTIVATED = 'ar_activated',
  SCREENSHOT = 'screenshot',
  INTERACTION = 'interaction',
  ERROR = 'error',
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  companyId: string | null;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
