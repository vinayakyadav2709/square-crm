import { schemaMigrations, createTable, addColumns } from '@nozbe/watermelondb/Schema/migrations'

export default schemaMigrations({
  migrations: [
    // Migration from version 2 to 3
    {
      toVersion: 3,
      steps: [
        // Drop old deals table
        // (WatermelonDB will handle this automatically when schema changes)
        
        // Create new leads table
        createTable({
          name: 'leads',
          columns: [
            { name: 'name', type: 'string' },
            { name: 'location', type: 'string' },
            { name: 'phone', type: 'string' },
            { name: 'whatsapp_phone', type: 'string' },
            { name: 'note', type: 'string', isOptional: true },
            { name: 'status', type: 'string' },
            { name: 'category_id', type: 'string', isOptional: true },
            { name: 'created_by', type: 'string' },
            { name: 'closed_at', type: 'number', isOptional: true },
            { name: 'closed_by', type: 'string', isOptional: true },
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
            { name: 'deleted_at', type: 'number', isOptional: true },
          ],
        }),

        // Create call_logs table
        createTable({
          name: 'call_logs',
          columns: [
            { name: 'lead_id', type: 'string', isIndexed: true },
            { name: 'called_by', type: 'string' },
            { name: 'log_note', type: 'string' },
            { name: 'call_date', type: 'number' },
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
            { name: 'deleted_at', type: 'number', isOptional: true },
          ],
        }),

        // Create categories table
        createTable({
          name: 'categories',
          columns: [
            { name: 'name', type: 'string' },
            { name: 'type', type: 'string' },
            { name: 'created_by', type: 'string' },
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
            { name: 'deleted_at', type: 'number', isOptional: true },
          ],
        }),
      ],
    },
  ],
})
