import { describe, test, expect } from 'bun:test'
import { BASE_URL } from './setup'

describe('Health Check Tests', () => {
  test('GET /health - should return ok status', async () => {
    const response = await fetch(`${BASE_URL}/health`)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.status).toBe('ok')
    expect(data.timestamp).toBeDefined()
  })

  test('GET /health - should respond quickly', async () => {
    const start = Date.now()
    const response = await fetch(`${BASE_URL}/health`)
    const duration = Date.now() - start

    expect(response.status).toBe(200)
    expect(duration).toBeLessThan(100) // Should respond in < 100ms
  })

  test('GET /health - should not require authentication', async () => {
    const response = await fetch(`${BASE_URL}/health`, {
      headers: {
        Authorization: 'Bearer invalid-token',
      },
    })

    expect(response.status).toBe(200)
  })
})
