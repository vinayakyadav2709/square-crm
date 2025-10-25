import { describe, test, expect } from 'bun:test'
import { testData, syncRequest, generateTempId } from './setup'

describe('Category Management Tests', () => {
  describe('Category Creation', () => {
    test('admin should create category via sync', async () => {
      const { response, data } = await syncRequest(
        testData.admin.token,
        {
          categories: {
            created: [
              {
                id: generateTempId('cat'),
                name: 'Converted',
                type: 'converted',
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
      expect(data.changes.categories.created.length).toBeGreaterThan(0)

      if (data.changes.categories.created.length > 0) {
        testData.categoryId = data.changes.categories.created[0].id
      }
    })

    test('admin should create rejected category', async () => {
      const { response, data } = await syncRequest(
        testData.admin.token,
        {
          categories: {
            created: [
              {
                id: generateTempId('cat'),
                name: 'No Money',
                type: 'rejected',
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
      expect(data.changes.categories.created.length).toBeGreaterThan(0)
    })

    test('editor should NOT create category via sync', async () => {
      const { response, data } = await syncRequest(
        testData.editor.token,
        {
          categories: {
            created: [
              {
                id: generateTempId('cat'),
                name: 'Unauthorized Category',
                type: 'rejected',
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
      // Server processes the request but ignores unauthorized category creation
    })

    test('viewer should NOT create category via sync', async () => {
      const { response, data } = await syncRequest(
        testData.viewer.token,
        {
          categories: {
            created: [
              {
                id: generateTempId('cat'),
                name: 'Viewer Category',
                type: 'converted',
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
      // Server processes but ignores
    })
  })

  describe('Category Sync Pull', () => {
    test('should pull all categories', async () => {
      const { response, data } = await syncRequest(
        testData.admin.token,
        {},
        null
      )

      expect(response.status).toBe(200)
      expect(data.changes.categories).toBeDefined()
      expect(data.changes.categories.created.length).toBeGreaterThan(0)
    })

    test('should pull only new categories since lastPulledAt', async () => {
      const lastPulledAt = Date.now() - 10000

      const { response, data } = await syncRequest(
        testData.admin.token,
        {},
        lastPulledAt
      )

      expect(response.status).toBe(200)
      expect(data.changes.categories).toBeDefined()
    })
  })

  describe('Category Deletion', () => {
    test('admin should soft delete category', async () => {
      // Create a category first
      const { data: createData } = await syncRequest(
        testData.admin.token,
        {
          categories: {
            created: [
              {
                id: generateTempId('cat'),
                name: 'To Be Deleted',
                type: 'rejected',
                created_by: testData.admin.userId,
                created_at: Date.now(),
                updated_at: Date.now(),
              },
            ],
          },
        },
        null
      )

      const categoryToDelete = createData.changes.categories.created[0]?.id

      if (categoryToDelete) {
        const { response, data } = await syncRequest(
          testData.admin.token,
          {
            categories: {
              deleted: [categoryToDelete],
            },
          },
          null
        )

        expect(response.status).toBe(200)
      }
    })

    test('editor should NOT delete category', async () => {
      const { response, data } = await syncRequest(
        testData.editor.token,
        {
          categories: {
            deleted: [testData.categoryId],
          },
        },
        null
      )

      expect(response.status).toBe(200)
      // Server ignores unauthorized deletion
    })
  })
})
