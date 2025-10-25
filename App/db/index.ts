import { Database } from '@nozbe/watermelondb'
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite'
import { schema } from './schema'
import Lead from './models/Lead'
import Category from './models/Category'
import CallLog from './models/CallLog'
import AuthSession from './models/AuthSession'
import { setGenerator } from '@nozbe/watermelondb/utils/common/randomId'

// ✅ CRITICAL FIX: Use UUID v4 generator
setGenerator(() => {
  // Simple UUID v4 generator (crypto-compatible)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
})

const adapter = new SQLiteAdapter({
  schema,
  jsi: true,
  onSetUpError: (error) => {
    console.error('Database setup error:', error)
  },
})

export const database = new Database({
  adapter,
  modelClasses: [Lead, Category, CallLog, AuthSession],
})
