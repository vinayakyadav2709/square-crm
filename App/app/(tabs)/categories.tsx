import React, { useState } from 'react'
import { ScrollView, StyleSheet, View, RefreshControl } from 'react-native'
import { Text, FAB, Card, Chip, IconButton, Snackbar } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { database } from '@/db'
import Category from '@/db/models/Category'
import { withObservables } from '@nozbe/watermelondb/react'
import { syncDatabase } from '@/store/sync'
import { useAuth } from '@/store/auth'
import { useRouter } from 'expo-router'

interface CategoriesScreenProps {
  categories: Category[]
}

function CategoriesScreen({ categories }: CategoriesScreenProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [refreshing, setRefreshing] = useState(false)
  const [snackVisible, setSnackVisible] = useState(false)
  const [snackMessage, setSnackMessage] = useState('')

  const isAdmin = user?.role === 'admin'

  const onRefresh = async () => {
    setRefreshing(true)
    await syncDatabase()
    setRefreshing(false)
  }

  const handleDelete = async (category: Category) => {
  try {
      await database.write(async () => {
      // ✅ CORRECT - Use WatermelonDB's markAsDeleted()
      await category.markAsDeleted()
      })
      
      const result = await syncDatabase()
      setSnackMessage(result.success ? '✓ Category deleted' : `✗ ${result.error}`)
      setSnackVisible(true)
  } catch (error: any) {
      setSnackMessage(`✗ Delete failed: ${error.message}`)
      setSnackVisible(true)
  }
  }


  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.headerRow}>
          <MaterialCommunityIcons name="tag-multiple" size={24} color="#263238" />
          <Text variant="headlineSmall" style={styles.headerText}>
            Categories
          </Text>
        </View>
        <Text style={styles.subText}>{categories.length} categories</Text>

        {categories.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="tag-off" size={64} color="#cfd8dc" />
            <Text style={styles.emptyText}>No categories yet</Text>
            <Text style={styles.emptyHint}>Tap + to add a category</Text>
          </View>
        ) : (
          categories.map((category) => (
            <Card key={category.id} style={styles.card}>
              <Card.Content>
                <View style={styles.cardHeader}>
                  <View style={styles.cardLeft}>
                    <Text style={styles.categoryName}>{category.name}</Text>
                    <Chip
                      mode="flat"
                      style={[
                        styles.typeChip,
                        category.type === 'converted' ? styles.converted : styles.rejected,
                      ]}
                      textStyle={styles.chipText}
                    >
                      {category.type}
                    </Chip>
                  </View>
                  {isAdmin && (
                    <IconButton
                      icon="delete"
                      size={20}
                      onPress={() => handleDelete(category)}
                    />
                  )}
                </View>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>

      {isAdmin && (
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => router.push('/modals/add-category')}
        />
      )}

      <Snackbar
        visible={snackVisible}
        onDismiss={() => setSnackVisible(false)}
        duration={3000}
      >
        {snackMessage}
      </Snackbar>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fb' },
  content: { padding: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  headerText: { color: '#263238' },
  subText: { color: '#607d8b', marginBottom: 16 },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    color: '#90a4ae',
    marginTop: 16,
  },
  emptyHint: {
    fontSize: 14,
    color: '#b0bec5',
    marginTop: 8,
  },
  card: {
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLeft: {
    flex: 1,
    gap: 8,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#263238',
  },
  typeChip: {
    alignSelf: 'flex-start',
    height: 24,
  },
  converted: {
    backgroundColor: '#e8f5e9',
  },
  rejected: {
    backgroundColor: '#ffebee',
  },
  chipText: {
    fontSize: 11,
    marginVertical: 0,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 24,
  },
})

const enhance = withObservables([], () => ({
  categories: database
    .get<Category>('categories')  // ← Add <Category> here!
    .query()
    .observe(),
}))


export default enhance(CategoriesScreen)
