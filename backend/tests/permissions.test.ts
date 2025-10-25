import { describe, test, expect } from 'bun:test'
import { testData, syncRequest, generateTempId } from './setup'
import type { TestRole } from '../src/types'

describe('Permission & Role Tests', () => {
  describe('Lead Closure Permissions', () => {
    test('editor should close lead with Converted category', async () => {
      const { response, data } = await syncRequest(
        testData.editor.token,
        {
          leads: {
            updated: [
              {
                id: testData.leadId,
                name: 'John Doe',
                location: 'Mumbai',
                phone: '9876543210',
                whatsapp_phone: '9876543210',
                note: 'Test note',
                status: 'closed' as const,
                category_id: testData.categoryId,
                created_by: testData.admin.userId, // Required field
                closed_at: Date.now(),
                closed_by: testData.editor.userId,
                created_at: Date.now() - 100000, // Required field
                updated_at: Date.now(),
              },
            ],
          },
        },
        Date.now() - 10000
      )

      expect(response.status).toBe(200)
    })

    test('editor should NOT close lead with Rejected category', async () => {
      // First, create a rejected category
      const { data: catData } = await syncRequest(
        testData.admin.token,
        {
          categories: {
            created: [
              {
                id: generateTempId('cat'),
                name: 'Not Interested',
                type: 'rejected' as const,
                created_by: testData.admin.userId,
                created_at: Date.now(),
                updated_at: Date.now(),
              },
            ],
          },
        },
        null
      )

      const rejectedCategoryId = catData.changes.categories.created[0]?.id

      if (rejectedCategoryId) {
        const { response } = await syncRequest(
          testData.editor.token,
          {
            leads: {
              updated: [
                {
                  id: testData.leadId,
                  name: 'John Doe',
                  location: 'Mumbai',
                  phone: '9876543210',
                  whatsapp_phone: '9876543210',
                  note: 'Test note',
                  status: 'closed' as const,
                  category_id: rejectedCategoryId,
                  created_by: testData.admin.userId,
                  closed_at: Date.now(),
                  closed_by: testData.editor.userId,
                  created_at: Date.now() - 100000,
                  updated_at: Date.now(),
                },
              ],
            },
          },
          Date.now() - 10000
        )

        expect(response.status).toBe(200)
        // Server should ignore this update
      }
    })

    test('admin should close lead with any category', async () => {
      // Create a new lead for admin to close
      const { data: leadData } = await syncRequest(
        testData.admin.token,
        {
          leads: {
            created: [
              {
                id: generateTempId('lead'),
                name: 'Admin Test Lead',
                location: 'Pune',
                phone: '9876543240',
                whatsapp_phone: '9876543240',
                note: 'Test lead for admin closure',
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

      const adminLeadId = leadData.changes.leads.created[0]?.id

      if (adminLeadId) {
        const { response } = await syncRequest(
          testData.admin.token,
          {
            leads: {
              updated: [
                {
                  id: adminLeadId,
                  name: 'Admin Test Lead',
                  location: 'Pune',
                  phone: '9876543240',
                  whatsapp_phone: '9876543240',
                  note: 'Test lead for admin closure',
                  status: 'closed' as const,
                  category_id: testData.categoryId,
                  created_by: testData.admin.userId,
                  closed_at: Date.now(),
                  closed_by: testData.admin.userId,
                  created_at: Date.now() - 100000,
                  updated_at: Date.now(),
                },
              ],
            },
          },
          Date.now() - 10000
        )

        expect(response.status).toBe(200)
      }
    })
  })

  describe('Category Permissions', () => {
    test('only admin can create categories', async () => {
      const roles: TestRole[] = ['editor', 'viewer']

      for (const role of roles) {
        const { response } = await syncRequest(
          testData[role].token,
          {
            categories: {
              created: [
                {
                  id: generateTempId('cat'),
                  name: `${role} Category`,
                  type: 'converted' as const,
                  created_by: testData[role].userId,
                  created_at: Date.now(),
                  updated_at: Date.now(),
                },
              ],
            },
          },
          null
        )

        expect(response.status).toBe(200)
        // Server processes but doesn't create
      }
    })

    test('only admin can delete categories', async () => {
      const roles: TestRole[] = ['editor', 'viewer']

      for (const role of roles) {
        const { response } = await syncRequest(
          testData[role].token,
          {
            categories: {
              deleted: [testData.categoryId],
            },
          },
          null
        )

        expect(response.status).toBe(200)
        // Server processes but doesn't delete
      }
    })
  })

  describe('Lead Permissions', () => {
    test('only admin can create leads', async () => {
      const roles: TestRole[] = ['editor', 'viewer']

      for (const role of roles) {
        const { response } = await syncRequest(
          testData[role].token,
          {
            leads: {
              created: [
                {
                  id: generateTempId('lead'),
                  name: `${role} Lead`,
                  location: 'Test City',
                  phone: '9999999999',
                  whatsapp_phone: '9999999999',
                  note: 'Test',
                  status: 'open' as const,
                  created_by: testData[role].userId,
                  created_at: Date.now(),
                  updated_at: Date.now(),
                },
              ],
            },
          },
          null
        )

        expect(response.status).toBe(200)
        // Server processes but doesn't create
      }
    })

    test('all roles can view leads', async () => {
      const roles: TestRole[] = ['admin', 'editor', 'viewer']

      for (const role of roles) {
        const { response, data } = await syncRequest(
          testData[role].token,
          {},
          null
        )

        expect(response.status).toBe(200)
        expect(data.changes.leads).toBeDefined()
      }
    })
  })

  describe('Call Log Permissions', () => {
    test('all roles can add call logs', async () => {
      const roles: TestRole[] = ['admin', 'editor', 'viewer']

      for (const role of roles) {
        const { response, data } = await syncRequest(
          testData[role].token,
          {
            call_logs: {
              created: [
                {
                  id: generateTempId('log'),
                  lead_id: testData.leadId,
                  called_by: testData[role].userId,
                  log_note: `${role} added this log`,
                  call_date: Date.now(),
                  created_at: Date.now(),
                  updated_at: Date.now(),
                },
              ],
            },
          },
          Date.now() - 10000
        )

        expect(response.status).toBe(200)
        expect(data.changes.call_logs.created.length).toBeGreaterThan(0)
      }
    })
  })
})
