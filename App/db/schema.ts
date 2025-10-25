import { appSchema, tableSchema } from '@nozbe/watermelondb'

export const schema = appSchema({
  version: 10,
  tables: [
    tableSchema({
      name: 'leads',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'location', type: 'string' },
        { name: 'phone', type: 'string' },
        { name: 'whatsapp_phone', type: 'string' },
        { name: 'note', type: 'string', isOptional: true },
        { name: 'status', type: 'string' }, // 'open' | 'closed'
        { name: 'category_id', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'closed_at', type: 'number', isOptional: true },
        { name: 'closed_by', type: 'string', isOptional: true },
      ],
    }),
    tableSchema({
      name: 'categories',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'type', type: 'string' }, // 'converted' | 'rejected'
        { name: 'created_by', type: 'string' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'call_logs',
      columns: [
        { name: 'lead_id', type: 'string', isIndexed: true },
        { name: 'called_by', type: 'string' },
        { name: 'log_note', type: 'string' },
        { name: 'call_date', type: 'number' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'auth_sessions',
      columns: [
        { name: 'user_id', type: 'string' },
        { name: 'email', type: 'string' },
        { name: 'name', type: 'string' },
        { name: 'role', type: 'string' },
        { name: 'token', type: 'string' },
      ],
    }),
  ],
})
