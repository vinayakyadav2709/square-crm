import { beforeAll, afterAll } from 'bun:test'
import type { 
  TestRole, 
  SyncRequest, 
  SyncResponse, 
  AuthResponse,
  ClientLead,
  ClientCallLog,
  ClientCategory,
  SyncChanges,
  ErrorResponse,
} from '../src/types'

export const BASE_URL = 'http://localhost:3000'

// Shared test data
export const testData = {
  admin: {
    email: '',
    password: 'admin123',
    name: 'Admin User',
    role: 'admin' as TestRole,
    token: '',
    userId: '',
  },
  editor: {
    email: '',
    password: 'editor123',
    name: 'Editor User',
    role: 'editor' as TestRole,
    token: '',
    userId: '',
  },
  viewer: {
    email: '',
    password: 'viewer123',
    name: 'Viewer User',
    role: 'viewer' as TestRole,
    token: '',
    userId: '',
  },
  leadId: '',
  categoryId: '',
  callLogId: '',
}

// Helper functions
export async function registerUser(role: TestRole) {
  const userData = testData[role]
  userData.email = `${role}${Date.now()}@test.com`

  const response = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: userData.email,
      password: userData.password,
      name: userData.name,
      role: userData.role,
    }),
  })

  const data = (await response.json()) as AuthResponse | ErrorResponse
  
  if ('error' in data) {
    throw new Error(data.error)
  }

  userData.token = data.token
  userData.userId = data.user.id

  return { response, data }
}

export async function loginUser(email: string, password: string) {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  const data = (await response.json()) as AuthResponse | ErrorResponse
  return { response, data }
}

interface SyncRequestChanges {
  leads?: Partial<SyncChanges<ClientLead>>
  call_logs?: Partial<SyncChanges<ClientCallLog>>
  categories?: Partial<SyncChanges<ClientCategory>>
}

export async function syncRequest(
  token: string,
  changes: Partial<SyncRequestChanges>,
  lastPulledAt: number | null = null
) {
  // Build complete sync changes with defaults
  const syncChanges: SyncRequest['changes'] = {
    leads: {
      created: [],
      updated: [],
      deleted: [],
      ...changes.leads,
    },
    call_logs: {
      created: [],
      updated: [],
      deleted: [],
      ...changes.call_logs,
    },
    categories: {
      created: [],
      updated: [],
      deleted: [],
      ...changes.categories,
    },
  }

  const response = await fetch(`${BASE_URL}/sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      changes: syncChanges,
      lastPulledAt,
    } as SyncRequest),
  })

  return { response, data: (await response.json()) as SyncResponse }
}

// Generate unique IDs
export function generateTempId(prefix: string): string {
  return `temp-${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}
