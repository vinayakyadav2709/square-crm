// backend/src/utils/jwt.ts
import jwt from 'jsonwebtoken'
import type { JWTPayload } from '../types'

const JWT_SECRET = process.env.JWT_SECRET!
const EXPIRY = '7d'

export const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: EXPIRY })
}

export const verifyToken = (token: string): JWTPayload => {
  return jwt.verify(token, JWT_SECRET) as JWTPayload
}
