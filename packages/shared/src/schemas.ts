import { z } from 'zod';
import { Role, CompanyStatus, ProductStatus, AssetType, ViewerType, InvoiceStatus, EventType } from './types';

// ============================================
// Auth Schemas
// ============================================

export const loginSchema = z.object({
  email: z.string().email('بريد إلكتروني غير صالح'),
  password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  companyName: z.string().min(2),
  companySlug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
});

// ============================================
// Company Schemas
// ============================================

export const createCompanySchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  planId: z.string().uuid(),
});

export const updateCompanySchema = z.object({
  name: z.string().min(2).optional(),
  status: z.nativeEnum(CompanyStatus).optional(),
  planId: z.string().uuid().optional(),
});

// ============================================
// User Schemas
// ============================================

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  role: z.nativeEnum(Role),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.nativeEnum(Role).optional(),
});

// ============================================
// Product Schemas
// ============================================

export const createProductSchema = z.object({
  sku: z.string().min(1),
  nameAr: z.string().min(1),
  nameEn: z.string().min(1),
});

export const updateProductSchema = z.object({
  sku: z.string().min(1).optional(),
  nameAr: z.string().min(1).optional(),
  nameEn: z.string().min(1).optional(),
  status: z.nativeEnum(ProductStatus).optional(),
});

// ============================================
// ProductConfig Schemas
// ============================================

export const upsertProductConfigSchema = z.object({
  viewerType: z.nativeEnum(ViewerType),
  scale: z.number().positive().default(1),
  rotationOffsetJson: z.record(z.number()).optional().default({}),
  positionOffsetJson: z.record(z.number()).optional().default({}),
  placementSettingsJson: z.record(z.unknown()).optional().default({}),
  tryonSettingsJson: z.record(z.unknown()).optional().default({}),
});

// ============================================
// ApiToken Schemas
// ============================================

export const createApiTokenSchema = z.object({
  name: z.string().min(2),
  scopesJson: z.array(z.string()).default(['viewer']),
});

// ============================================
// Asset Schemas
// ============================================

export const createAssetSchema = z.object({
  productId: z.string().uuid(),
  type: z.nativeEnum(AssetType),
});

// ============================================
// Event Schemas
// ============================================

export const createEventSchema = z.object({
  sessionId: z.string().uuid(),
  type: z.nativeEnum(EventType),
  payloadJson: z.record(z.unknown()).optional().default({}),
});

// ============================================
// Analytics Schemas
// ============================================

export const analyticsQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  productId: z.string().uuid().optional(),
  groupBy: z.enum(['day', 'week', 'month']).default('day'),
});

// ============================================
// Pagination Schema
// ============================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// Inferred types
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type UpsertProductConfigInput = z.infer<typeof upsertProductConfigSchema>;
export type CreateApiTokenInput = z.infer<typeof createApiTokenSchema>;
export type CreateAssetInput = z.infer<typeof createAssetSchema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type AnalyticsQueryInput = z.infer<typeof analyticsQuerySchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
