import { synchronize } from '@nozbe/watermelondb/sync'
import { database } from '@/db'
import { useAuth } from '@/store/auth'
import { getApiUrl, API_ENDPOINTS } from '@/constants/api'

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
              deals: { created: [], updated: [], deleted: [] }
            },
            lastPulledAt,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Pull failed')
        }

        const { changes, timestamp } = await response.json()
        console.log('📥 Pulled changes:', {
          deals: {
            created: changes.deals.created.length,
            updated: changes.deals.updated.length,
            deleted: changes.deals.deleted.length,
          }
        })
        
        return { changes, timestamp }
      },

      pushChanges: async ({ changes, lastPulledAt }) => {
        console.log('📤 Pushing changes:', {
          deals: {
            created: changes.deals?.created?.length || 0,
            updated: changes.deals?.updated?.length || 0,
            deleted: changes.deals?.deleted?.length || 0,
          }
        })

        const response = await fetch(getApiUrl(API_ENDPOINTS.SYNC), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ changes, lastPulledAt }),
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
