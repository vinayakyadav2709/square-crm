import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useSync } from '@/store/sync'
import { ActivityIndicator } from 'react-native-paper'

export function SyncIndicator() {
  const { isSyncing, lastSyncAt, lastSyncError } = useSync()

  if (!isSyncing && !lastSyncError) return null

  return (
    <View style={styles.container}>
      {isSyncing ? (
        <>
          <ActivityIndicator size="small" />
          <Text style={styles.text}>Syncing...</Text>
        </>
      ) : lastSyncError ? (
        <Text style={styles.error}>Sync failed: {lastSyncError}</Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#f0f0f0',
    gap: 8,
  },
  text: { fontSize: 12, color: '#666' },
  error: { fontSize: 12, color: '#d32f2f' },
})
