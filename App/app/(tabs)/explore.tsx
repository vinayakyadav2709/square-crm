import React, { useState } from 'react'
import { ScrollView, StyleSheet, View, RefreshControl } from 'react-native'
import { Text } from 'react-native-paper'
import LeadCard from '@/components/LeadCard'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { database } from '@/db'
import Lead from '@/db/models/Lead'
import { withObservables } from '@nozbe/watermelondb/react'
import { syncDatabase } from '@/store/sync'
import { Q } from '@nozbe/watermelondb'

interface ClosedLeadsScreenProps {
  leads: Lead[]
}

function ClosedLeadsScreen({ leads }: ClosedLeadsScreenProps) {
  const [refreshing, setRefreshing] = useState(false)

  const onRefresh = async () => {
    setRefreshing(true)
    await syncDatabase()
    setRefreshing(false)
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
          <MaterialCommunityIcons name="check-circle" size={24} color="#263238" />
          <Text variant="headlineSmall" style={styles.headerText}>
            Closed Leads
          </Text>
        </View>
        <Text style={styles.subText}>{leads.length} completed leads</Text>

        {leads.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="inbox" size={64} color="#cfd8dc" />
            <Text style={styles.emptyText}>No closed leads yet</Text>
          </View>
        ) : (
          leads.map((lead) => <LeadCard key={lead.id} lead={lead} />)
        )}
      </ScrollView>
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
})

const enhance = withObservables([], () => ({
  leads: database
    .get<Lead>('leads')
    .query(Q.where('status', 'closed'))
    .observe(),
}))

export default enhance(ClosedLeadsScreen)
