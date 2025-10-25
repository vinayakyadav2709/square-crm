import type { users, leads, callLogs, categories } from '../db/schema'

// ============================================
// Database Inferred Types
// ============================================
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

export type Lead = typeof leads.$inferSelect
export type NewLead = typeof leads.$inferInsert

export type CallLog = typeof callLogs.$inferSelect
export type NewCallLog = typeof callLogs.$inferInsert

export type Category = typeof categories.$inferSelect
export type NewCategory = typeof categories.$inferInsert

// ============================================
// Enums
// ============================================
export type Role = 'admin' | 'editor' | 'viewer'
export type Status = 'open' | 'closed'
export type CategoryType = 'converted' | 'rejected'

// Test role type (for tests)
export type TestRole = 'admin' | 'editor' | 'viewer'

// ============================================
// JWT Types (Extended to match Hono's JWTPayload)
// ============================================
export interface JWTPayload {
  userId: string
  email: string
  role: Role
  exp: number
  [key: string]: any // Index signature required by Hono
}

// ============================================
// Auth Types
// ============================================
export interface AuthResponse {
  user: {
    id: string
    email: string
    name: string
    role: Role
  }
  token: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  name: string
  role?: Role
}

// ============================================
// Lead Types
// ============================================
export interface LeadResponse {
  lead: Lead
}

export interface LeadsListResponse {
  leads: Lead[]
}

export interface CreateLeadRequest {
  name: string
  location: string
  phone: string
  whatsapp_phone: string
  note?: string
  status?: Status
  category_id?: string | null
}

export interface UpdateLeadRequest {
  name?: string
  location?: string
  phone?: string
  whatsapp_phone?: string
  note?: string
  status?: Status
  category_id?: string | null
  closed_at?: number | null
  closed_by?: string | null
}

// ============================================
// Category Types
// ============================================
export interface CategoryResponse {
  category: Category
}

export interface CategoriesListResponse {
  categories: Category[]
}

export interface CreateCategoryRequest {
  name: string
  type: CategoryType
}

export interface UpdateCategoryRequest {
  name?: string
  type?: CategoryType
}

// ============================================
// Call Log Types
// ============================================
export interface CallLogResponse {
  callLog: CallLog
}

export interface CallLogsListResponse {
  callLogs: CallLog[]
}

export interface CreateCallLogRequest {
  lead_id: string
  log_note: string
  call_date?: number
}

// ============================================
// Sync Types
// ============================================
export interface SyncChanges<T = any> {
  created: T[]
  updated: T[]
  deleted: string[] // IDs only
}

// Client-side sync data (snake_case for consistency with mobile)
export interface ClientLead {
  id: string
  name: string
  location: string
  phone: string
  whatsapp_phone: string
  note?: string | null
  status: Status
  category_id?: string | null
  created_by: string
  closed_at?: number | null
  closed_by?: string | null
  created_at: number
  updated_at: number
}

export interface ClientCallLog {
  id: string
  lead_id: string
  called_by: string
  log_note: string
  call_date: number
  created_at: number
  updated_at: number
}

export interface ClientCategory {
  id: string
  name: string
  type: CategoryType
  created_by: string
  created_at: number
  updated_at: number
}

export interface SyncRequest {
  changes: {
    leads?: SyncChanges<ClientLead>
    call_logs?: SyncChanges<ClientCallLog>
    categories?: SyncChanges<ClientCategory>
  }
  lastPulledAt: number | null
}

export interface SyncResponse {
  changes: {
    leads: SyncChanges<ClientLead>
    call_logs: SyncChanges<ClientCallLog>
    categories: SyncChanges<ClientCategory>
  }
  timestamp: number
}

// ============================================
// API Response Types
// ============================================
export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
}

export interface HealthResponse {
  status: 'ok' | 'error'
  timestamp: number
}

export interface ErrorResponse {
  error: string
}

// ============================================
// Hono Context Types
// ============================================
export interface HonoVariables {
  userId: string
  userRole: Role
}
