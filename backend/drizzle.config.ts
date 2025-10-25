// backend/drizzle.config.ts
/// <reference types="@types/bun" />

import type { Config } from 'drizzle-kit'

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://square_user:square_pass@localhost:9000/square_crm',
  },
} satisfies Config
