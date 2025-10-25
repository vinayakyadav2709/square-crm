import React, { useState } from 'react'
import { StyleSheet, View, ScrollView } from 'react-native'
import { Text, TextInput, Button, SegmentedButtons } from 'react-native-paper'
import { useRouter, Stack } from 'expo-router'
import { database } from '@/db'
import Category from '@/db/models/Category'
import { useAuth } from '@/store/auth'
import { syncDatabase } from '@/store/sync'

type CategoryType = 'converted' | 'rejected'

export default function AddCategoryModal() {
  const router = useRouter()
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [type, setType] = useState<CategoryType>('converted')
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (!name.trim() || !user) return

    setLoading(true)
    try {
      await database.write(async () => {
        await database.get<Category>('categories').create((category) => {
          category.name = name.trim()
          category.type = type
          category.createdBy = user.id
        })
      })

      // Sync after adding
      const result = await syncDatabase()
      if (!result.success) {
        alert(`Warning: Category created locally but sync failed: ${result.error}`)
      }
      router.back()
    } catch (error: any) {
      console.error('Error adding category:', error)
      alert(`Failed to add category: ${error.message}`)
      setLoading(false)
    }
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Add Category',
          presentation: 'modal',
        }}
      />
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <Text variant="titleMedium" style={styles.title}>
            Create New Category
          </Text>

          <TextInput
            label="Category Name *"
            value={name}
            onChangeText={setName}
            mode="outlined"
            placeholder="e.g., Deal Closed, No Budget"
            style={styles.input}
          />

          <Text style={styles.label}>Category Type *</Text>
          <SegmentedButtons
            value={type}
            onValueChange={(value) => setType(value as CategoryType)}
            buttons={[
              {
                value: 'converted',
                label: 'Converted',
                icon: 'check-circle',
              },
              {
                value: 'rejected',
                label: 'Rejected',
                icon: 'close-circle',
              },
            ]}
            style={styles.segmented}
          />

          <View style={styles.info}>
            <Text style={styles.infoText}>
              <Text style={styles.bold}>Converted:</Text> Lead successfully became a customer
            </Text>
            <Text style={styles.infoText}>
              <Text style={styles.bold}>Rejected:</Text> Lead was not converted (admin only)
            </Text>
          </View>

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
              onPress={handleSave}
              disabled={!name.trim() || loading}
              loading={loading}
              style={styles.button}
            >
              Create Category
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
  input: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#607d8b',
    marginBottom: 8,
  },
  segmented: {
    marginBottom: 16,
  },
  info: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  infoText: {
    fontSize: 13,
    color: '#263238',
    marginBottom: 4,
  },
  bold: {
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
  },
})
