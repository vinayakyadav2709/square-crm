import { db } from './client'
import { categories, users } from './schema'
import { eq } from 'drizzle-orm'

export async function seedCategories() {
  // Get first admin user
  const adminUser = await db.query.users.findFirst({
    where: eq(users.role, 'admin'),
  })

  if (!adminUser) {
    console.log('⚠️  No admin user found. Create admin first.')
    return
  }

  const defaultCategories = [
    { name: 'Converted', type: 'converted' as const },
    { name: 'No Money', type: 'rejected' as const },
    { name: 'Not Interested', type: 'rejected' as const },
    { name: 'No Stock', type: 'rejected' as const },
  ]

  for (const cat of defaultCategories) {
    const existing = await db.query.categories.findFirst({
      where: eq(categories.name, cat.name),
    })

    if (!existing) {
      await db.insert(categories).values({
        name: cat.name,
        type: cat.type,
        createdBy: adminUser.id,
      })
      console.log(`✅ Created category: ${cat.name}`)
    }
  }

  console.log('✅ Categories seeded')
  process.exit(0)
}

seedCategories()
