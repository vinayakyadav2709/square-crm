import React, { useState, useEffect } from 'react'
import { StyleSheet, View, ScrollView } from 'react-native'
import { Text, Button, RadioButton } from 'react-native-paper'
import { useLocalSearchParams, useRouter, Stack } from 'expo-router'
import { database } from '@/db'
import Lead from '@/db/models/Lead'
import Category from '@/db/models/Category'
import { useAuth } from '@/store/auth'
import { syncDatabase } from '@/store/sync'
import { Q } from '@nozbe/watermelondb'

export default function CloseLeadModal() {
  const { leadId } = useLocalSearchParams<{ leadId: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [loading, setLoading] = useState(false)

  const isAdmin = user?.role === 'admin'
  const isEditor = user?.role === 'editor'

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      // ✅ FIXED - Removed Q.where('deleted_at', null)
      const allCategories = await database
        .get<Category>('categories')
        .query() // WatermelonDB automatically excludes deleted records
        .fetch()

      // Filter categories based on role
      const filtered = isAdmin
        ? allCategories // Admin sees all
        : allCategories.filter((cat) => cat.type === 'converted') // Editor only sees Converted

      setCategories(filtered)
      if (filtered.length > 0) {
        setSelectedCategory(filtered[0].id)
      }
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const handleClose = async () => {
    if (!selectedCategory || !user || !leadId) return

    setLoading(true)
    try {
      await database.write(async () => {
        const lead = await database.get<Lead>('leads').find(leadId)
        await lead.update((l) => {
          l.status = 'closed'
          l.categoryId = selectedCategory
          l.closedAt = new Date()
          l.closedBy = user.id
        })
      })

      // Sync after closing
      const result = await syncDatabase()
      if (!result.success) {
        alert(`Warning: Lead closed locally but sync failed: ${result.error}`)
      }
      router.back()
    } catch (error: any) {
      console.error('Error closing lead:', error)
      alert(`Failed to close lead: ${error.message}`)
      setLoading(false)
    }
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Close Lead',
          presentation: 'modal',
        }}
      />
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <Text variant="titleMedium" style={styles.title}>
            Select Closure Reason
          </Text>

          {categories.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No categories available</Text>
              <Text style={styles.emptyHint}>
                {isEditor
                  ? 'No "Converted" categories found. Ask an admin to create one.'
                  : 'Create categories first to close leads.'}
              </Text>
            </View>
          ) : (
            <RadioButton.Group
              onValueChange={setSelectedCategory}
              value={selectedCategory}
            >
              {categories.map((category) => (
                <View key={category.id} style={styles.radioItem}>
                  <RadioButton.Item
                    label={category.name}
                    value={category.id}
                    status={selectedCategory === category.id ? 'checked' : 'unchecked'}
                  />
                  <Text style={styles.categoryType}>({category.type})</Text>
                </View>
              ))}
            </RadioButton.Group>
          )}

          <View style={styles.actions}>
            <Button
              mode="outlined"
              onPress={() => router.back()}
              disabled={loading}
              style={styles.button}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleClose}
              disabled={!selectedCategory || loading || categories.length === 0}
              loading={loading}
              style={styles.button}
            >
              Close Lead
            </Button>
          </View>
        </View>
      </ScrollView>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fb',
  },
  content: {
    padding: 16,
  },
  title: {
    color: '#263238',
    marginBottom: 16,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginBottom: 8,
    borderRadius: 8,
  },
  categoryType: {
    fontSize: 12,
    color: '#90a4ae',
    marginRight: 16,
  },
  empty: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#607d8b',
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 14,
    color: '#90a4ae',
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  button: {
    flex: 1,
  },
})
