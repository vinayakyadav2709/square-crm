// backend/src/middleware/rbac.ts
import type { Context, Next } from 'hono'
import type { Role } from '../types'

export const requireRole = (allowedRoles: Role[]) => {
  return async (c: Context, next: Next) => {
    const userRole = c.get('userRole') as Role

    if (!allowedRoles.includes(userRole)) {
      return c.json({ error: 'Forbidden: Insufficient permissions' }, 403)
    }

    await next()
  }
}
