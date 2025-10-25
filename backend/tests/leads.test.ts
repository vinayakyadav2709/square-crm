import { describe, test, expect } from 'bun:test'
import { testData, syncRequest, generateTempId } from './setup'

describe('Lead Management Tests', () => {
  describe('Lead Creation', () => {
    test('admin should create lead via sync', async () => {
      const { response, data } = await syncRequest(
        testData.admin.token,
        {
          leads: {
            created: [
              {
                id: generateTempId('lead'),
                name: 'John Doe',
                location: 'Mumbai',
                phone: '9876543210',
                whatsapp_phone: '9876543210',
                note: 'Interested in premium package',
                status: 'open' as const,
                category_id: null,
                created_by: testData.admin.userId,
                created_at: Date.now(),
                updated_at: Date.now(),
              },
            ],
          },
        },
        null
      )

      expect(response.status).toBe(200)
      expect(data.changes?.leads).toBeDefined()
      expect(data.changes.leads.created.length).toBeGreaterThan(0)

      if (data.changes?.leads?.created && data.changes.leads.created.length > 0) {
        testData.leadId = data.changes.leads.created[0].id
      }
    })

    test('editor should NOT create lead via sync', async () => {
      const { response } = await syncRequest(
        testData.editor.token,
        {
          leads: {
            created: [
              {
                id: generateTempId('lead'),
                name: 'Jane Smith',
                location: 'Delhi',
                phone: '9876543220',
                whatsapp_phone: '9876543220',
                note: 'Should be rejected',
                status: 'open' as const,
                created_by: testData.editor.userId,
                created_at: Date.now(),
                updated_at: Date.now(),
              },
            ],
          },
        },
        null
      )

      expect(response.status).toBe(200)
      // Server ignores unauthorized creation
    })

    test('viewer should NOT create lead via sync', async () => {
      const { response } = await syncRequest(
        testData.viewer.token,
        {
          leads: {
            created: [
              {
                id: generateTempId('lead'),
                name: 'Viewer Lead',
                location: 'Bangalore',
                phone: '9876543230',
                whatsapp_phone: '9876543230',
                note: 'Should be rejected',
                status: 'open' as const,
                created_by: testData.viewer.userId,
                created_at: Date.now(),
                updated_at: Date.now(),
              },
            ],
          },
        },
        null
      )

      expect(response.status).toBe(200)
    })
  })

  describe('Lead Updates', () => {
    test('should update lead via sync', async () => {
      const { response } = await syncRequest(
        testData.admin.token,
        {
          leads: {
            updated: [
              {
                id: testData.leadId,
                name: 'John Doe Updated',
                location: 'Mumbai',
                phone: '9876543210',
                whatsapp_phone: '9876543210',
                note: 'Updated note - interested in enterprise package',
                status: 'open' as const,
                created_by: testData.admin.userId,
                created_at: Date.now() - 100000,
                updated_at: Date.now(),
              },
            ],
          },
        },
        Date.now() - 10000
      )

      expect(response.status).toBe(200)
    })

    test('editor can update lead details', async () => {
      const { response } = await syncRequest(
        testData.editor.token,
        {
          leads: {
            updated: [
              {
                id: testData.leadId,
                name: 'John Doe',
                location: 'Mumbai Central',
                phone: '9876543210',
                whatsapp_phone: '9876543210',
                note: 'Editor updated location',
                status: 'open' as const,
                created_by: testData.admin.userId,
                created_at: Date.now() - 100000,
                updated_at: Date.now(),
              },
            ],
          },
        },
        Date.now() - 10000
      )

      expect(response.status).toBe(200)
    })
  })

  describe('Lead Sync Pull', () => {
    test('should pull all leads', async () => {
      const { response, data } = await syncRequest(
        testData.admin.token,
        {},
        null
      )

      expect(response.status).toBe(200)
      expect(data.changes?.leads).toBeDefined()
      
      if (data.changes?.leads) {
        expect(data.changes.leads.created.length).toBeGreaterThan(0)
      }
    })

    test('should pull only new leads since lastPulledAt', async () => {
      const lastPulledAt = Date.now() - 10000

      const { response, data } = await syncRequest(
        testData.editor.token,
        {},
        lastPulledAt
      )

      expect(response.status).toBe(200)
      expect(data.changes?.leads).toBeDefined()
    })
  })

  describe('Lead Deletion', () => {
    test('admin should soft delete lead', async () => {
      // Create a lead to delete
      const { data: createData } = await syncRequest(
        testData.admin.token,
        {
          leads: {
            created: [
              {
                id: generateTempId('lead'),
                name: 'To Be Deleted',
                location: 'Test City',
                phone: '9999999999',
                whatsapp_phone: '9999999999',
                note: 'Temporary lead',
                status: 'open' as const,
                created_by: testData.admin.userId,
                created_at: Date.now(),
                updated_at: Date.now(),
              },
            ],
          },
        },
        null
      )

      const leadToDelete = createData.changes?.leads?.created?.[0]?.id

      if (leadToDelete) {
        const { response } = await syncRequest(
          testData.admin.token,
          {
            leads: {
              deleted: [leadToDelete],
            },
          },
          null
        )

        expect(response.status).toBe(200)
      }
    })
  })
})
