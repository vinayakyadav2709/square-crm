import React from 'react'
import { StyleSheet, View, TouchableOpacity } from 'react-native'
import { Card, Text } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import type Lead from '@/db/models/Lead'

interface LeadCardProps {
  lead: Lead
}

export default function LeadCard({ lead }: LeadCardProps) {
  const router = useRouter()

  // ✅ Safety checks
  if (!lead) {
    console.warn('LeadCard: lead is null/undefined')
    return null
  }

  if (!lead.id) {
    console.error('LeadCard: lead.id is missing', lead)
    return null
  }

  const handlePress = () => {
    console.log('LeadCard clicked, navigating to:', lead.id)
    router.push({
      pathname: '/lead/[id]',
      params: { id: lead.id },
    })
  }

  return (
    <TouchableOpacity onPress={handlePress}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <MaterialCommunityIcons name="account" size={20} color="#607d8b" />
            <Text style={styles.name}>{lead.name}</Text>
          </View>

          <View style={styles.row}>
            <MaterialCommunityIcons name="map-marker" size={16} color="#90a4ae" />
            <Text style={styles.detail}>{lead.location}</Text>
          </View>

          <View style={styles.row}>
            <MaterialCommunityIcons name="phone" size={16} color="#90a4ae" />
            <Text style={styles.detail}>{lead.phone}</Text>
          </View>

          {lead.whatsappPhone && (
            <View style={styles.row}>
              <MaterialCommunityIcons name="whatsapp" size={16} color="#25D366" />
              <Text style={styles.detail}>{lead.whatsappPhone}</Text>
            </View>
          )}

          {lead.note && (
            <Text style={styles.note} numberOfLines={2}>
              {lead.note}
            </Text>
          )}

          <Text style={styles.date}>
            Created {lead.createdAt?.toLocaleDateString() || 'Unknown'}
          </Text>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: { marginBottom: 12, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  name: { fontSize: 16, fontWeight: '600', color: '#263238', flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  detail: { fontSize: 14, color: '#607d8b' },
  note: { fontSize: 13, color: '#90a4ae', marginTop: 8, fontStyle: 'italic' },
  date: { fontSize: 12, color: '#b0bec5', marginTop: 8 },
})
