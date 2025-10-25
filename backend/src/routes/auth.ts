import { Hono } from 'hono'
import { db } from '../db/client'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'
import { sign } from 'hono/jwt'
import bcrypt from 'bcrypt'
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  ErrorResponse,
} from '../types'

const authRoutes = new Hono()

// POST /auth/register
authRoutes.post('/register', async (c) => {
  try {
    const body = (await c.req.json()) as RegisterRequest
    const { email, password, name, role } = body

    // Check if user exists
    const existing = await db.query.users.findFirst({
      where: eq(users.email, email),
    })

    if (existing) {
      return c.json({ error: 'User already exists' } as ErrorResponse, 400)
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const [user] = await db
      .insert(users)
      .values({
        email,
        password: hashedPassword,
        name,
        role: role || 'viewer',
      })
      .returning()

    // Check if user was created
    if (!user) {
      return c.json({ error: 'Failed to create user' } as ErrorResponse, 500)
    }

    // Generate JWT (using plain object to avoid type issues)
    const token = await sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
      },
      process.env.JWT_SECRET || 'your-secret-key'
    )

    const response: AuthResponse = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    }

    return c.json(response)
  } catch (error: any) {
    console.error('Registration error:', error)
    return c.json(
      { error: error.message || 'Registration failed' } as ErrorResponse,
      400
    )
  }
})

// POST /auth/login
authRoutes.post('/login', async (c) => {
  try {
    const body = (await c.req.json()) as LoginRequest
    const { email, password } = body

    console.log('🔍 Login attempt for email:', email)

    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    })

    if (!user) {
      console.log('❌ User not found for email:', email)
      return c.json({ error: 'Invalid credentials' } as ErrorResponse, 401)
    }

    console.log('✅ User found:', user.email, 'Role:', user.role)

    const valid = await bcrypt.compare(password, user.password)

    console.log('🔐 Password valid?', valid)

    if (!valid) {
      console.log('❌ Password mismatch')
      return c.json({ error: 'Invalid credentials' } as ErrorResponse, 401)
    }

    // Generate JWT (using plain object to avoid type issues)
    const token = await sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
      },
      process.env.JWT_SECRET || 'your-secret-key'
    )

    const response: AuthResponse = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    }

    return c.json(response)
  } catch (error: any) {
    console.error('❌ Login error:', error)
    return c.json({ error: 'Login failed' } as ErrorResponse, 401)
  }
})

export { authRoutes }
