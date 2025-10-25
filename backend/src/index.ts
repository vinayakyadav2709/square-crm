import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from './middleware/logger'
import { authRoutes } from './routes/auth'
import { syncRoutes } from './routes/sync'
import type { HonoVariables, HealthResponse } from './types'

const app = new Hono<{ Variables: HonoVariables }>()

// Middleware
app.use('*', logger)
app.use('*', cors())

// Routes
app.route('/auth', authRoutes)
app.route('/sync', syncRoutes)

// Health check
app.get('/health', (c) => {
  const response: HealthResponse = {
    status: 'ok',
    timestamp: Date.now(),
  }
  return c.json(response)
})

const port = process.env.PORT || 3000
console.log(`🚀 Server running on http://localhost:${port}`)
console.log(`Started development server: http://localhost:${port}`)

export default {
  port,
  fetch: app.fetch,
}
