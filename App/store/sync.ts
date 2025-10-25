import { synchronize, SyncDatabaseChangeSet } from '@nozbe/watermelondb/sync'
import { database } from '@/db'
import { useAuth } from '@/store/auth'
import { getApiUrl, API_ENDPOINTS } from '@/constants/api'

// Define our custom change set types
interface CustomChangeSet extends SyncDatabaseChangeSet {
  leads?: {
    created: any[]
    updated: any[]
    deleted: string[]
  }
  call_logs?: {
    created: any[]
    updated: any[]
    deleted: string[]
  }
  categories?: {
    created: any[]
    updated: any[]
    deleted: string[]
  }
}

export async function syncDatabase() {
  const { token, isAuthenticated } = useAuth.getState()

  if (!isAuthenticated || !token) {
    console.log('⏭️ Skipping sync: Not authenticated')
    return { success: false, error: 'Not authenticated' }
  }

  try {
    console.log('🔄 Starting sync...')
    const startTime = Date.now()

    await synchronize({
      database,
      pullChanges: async ({ lastPulledAt }) => {
        console.log('📥 Pulling changes since:', lastPulledAt ? new Date(lastPulledAt) : 'beginning')

        const response = await fetch(getApiUrl(API_ENDPOINTS.SYNC), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            changes: {
              leads: { created: [], updated: [], deleted: [] },
              call_logs: { created: [], updated: [], deleted: [] },
              categories: { created: [], updated: [], deleted: [] },
            },
            lastPulledAt,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Pull failed')
        }

        const { changes, timestamp } = await response.json()
        
        console.log('📥 Pulled:', {
          leads: changes.leads?.created?.length || 0,
          callLogs: changes.call_logs?.created?.length || 0,
          categories: changes.categories?.created?.length || 0,
        })

        return { changes, timestamp }
      },

      pushChanges: async ({ changes, lastPulledAt }) => {
        const customChanges = changes as CustomChangeSet
        
        const leadChanges = customChanges.leads || { created: [], updated: [], deleted: [] }
        const callLogChanges = customChanges.call_logs || { created: [], updated: [], deleted: [] }
        const categoryChanges = customChanges.categories || { created: [], updated: [], deleted: [] }

        console.log('📤 Pushing:', {
          leads: {
            created: leadChanges.created?.length || 0,
            updated: leadChanges.updated?.length || 0,
            deleted: leadChanges.deleted?.length || 0,
          },
          call_logs: {
            created: callLogChanges.created?.length || 0,
            updated: callLogChanges.updated?.length || 0,
            deleted: callLogChanges.deleted?.length || 0,
          },
          categories: {
            created: categoryChanges.created?.length || 0,
            updated: categoryChanges.updated?.length || 0,
            deleted: categoryChanges.deleted?.length || 0,
          },
        })

        const response = await fetch(getApiUrl(API_ENDPOINTS.SYNC), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ 
            changes: {
              leads: leadChanges,
              call_logs: callLogChanges,
              categories: categoryChanges,
            }, 
            lastPulledAt 
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Push failed')
        }
      },
    })

    const duration = Date.now() - startTime
    console.log(`✅ Sync completed in ${duration}ms`)
    return { success: true }

  } catch (error: any) {
    console.error('❌ Sync failed:', error.message)
    return { success: false, error: error.message }
  }
}
