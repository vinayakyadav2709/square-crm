import { Hono } from 'hono'
import { db } from '../db/client'
import { leads, callLogs, categories, users } from '../db/schema'
import { authMiddleware } from '../middleware/auth'
import { eq, and, gt, isNull, inArray } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import type { 
  SyncRequest, 
  SyncResponse, 
  ClientLead, 
  ClientCallLog, 
  ClientCategory,
  HonoVariables 
} from '../types'

export const syncRoutes = new Hono<{ Variables: HonoVariables }>()

syncRoutes.use('*', authMiddleware)

syncRoutes.post('/', async (c) => {
  try {
    const userId = c.get('userId')
    const body = await c.req.json() as SyncRequest
    const { changes, lastPulledAt } = body

    console.log('🔄 Sync request from userId:', userId)

    // Get user info for validation
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    })

    if (!user) {
      return c.json({ error: 'User not found' }, 404)
    }

    // ============================================
    // PUSH: Process client changes to server
    // ============================================

    // ---- Leads ----
    if (changes?.leads?.created) {
      for (const lead of changes.leads.created) {
        // Only admin can create leads
        if (user.role !== 'admin') {
          console.log(`❌ User ${userId} (${user.role}) cannot create leads`)
          continue
        }

        const serverId = randomUUID()
        await db.insert(leads).values({
          id: serverId,
          name: lead.name,
          location: lead.location,
          phone: lead.phone,
          whatsappPhone: lead.whatsapp_phone,
          note: lead.note,
          status: lead.status || 'open',
          categoryId: lead.category_id,
          createdBy: userId,
          createdAt: new Date(lead.created_at || Date.now()),
          updatedAt: new Date(lead.updated_at || Date.now()),
        })
        console.log(`✅ Created lead: ${lead.name} (${serverId})`)
      }
    }

    if (changes?.leads?.updated) {
      for (const lead of changes.leads.updated) {
        // Validate lead closure
        if (lead.status === 'closed' && lead.category_id) {
          const category = await db.query.categories.findFirst({
            where: eq(categories.id, lead.category_id),
          })

          if (category) {
            // Employee can only close with "Converted"
            if (user.role === 'editor' && category.type !== 'converted') {
              console.log(`❌ Employee cannot close with category: ${category.name}`)
              continue
            }
          }
        }

        await db.update(leads)
          .set({
            name: lead.name,
            location: lead.location,
            phone: lead.phone,
            whatsappPhone: lead.whatsapp_phone,
            note: lead.note,
            status: lead.status,
            categoryId: lead.category_id,
            closedAt: lead.closed_at ? new Date(lead.closed_at) : null,
            closedBy: lead.closed_by,
            updatedAt: new Date(),
          })
          .where(eq(leads.id, lead.id))

        console.log(`✅ Updated lead: ${lead.id}`)
      }
    }

    if (changes?.leads?.deleted) {
      await db.update(leads)
        .set({ deletedAt: new Date() })
        .where(inArray(leads.id, changes.leads.deleted))
      console.log(`✅ Deleted ${changes.leads.deleted.length} leads`)
    }

    // ---- Call Logs ----
    if (changes?.call_logs?.created) {
      for (const log of changes.call_logs.created) {
        const serverId = randomUUID()
        await db.insert(callLogs).values({
          id: serverId,
          leadId: log.lead_id,
          calledBy: log.called_by,
          logNote: log.log_note,
          callDate: new Date(log.call_date || Date.now()),
          createdAt: new Date(log.created_at || Date.now()),
          updatedAt: new Date(log.updated_at || Date.now()),
        })
        console.log(`✅ Created call log: ${serverId}`)
      }
    }

    // ---- Categories ----
    if (changes?.categories?.created) {
      for (const cat of changes.categories.created) {
        // Only admin can create categories
        if (user.role !== 'admin') {
          console.log(`❌ User ${userId} cannot create categories`)
          continue
        }

        const serverId = randomUUID()
        await db.insert(categories).values({
          id: serverId,
          name: cat.name,
          type: cat.type,
          createdBy: userId,
          createdAt: new Date(cat.created_at || Date.now()),
          updatedAt: new Date(cat.updated_at || Date.now()),
        })
        console.log(`✅ Created category: ${cat.name}`)
      }
    }

    if (changes?.categories?.deleted) {
      // Only admin can delete categories
      if (user.role === 'admin') {
        await db.update(categories)
          .set({ deletedAt: new Date() })
          .where(inArray(categories.id, changes.categories.deleted))
        console.log(`✅ Deleted ${changes.categories.deleted.length} categories`)
      }
    }

    // ============================================
    // PULL: Get server changes since lastPulledAt
    // ============================================

    const timestamp = lastPulledAt ? new Date(lastPulledAt) : new Date(0)

    // ---- Leads ----
    const serverLeads = await db.select()
      .from(leads)
      .where(
        and(
          gt(leads.updatedAt, timestamp),
          isNull(leads.deletedAt)
        )
      )

    const createdLeads: ClientLead[] = serverLeads
      .filter(l => new Date(l.createdAt) > timestamp)
      .map(l => ({
        id: l.id,
        name: l.name,
        location: l.location,
        phone: l.phone,
        whatsapp_phone: l.whatsappPhone,
        note: l.note,
        status: l.status,
        category_id: l.categoryId,
        created_by: l.createdBy,
        closed_at: l.closedAt?.getTime() || null,
        closed_by: l.closedBy,
        created_at: l.createdAt.getTime(),
        updated_at: l.updatedAt.getTime(),
      }))

    const updatedLeads: ClientLead[] = serverLeads
      .filter(l => new Date(l.createdAt) <= timestamp)
      .map(l => ({
        id: l.id,
        name: l.name,
        location: l.location,
        phone: l.phone,
        whatsapp_phone: l.whatsappPhone,
        note: l.note,
        status: l.status,
        category_id: l.categoryId,
        created_by: l.createdBy,
        closed_at: l.closedAt?.getTime() || null,
        closed_by: l.closedBy,
        created_at: l.createdAt.getTime(),
        updated_at: l.updatedAt.getTime(),
      }))

    // ---- Call Logs ----
    const serverCallLogs = await db.select()
      .from(callLogs)
      .where(
        and(
          gt(callLogs.updatedAt, timestamp),
          isNull(callLogs.deletedAt)
        )
      )

    const createdCallLogs: ClientCallLog[] = serverCallLogs
      .filter(c => new Date(c.createdAt) > timestamp)
      .map(c => ({
        id: c.id,
        lead_id: c.leadId,
        called_by: c.calledBy,
        log_note: c.logNote,
        call_date: c.callDate.getTime(),
        created_at: c.createdAt.getTime(),
        updated_at: c.updatedAt.getTime(),
      }))

    // ---- Categories ----
    const serverCategories = await db.select()
      .from(categories)
      .where(
        and(
          gt(categories.updatedAt, timestamp),
          isNull(categories.deletedAt)
        )
      )

    const createdCategories: ClientCategory[] = serverCategories
      .filter(c => new Date(c.createdAt) > timestamp)
      .map(c => ({
        id: c.id,
        name: c.name,
        type: c.type,
        created_by: c.createdBy,
        created_at: c.createdAt.getTime(),
        updated_at: c.updatedAt.getTime(),
      }))

    console.log('📤 Sending:', {
      leads: { created: createdLeads.length, updated: updatedLeads.length },
      call_logs: { created: createdCallLogs.length },
      categories: { created: createdCategories.length },
    })

    const response: SyncResponse = {
      changes: {
        leads: {
          created: createdLeads,
          updated: updatedLeads,
          deleted: [],
        },
        call_logs: {
          created: createdCallLogs,
          updated: [],
          deleted: [],
        },
        categories: {
          created: createdCategories,
          updated: [],
          deleted: [],
        },
      },
      timestamp: Date.now(),
    }

    return c.json(response)

  } catch (error: any) {
    console.error('❌ Sync error:', error)
    return c.json({ error: error.message || 'Sync failed' }, 500)
  }
})
