import { describe, test, expect } from 'bun:test'
import { BASE_URL, testData, registerUser, loginUser } from './setup'

describe('Authentication Tests', () => {
  describe('User Registration', () => {
    test('should register admin user', async () => {
      const { response, data } = await registerUser('admin')

      expect(response.status).toBe(200)
      
      if ('error' in data) {
        throw new Error(typeof data.error === 'string' ? data.error : 'Unknown error')
      }


      expect(data.user).toBeDefined()
      expect(data.token).toBeDefined()
      expect(data.user.role).toBe('admin')
      expect(data.user.email).toBe(testData.admin.email)
    })

    test('should register editor user', async () => {
      const { response, data } = await registerUser('editor')

      expect(response.status).toBe(200)
      
      if ('error' in data) {
        throw new Error(typeof data.error === 'string' ? data.error : 'Unknown error')
      }


      expect(data.user).toBeDefined()
      expect(data.token).toBeDefined()
      expect(data.user.role).toBe('editor')
    })

    test('should register viewer user', async () => {
      const { response, data } = await registerUser('viewer')

      expect(response.status).toBe(200)
      
      if ('error' in data) {
        throw new Error(typeof data.error === 'string' ? data.error : 'Unknown error')
      }


      expect(data.user.role).toBe('viewer')
    })

    test('should reject duplicate email registration', async () => {
      const response = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testData.admin.email,
          password: 'password123',
          name: 'Duplicate User',
          role: 'editor',
        }),
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      
      if ('error' in data) {
        expect(data.error).toBe('User already exists')
      }
    })
  })

  describe('User Login', () => {
    test('should login existing user with correct credentials', async () => {
      const { response, data } = await loginUser(
        testData.admin.email,
        testData.admin.password
      )

      expect(response.status).toBe(200)
      
      if ('error' in data) {
        throw new Error(data.error)
      }

      expect(data.token).toBeDefined()
      expect(data.user).toBeDefined()
      expect(data.user.email).toBe(testData.admin.email)
    })

    test('should reject login with wrong password', async () => {
      const { response, data } = await loginUser(
        testData.admin.email,
        'wrongpassword'
      )

      expect(response.status).toBe(401)
      
      if ('error' in data) {
        expect(data.error).toBe('Invalid credentials')
      }
    })

    test('should reject login with non-existent email', async () => {
      const { response, data } = await loginUser(
        'nonexistent@test.com',
        'password123'
      )

      expect(response.status).toBe(401)
      
      if ('error' in data) {
        expect(data.error).toBe('Invalid credentials')
      }
    })

    test('should reject login with missing credentials', async () => {
      const response = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testData.admin.email }),
      })

      expect(response.status).toBe(401)
    })
  })

  describe('Token Validation', () => {
    test('should accept valid token', async () => {
      const response = await fetch(`${BASE_URL}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${testData.admin.token}`,
        },
        body: JSON.stringify({
          changes: {
            leads: { created: [], updated: [], deleted: [] },
            categories: { created: [], updated: [], deleted: [] },
            call_logs: { created: [], updated: [], deleted: [] },
          },
          lastPulledAt: null,
        }),
      })

      expect(response.status).toBe(200)
    })

    test('should reject invalid token', async () => {
      const response = await fetch(`${BASE_URL}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer invalid-token-12345',
        },
        body: JSON.stringify({
          changes: {
            leads: { created: [], updated: [], deleted: [] },
            categories: { created: [], updated: [], deleted: [] },
            call_logs: { created: [], updated: [], deleted: [] },
          },
          lastPulledAt: null,
        }),
      })

      expect(response.status).toBe(401)
    })

    test('should reject missing token', async () => {
      const response = await fetch(`${BASE_URL}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          changes: {
            leads: { created: [], updated: [], deleted: [] },
            categories: { created: [], updated: [], deleted: [] },
            call_logs: { created: [], updated: [], deleted: [] },
          },
          lastPulledAt: null,
        }),
      })

      expect(response.status).toBe(401)
    })
  })
})
