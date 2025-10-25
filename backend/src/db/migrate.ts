// backend/src/db/migrate.ts
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'

const runMigrations = async () => {
  const connectionString = process.env.DATABASE_URL!
  const client = postgres(connectionString, { max: 1 })
  const db = drizzle(client)

  console.log('⏳ Running migrations...')
  await migrate(db, { migrationsFolder: './drizzle' })
  console.log('✅ Migrations completed!')

  await client.end()
}

runMigrations().catch((err) => {
  console.error('❌ Migration failed:', err)
  process.exit(1)
})
