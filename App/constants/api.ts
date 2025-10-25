import { Platform } from 'react-native'

// Determine base URL based on platform and environment
const getBaseUrl = () => {
  if (__DEV__) {
    // Development URLs
    if (Platform.OS === 'android') {
      return 'http://192.168.0.182:3000' // Android emulator
    } else if (Platform.OS === 'ios') {
      return 'http://localhost:3000' // iOS simulator
    }
    // For physical device, use your computer's IP
    // return 'http://192.168.1.X:3000'
  }
  
  // Production URL
  return 'http://192.168.0.182:3000'
}

export const API_BASE_URL = getBaseUrl()

// API Endpoints
export const API_ENDPOINTS = {
  // Health
  HEALTH: '/health',

  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
  },

  // Deals
  DEALS: {
    LIST: '/deals',
    CREATE: '/deals',
    UPDATE: (id: string) => `/deals/${id}`,
    DELETE: (id: string) => `/deals/${id}`,
  },

  // Sync
  SYNC: '/sync',
} as const

// Helper function to build full URL
export const getApiUrl = (endpoint: string) => {
  return `${API_BASE_URL}${endpoint}`
}
