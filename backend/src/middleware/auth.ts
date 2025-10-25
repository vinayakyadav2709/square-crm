import type { Context, Next } from 'hono'
import { verify } from 'hono/jwt'
import type { HonoVariables } from '../types'

export const authMiddleware = async (
  c: Context<{ Variables: HonoVariables }>,
  next: Next
) => {
  const authHeader = c.req.header('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const token = authHeader.split(' ')[1]!

  try {
    // Verify returns Hono's JWTPayload type
    const payload = await verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    )

    // Extract our custom fields
    c.set('userId', payload.userId as string)
    c.set('userRole', payload.role as 'admin' | 'editor' | 'viewer')
    
    await next()
  } catch (error) {
    return c.json({ error: 'Invalid or expired token' }, 401)
  }
}
