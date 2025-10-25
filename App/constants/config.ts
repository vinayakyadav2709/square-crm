export const APP_CONFIG = {
  // App Info
  APP_NAME: 'Square CRM',
  APP_VERSION: '1.0.0',

  // WatermelonDB
  DB_NAME: 'square_crm',
  
  // Storage Keys
  STORAGE_KEYS: {
    AUTH_TOKEN: 'auth_token',
    USER_DATA: 'user_data',
  },

  // API Settings
  API_TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,

  // Sync Settings
  SYNC_INTERVAL: 5 * 60 * 1000, // 5 minutes
  AUTO_SYNC_ENABLED: true,

  // UI Settings
  ITEMS_PER_PAGE: 20,
  
  // Test Credentials (only for dev)
  TEST_CREDENTIALS: __DEV__ ? {
    EMAIL: 'admin@test.com',
    PASSWORD: 'admin123',
  } : null,
} as const

export const DEAL_STAGES = ['Qualification', 'Proposal', 'Negotiation'] as const
export const DEAL_STATUSES = ['open', 'closed'] as const
export const USER_ROLES = ['admin', 'editor', 'viewer'] as const

export type DealStage = typeof DEAL_STAGES[number]
export type DealStatus = typeof DEAL_STATUSES[number]
export type UserRole = typeof USER_ROLES[number]
