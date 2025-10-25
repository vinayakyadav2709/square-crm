import React from 'react'
import { ScrollView, StyleSheet, View, Linking, Platform, Alert } from 'react-native'
import { Text, Card, Chip, Button, Divider } from 'react-native-paper'
import { useLocalSearchParams, Stack, useRouter } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { database } from '@/db'
import Lead from '@/db/models/Lead'
import CallLog from '@/db/models/CallLog'
import { withObservables } from '@nozbe/watermelondb/react'
import { useAuth } from '@/store/auth'
import { Q } from '@nozbe/watermelondb'

interface LeadDetailProps {
  lead: Lead
  callLogs: CallLog[]
}

function LeadDetailScreen({ lead, callLogs }: LeadDetailProps) {
  const router = useRouter()
  const { user } = useAuth()

  if (!lead) {
    return (
      <View style={styles.container}>
        <Text>Lead not found</Text>
      </View>
    )
  }

  const isAdmin = user?.role === 'admin'
  const isEditor = user?.role === 'editor'
  const canClose = isAdmin || isEditor

const makePhoneCall = async (phoneNumber: string) => {
  try {
    console.log('📞 Attempting to call:', phoneNumber)
    
    const phoneUrl = Platform.select({
      ios: `telprompt:${phoneNumber}`,
      android: `tel:${phoneNumber}`,
    })

    console.log('📱 Phone URL:', phoneUrl)

    if (!phoneUrl) {
      Alert.alert('Error', 'Phone URL not generated')
      return
    }

    // ✅ FIX: Just try to open, don't check canOpenURL for tel:
    // canOpenURL returns false for tel: on Android but it still works
    await Linking.openURL(phoneUrl)
    console.log('📲 Dialer opened successfully')
  } catch (error: any) {
    console.error('❌ Phone call error:', error)
    Alert.alert(
      'Call Failed',
      `Could not open phone dialer\n\nError: ${error.message}\nPhone: ${phoneNumber}`
    )
  }
}


const openWhatsApp = async (phoneNumber: string) => {
  try {
    const cleanNumber = phoneNumber.replace(/[^\d]/g, '')
    const whatsappUrl = `whatsapp://send?phone=${cleanNumber}`

    // WhatsApp check is useful - tells if app is installed
    const canOpen = await Linking.canOpenURL(whatsappUrl)
    
    if (canOpen) {
      await Linking.openURL(whatsappUrl)
    } else {
      Alert.alert('WhatsApp Not Installed', 'Install WhatsApp to send messages')
    }
  } catch (error: any) {
    Alert.alert('WhatsApp Error', error.message)
  }
}


  return (
    <>
      <Stack.Screen
        options={{
          title: lead.name,
          headerShown: true,
        }}
      />
      <ScrollView style={styles.container}>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.header}>
              <MaterialCommunityIcons name="account" size={32} color="#607d8b" />
              <Text variant="headlineSmall" style={styles.name}>
                {lead.name}
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Location</Text>
              <View style={styles.row}>
                <MaterialCommunityIcons name="map-marker" size={20} color="#607d8b" />
                <Text style={styles.value}>{lead.location}</Text>
              </View>
            </View>

            {/* Phone with Call Button */}
            <View style={styles.section}>
              <Text style={styles.label}>Phone</Text>
              <View style={styles.rowWithAction}>
                <View style={styles.row}>
                  <MaterialCommunityIcons name="phone" size={20} color="#607d8b" />
                  <Text style={styles.value}>{lead.phone}</Text>
                </View>
                <Button
                  mode="contained"
                  icon="phone"
                  onPress={() => makePhoneCall(lead.phone)}
                  compact
                  style={styles.callButton}
                >
                  Call
                </Button>
              </View>
            </View>

            {/* WhatsApp with Message Button */}
            <View style={styles.section}>
              <Text style={styles.label}>WhatsApp</Text>
              <View style={styles.rowWithAction}>
                <View style={styles.row}>
                  <MaterialCommunityIcons name="whatsapp" size={20} color="#25D366" />
                  <Text style={styles.value}>{lead.whatsappPhone}</Text>
                </View>
                <Button
                  mode="contained"
                  icon="whatsapp"
                  onPress={() => openWhatsApp(lead.whatsappPhone)}
                  compact
                  style={styles.whatsappButton}
                  buttonColor="#25D366"
                >
                  Message
                </Button>
              </View>
            </View>

            {lead.note && (
              <View style={styles.section}>
                <Text style={styles.label}>Note</Text>
                <Text style={styles.note}>{lead.note}</Text>
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.label}>Status</Text>
              <Chip
                mode="flat"
                style={lead.status === 'open' ? styles.chipOpen : styles.chipClosed}
              >
                {lead.status === 'open' ? 'Open' : 'Closed'}
              </Chip>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Created</Text>
              <Text style={styles.value}>
                {lead.createdAt.toLocaleDateString()} at {lead.createdAt.toLocaleTimeString()}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Actions */}
        {lead.status === 'open' && canClose && (
          <View style={styles.actions}>
            <Button
              mode="contained"
              icon="check-circle"
              onPress={() => router.push({
                pathname: '/modals/close-lead',
                params: { leadId: lead.id }
              })}
              style={styles.button}
            >
              Close Lead
            </Button>
            <Button
              mode="outlined"
              icon="phone-log"
              onPress={() => router.push({
                pathname: '/modals/add-call-log',
                params: { leadId: lead.id }
              })}
              style={styles.button}
            >
              Add Call Log
            </Button>
          </View>
        )}

        {/* Call Logs Section */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.callLogsHeader}>
              <MaterialCommunityIcons name="phone-log" size={24} color="#607d8b" />
              <Text variant="titleMedium" style={styles.callLogsTitle}>
                Call History
              </Text>
              <Chip mode="flat" style={styles.countChip}>
                {callLogs.length}
              </Chip>
            </View>

            {callLogs.length === 0 ? (
              <View style={styles.emptyLogs}>
                <MaterialCommunityIcons name="phone-off" size={48} color="#cfd8dc" />
                <Text style={styles.emptyText}>No call logs yet</Text>
                <Text style={styles.emptyHint}>Add a call log to track conversations</Text>
              </View>
            ) : (
              callLogs.map((log, index) => (
                <View key={log.id}>
                  {index > 0 && <Divider style={styles.divider} />}
                  <View style={styles.logItem}>
                    <View style={styles.logHeader}>
                      <MaterialCommunityIcons name="account-circle" size={20} color="#90a4ae" />
                      <Text style={styles.logDate}>
                        {log.callDate.toLocaleDateString()} at {log.callDate.toLocaleTimeString()}
                      </Text>
                    </View>
                    <Text style={styles.logNote}>{log.logNote}</Text>
                  </View>
                </View>
              ))
            )}
          </Card.Content>
        </Card>
      </ScrollView>
    </>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fb' },
  card: { margin: 16, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  name: { color: '#263238', flex: 1 },
  section: { marginBottom: 16 },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#90a4ae',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowWithAction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  value: { fontSize: 16, color: '#263238' },
  note: {
    fontSize: 14,
    color: '#607d8b',
    lineHeight: 20,
  },
  chipOpen: { alignSelf: 'flex-start', backgroundColor: '#e8f5e9' },
  chipClosed: { alignSelf: 'flex-start', backgroundColor: '#ffebee' },
  actions: { padding: 16, gap: 12 },
  button: { width: '100%' },
  callButton: {
    minWidth: 90,
  },
  whatsappButton: {
    minWidth: 110,
  },
  
  // Call Logs Styles
  callLogsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  callLogsTitle: {
    color: '#263238',
    flex: 1,
  },
  countChip: {
    height: 24,
    backgroundColor: '#e3f2fd',
  },
  emptyLogs: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#90a4ae',
    marginTop: 12,
  },
  emptyHint: {
    fontSize: 14,
    color: '#b0bec5',
    marginTop: 4,
  },
  logItem: {
    paddingVertical: 12,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  logDate: {
    fontSize: 12,
    color: '#90a4ae',
  },
  logNote: {
    fontSize: 14,
    color: '#263238',
    lineHeight: 20,
  },
  divider: {
    marginVertical: 8,
    backgroundColor: '#eceff1',
  },
})

// ✅ Enhanced with call logs observation
function LeadDetailWrapper() {
  const params = useLocalSearchParams<{ id: string }>()
  
  console.log('LeadDetailWrapper params:', params)
  
  if (!params.id) {
    return (
      <View style={styles.container}>
        <Text>No lead ID provided</Text>
      </View>
    )
  }

  const EnhancedScreen = withObservables(['id'], ({ id }: { id: string }) => {
    console.log('withObservables observing lead ID:', id)
    return {
      lead: database.get<Lead>('leads').findAndObserve(id),
      callLogs: database
        .get<CallLog>('call_logs')
        .query(Q.where('lead_id', id), Q.sortBy('call_date', Q.desc))
        .observe(),
    }
  })(LeadDetailScreen)

  return <EnhancedScreen id={params.id} />
}

export default LeadDetailWrapper
