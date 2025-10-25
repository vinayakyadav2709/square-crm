import React, { useState } from 'react'
import { StyleSheet, View, ScrollView } from 'react-native'
import { Text, TextInput, Button } from 'react-native-paper'
import { useLocalSearchParams, useRouter, Stack } from 'expo-router'
import { database } from '@/db'
import CallLog from '@/db/models/CallLog'
import { useAuth } from '@/store/auth'
import { syncDatabase } from '@/store/sync'

export default function AddCallLogModal() {
  const { leadId } = useLocalSearchParams<{ leadId: string }>()
  const router = useRouter()
  const { user } = useAuth()
  
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (!note.trim() || !user || !leadId) return

    setLoading(true)
    try {
      await database.write(async () => {
        await database.get<CallLog>('call_logs').create((callLog) => {
          callLog.leadId = leadId
          callLog.calledBy = user.id
          callLog.logNote = note.trim()
          callLog.callDate = new Date()
        })
      })

      // Sync after creating call log
      const result = await syncDatabase()
      if (!result.success) {
        alert(`Warning: Call log saved locally but sync failed: ${result.error}`)
      }
      
      router.back()
    } catch (error: any) {
      console.error('Error saving call log:', error)
      alert(`Failed to save call log: ${error.message}`)
      setLoading(false)
    }
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Add Call Log',
          presentation: 'modal',
        }}
      />
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <Text variant="titleMedium" style={styles.title}>
            Record Call Details
          </Text>

          <TextInput
            label="Call Notes"
            value={note}
            onChangeText={setNote}
            mode="outlined"
            multiline
            numberOfLines={6}
            placeholder="What was discussed in the call?"
            style={styles.input}
          />

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
              disabled={!note.trim() || loading}
              loading={loading}
              style={styles.button}
            >
              Save Log
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
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
  },
})
