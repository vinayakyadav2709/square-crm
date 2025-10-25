import { create } from 'zustand'
import { database } from '@/db'
import AuthSession from '@/db/models/AuthSession'
import { getApiUrl, API_ENDPOINTS } from '@/constants/api'

export type Role = 'admin' | 'editor' | 'viewer'

export interface User {
  id: string
  email: string
  name: string
  role: Role
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string, role: Role) => Promise<void>
  loginAsGuest: () => Promise<void>
  setUser: (user: User, token: string) => void
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  // Guest login - no network required
  loginAsGuest: async () => {
    try {
      const guestUser: User = {
        id: 'guest-' + Date.now(),
        email: 'guest@local',
        name: 'Guest User',
        role: 'admin',
      }

      await database.write(async () => {
        await database.get<AuthSession>('auth_sessions').create((session) => {
          session.userId = guestUser.id
          session.email = guestUser.email
          session.name = guestUser.name
          session.role = guestUser.role
          session.token = 'guest-token'
          // Don't set createdAt - let DB handle it
        })
      })

      set({
        user: guestUser,
        token: 'guest-token',
        isAuthenticated: true,
      })
    } catch (error: any) {
      throw new Error(`Guest login failed: ${error.message}`)
    }
  },

  // Regular login
  login: async (email: string, password: string) => {
    try {
      const response = await fetch(getApiUrl(API_ENDPOINTS.AUTH.LOGIN), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Login failed')
      }

      const data = await response.json()

      await database.write(async () => {
        await database.get<AuthSession>('auth_sessions').create((session) => {
          session.userId = data.user.id
          session.email = data.user.email
          session.name = data.user.name
          session.role = data.user.role
          session.token = data.token
        })
      })

      set({
        user: data.user,
        token: data.token,
        isAuthenticated: true,
      })
    } catch (error: any) {
      throw new Error(error.message || 'Login failed')
    }
  },

  // Register new user
  register: async (name: string, email: string, password: string, role: Role) => {
    try {
      const response = await fetch(getApiUrl(API_ENDPOINTS.AUTH.REGISTER), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Registration failed')
      }

      const data = await response.json()

      await database.write(async () => {
        await database.get<AuthSession>('auth_sessions').create((session) => {
          session.userId = data.user.id
          session.email = data.user.email
          session.name = data.user.name
          session.role = data.user.role
          session.token = data.token
        })
      })

      set({
        user: data.user,
        token: data.token,
        isAuthenticated: true,
      })
    } catch (error: any) {
      throw new Error(error.message || 'Registration failed')
    }
  },

  // Set user manually (for account switching)
  setUser: (user: User, token: string) => {
    set({
      user,
      token,
      isAuthenticated: true,
    })
  },

  // Logout
  logout: async () => {
    try {
      const sessions = await database.get<AuthSession>('auth_sessions').query().fetch()
      await database.write(async () => {
        for (const session of sessions) {
          await session.markAsDeleted()
        }
      })
      set({ user: null, token: null, isAuthenticated: false })
    } catch (error) {
      console.error('Logout error:', error)
    }
  },

  // Check auth on app start
  checkAuth: async () => {
    try {
      const sessions = await database.get<AuthSession>('auth_sessions').query().fetch()
      if (sessions.length > 0) {
        const session = sessions[0]
        set({
          user: {
            id: session.userId,
            email: session.email,
            name: session.name,
            role: session.role as Role,
          },
          token: session.token,
          isAuthenticated: true,
        })
      }
    } catch (error) {
      console.error('Auth check error:', error)
    }
  },
}))
