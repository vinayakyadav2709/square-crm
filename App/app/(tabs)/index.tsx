import React, { useState } from 'react'
import { ScrollView, StyleSheet, View, RefreshControl } from 'react-native'
import { Text, FAB, Portal, Modal, TextInput, Button, Snackbar } from 'react-native-paper'
import LeadCard from '@/components/LeadCard'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { database } from '@/db'
import Lead from '@/db/models/Lead'
import { withObservables } from '@nozbe/watermelondb/react'
import { syncDatabase } from '@/store/sync'
import { useAuth } from '@/store/auth'
import { Q } from '@nozbe/watermelondb'

interface OpenLeadsScreenProps {
  leads: Lead[]
}

function OpenLeadsScreen({ leads }: OpenLeadsScreenProps) {
  const { user } = useAuth()
  const [visible, setVisible] = useState(false)
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [phone, setPhone] = useState('')
  const [whatsappPhone, setWhatsappPhone] = useState('')
  const [note, setNote] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' })

  const isAdmin = user?.role === 'admin'

  const resetForm = () => {
    setName('')
    setLocation('')
    setPhone('')
    setWhatsappPhone('')
    setNote('')
  }

  const handleAdd = async () => {
    if (!name || !location || !phone || !whatsappPhone || !user) return

    try {
      await database.write(async () => {
        await database.get<Lead>('leads').create((lead) => {
          lead.name = name
          lead.location = location
          lead.phone = phone
          lead.whatsappPhone = whatsappPhone
          lead.note = note
          lead.status = 'open'
          lead.createdBy = user.id
        })
      })

      resetForm()
      setVisible(false)
      setSnackbar({ visible: true, message: '✓ Lead added! Syncing...' })

      // Trigger sync after adding
      const result = await syncDatabase()
      if (!result.success) {
        setSnackbar({ visible: true, message: `✗ Sync failed: ${result.error}` })
      }
    } catch (error: any) {
      console.error('Error adding lead:', error)
      setSnackbar({ visible: true, message: `✗ Failed to add lead: ${error.message}` })
    }
  }

  const onRefresh = async () => {
    setSyncing(true)
    const result = await syncDatabase()
    setSyncing(false)
    
    if (!result.success) {
      setSnackbar({ visible: true, message: `✗ Sync failed: ${result.error}` })
    } else {
      setSnackbar({ visible: true, message: '✓ Synced successfully!' })
    }
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={syncing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.headerRow}>
          <MaterialCommunityIcons name="folder-open" size={24} color="#263238" />
          <Text variant="headlineSmall" style={styles.headerText}>
            Open Leads
          </Text>
        </View>
        <Text style={styles.subText}>
          Active pipeline • {leads.length} leads
        </Text>

        {leads.length === 0 && (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="inbox" size={64} color="#cfd8dc" />
            <Text style={styles.emptyText}>No open leads yet</Text>
            {isAdmin && (
              <Text style={styles.emptySubtext}>Tap + to add your first lead</Text>
            )}
          </View>
        )}

        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} />
        ))}
      </ScrollView>

      {isAdmin && (
        <>
          <Portal>
            <Modal
              visible={visible}
              onDismiss={() => { setVisible(false); resetForm() }}
              contentContainerStyle={styles.modal}
            >
              <Text variant="titleMedium" style={{ marginBottom: 16, color: '#263238' }}>
                Add New Lead
              </Text>

              <TextInput
                label="Name *"
                value={name}
                onChangeText={setName}
                mode="outlined"
                style={styles.input}
                left={<TextInput.Icon icon="account" />}
              />
              <TextInput
                label="Location *"
                value={location}
                onChangeText={setLocation}
                mode="outlined"
                style={styles.input}
                left={<TextInput.Icon icon="map-marker" />}
              />
              <TextInput
                label="Phone *"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                mode="outlined"
                style={styles.input}
                left={<TextInput.Icon icon="phone" />}
              />
              <TextInput
                label="WhatsApp Phone *"
                value={whatsappPhone}
                onChangeText={setWhatsappPhone}
                keyboardType="phone-pad"
                mode="outlined"
                style={styles.input}
                left={<TextInput.Icon icon="whatsapp" />}
              />
              <TextInput
                label="Note"
                value={note}
                onChangeText={setNote}
                mode="outlined"
                multiline
                numberOfLines={3}
                style={styles.input}
                left={<TextInput.Icon icon="note-text" />}
              />

              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
                <Button onPress={() => { resetForm(); setVisible(false) }}>
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleAdd}
                  disabled={!name || !location || !phone || !whatsappPhone}
                >
                  Add Lead
                </Button>
              </View>
            </Modal>
          </Portal>

          <FAB
            icon="plus"
            style={styles.fab}
            onPress={() => setVisible(true)}
            label="Add Lead"
          />
        </>
      )}

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ ...snackbar, visible: false })}
        duration={3000}
      >
        {snackbar.message}
      </Snackbar>
    </>
  )
}

// WatermelonDB observable wrapper
const enhance = withObservables([], () => ({
  leads: database
    .get<Lead>('leads')
    .query(Q.where('status', 'open'))
    .observe(),
}))

export default enhance(OpenLeadsScreen)

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fb' },
  content: { padding: 16, paddingBottom: 100 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  headerText: { color: '#263238' },
  subText: { color: '#607d8b', marginBottom: 16 },
  empty: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 80 
  },
  emptyText: { 
    fontSize: 18, 
    color: '#90a4ae', 
    marginTop: 16,
    marginBottom: 8 
  },
  emptySubtext: { 
    fontSize: 14, 
    color: '#b0bec5' 
  },
  fab: { 
    position: 'absolute', 
    right: 16, 
    bottom: 24 
  },
  modal: { 
    backgroundColor: 'white', 
    padding: 20, 
    margin: 16, 
    borderRadius: 12 
  },
  input: { 
    marginBottom: 12 
  },
})
