import { pgTable, uuid, varchar, text, timestamp, pgEnum } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// Enums
export const roleEnum = pgEnum('role', ['admin', 'editor', 'viewer'])
export const statusEnum = pgEnum('status', ['open', 'closed'])
export const categoryTypeEnum = pgEnum('category_type', ['converted', 'rejected'])

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  role: roleEnum('role').notNull().default('viewer'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// Leads table (replaces deals)
export const leads = pgTable('leads', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  location: varchar('location', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }).notNull(),
  whatsappPhone: varchar('whatsapp_phone', { length: 20 }).notNull(),
  note: text('note'),
  status: statusEnum('status').notNull().default('open'),
  categoryId: uuid('category_id'),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  closedAt: timestamp('closed_at'),
  closedBy: uuid('closed_by').references(() => users.id),
  deletedAt: timestamp('deleted_at'),
})

// Call Logs table
export const callLogs = pgTable('call_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  leadId: uuid('lead_id').notNull().references(() => leads.id),
  calledBy: uuid('called_by').notNull().references(() => users.id),
  logNote: text('log_note').notNull(),
  callDate: timestamp('call_date').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
})

// Categories table
export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  type: categoryTypeEnum('type').notNull(),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
})

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  createdLeads: many(leads, { relationName: 'createdLeads' }),
  closedLeads: many(leads, { relationName: 'closedLeads' }),
  callLogs: many(callLogs),
  categories: many(categories),
}))

export const leadsRelations = relations(leads, ({ one, many }) => ({
  creator: one(users, {
    fields: [leads.createdBy],
    references: [users.id],
    relationName: 'createdLeads',
  }),
  closer: one(users, {
    fields: [leads.closedBy],
    references: [users.id],
    relationName: 'closedLeads',
  }),
  category: one(categories, {
    fields: [leads.categoryId],
    references: [categories.id],
  }),
  callLogs: many(callLogs),
}))

export const callLogsRelations = relations(callLogs, ({ one }) => ({
  lead: one(leads, {
    fields: [callLogs.leadId],
    references: [leads.id],
  }),
  caller: one(users, {
    fields: [callLogs.calledBy],
    references: [users.id],
  }),
}))

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  creator: one(users, {
    fields: [categories.createdBy],
    references: [users.id],
  }),
  leads: many(leads),
}))
