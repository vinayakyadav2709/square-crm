import React, { useState } from 'react'
import { StyleSheet, View, ScrollView } from 'react-native'
import { Text, TextInput, Button } from 'react-native-paper'
import { useRouter, Stack } from 'expo-router'
import { database } from '@/db'
import Lead from '@/db/models/Lead'
import { useAuth } from '@/store/auth'
import { syncDatabase } from '@/store/sync'

export default function AddLeadModal() {
  const router = useRouter()
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [phone, setPhone] = useState('')
  const [whatsappPhone, setWhatsappPhone] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (!name.trim() || !location.trim() || !phone.trim() || !whatsappPhone.trim() || !user) {
      return
    }

    setLoading(true)
    try {
      await database.write(async () => {
        await database.get<Lead>('leads').create((lead) => {
          lead.name = name.trim()
          lead.location = location.trim()
          lead.phone = phone.trim()
          lead.whatsappPhone = whatsappPhone.trim()
          lead.note = note.trim()
          lead.status = 'open'
          lead.createdBy = user.id
        })
      })

      // Sync after adding
      const result = await syncDatabase()
      if (!result.success) {
        alert(`Warning: Lead created locally but sync failed: ${result.error}`)
      }
      router.back()
    } catch (error: any) {
      console.error('Error adding lead:', error)
      alert(`Failed to add lead: ${error.message}`)
      setLoading(false)
    }
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Add Lead',
          presentation: 'modal',
        }}
      />
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <Text variant="titleMedium" style={styles.title}>
            Create New Lead
          </Text>

          <TextInput
            label="Name *"
            value={name}
            onChangeText={setName}
            mode="outlined"
            style={styles.input}
            left={<TextInput.Icon icon="account" />}
            placeholder="John Doe"
          />

          <TextInput
            label="Location *"
            value={location}
            onChangeText={setLocation}
            mode="outlined"
            style={styles.input}
            left={<TextInput.Icon icon="map-marker" />}
            placeholder="Mumbai, Maharashtra"
          />

          <TextInput
            label="Phone *"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            mode="outlined"
            style={styles.input}
            left={<TextInput.Icon icon="phone" />}
            placeholder="9876543210"
          />

          <TextInput
            label="WhatsApp Phone *"
            value={whatsappPhone}
            onChangeText={setWhatsappPhone}
            keyboardType="phone-pad"
            mode="outlined"
            style={styles.input}
            left={<TextInput.Icon icon="whatsapp" />}
            placeholder="9876543210"
          />

          <TextInput
            label="Note"
            value={note}
            onChangeText={setNote}
            mode="outlined"
            multiline
            numberOfLines={4}
            style={styles.input}
            left={<TextInput.Icon icon="note-text" />}
            placeholder="Any additional information..."
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
              disabled={
                !name.trim() ||
                !location.trim() ||
                !phone.trim() ||
                !whatsappPhone.trim() ||
                loading
              }
              loading={loading}
              style={styles.button}
            >
              Add Lead
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
    marginBottom: 12,
    backgroundColor: '#fff',
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
