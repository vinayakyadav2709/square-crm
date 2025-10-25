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
  loginAsGuest: () => Promise<void> // ✅ New guest login
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  // ✅ Guest login - no network required
  loginAsGuest: async () => {
    try {
      const guestUser: User = {
        id: 'guest-' + Date.now(),
        email: 'guest@local',
        name: 'Guest User',
        role: 'admin', // Give admin access for full testing
      }

      // Save to WatermelonDB
      await database.write(async () => {
        await database.get<AuthSession>('auth_sessions').create((session) => {
          session.userId = guestUser.id
          session.email = guestUser.email
          session.name = guestUser.name
          session.role = guestUser.role
          session.token = 'guest-token'
          session.createdAt = new Date()
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
          session.createdAt = new Date()
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
