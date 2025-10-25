import { describe, test, expect } from 'bun:test'
import { testData, syncRequest, generateTempId } from './setup'

describe('Call Logs Tests', () => {
  describe('Call Log Creation', () => {
    test('admin should add call log via sync', async () => {
      const { response, data } = await syncRequest(
        testData.admin.token,
        {
          call_logs: {
            created: [
              {
                id: generateTempId('log'),
                lead_id: testData.leadId,
                called_by: testData.admin.userId,
                log_note: 'Initial contact - customer interested',
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

      if (data.changes.call_logs.created.length > 0) {
        testData.callLogId = data.changes.call_logs.created[0].id
      }
    })

    test('editor should add call log via sync', async () => {
      const { response, data } = await syncRequest(
        testData.editor.token,
        {
          call_logs: {
            created: [
              {
                id: generateTempId('log'),
                lead_id: testData.leadId,
                called_by: testData.editor.userId,
                log_note: 'Follow-up call - discussed pricing',
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
    })

    test('viewer can add call log', async () => {
      const { response, data } = await syncRequest(
        testData.viewer.token,
        {
          call_logs: {
            created: [
              {
                id: generateTempId('log'),
                lead_id: testData.leadId,
                called_by: testData.viewer.userId,
                log_note: 'Quick check-in call',
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
    })
  })

  describe('Call Log Sync Pull', () => {
    test('should pull all call logs', async () => {
      const { response, data } = await syncRequest(
        testData.admin.token,
        {},
        null
      )

      expect(response.status).toBe(200)
      expect(data.changes.call_logs).toBeDefined()
      expect(data.changes.call_logs.created.length).toBeGreaterThan(0)
    })

    test('should pull call logs since lastPulledAt', async () => {
      const lastPulledAt = Date.now() - 10000

      const { response, data } = await syncRequest(
        testData.editor.token,
        {},
        lastPulledAt
      )

      expect(response.status).toBe(200)
      expect(data.changes.call_logs).toBeDefined()
    })
  })

  describe('Multiple Call Logs', () => {
    test('should handle multiple call logs in one sync', async () => {
      const { response, data } = await syncRequest(
        testData.admin.token,
        {
          call_logs: {
            created: [
              {
                id: generateTempId('log'),
                lead_id: testData.leadId,
                called_by: testData.admin.userId,
                log_note: 'Call 1 - Left voicemail',
                call_date: Date.now() - 3600000,
                created_at: Date.now(),
                updated_at: Date.now(),
              },
              {
                id: generateTempId('log'),
                lead_id: testData.leadId,
                called_by: testData.admin.userId,
                log_note: 'Call 2 - Customer called back',
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
      expect(data.changes.call_logs.created.length).toBeGreaterThanOrEqual(2)
    })
  })
})
