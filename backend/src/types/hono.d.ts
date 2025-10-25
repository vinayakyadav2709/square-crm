// backend/src/types/hono.d.ts
import type { Role } from './index'

declare module 'hono' {
  interface ContextVariableMap {
    userId: string
    userRole: Role
  }
}
