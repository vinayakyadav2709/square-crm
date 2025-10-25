import React from 'react'
import { Tabs } from 'expo-router'
import { useColorScheme } from 'react-native'
import { MD3Colors } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useAuth } from '@/store/auth'

export default function TabLayout() {
  const scheme = useColorScheme()
  const { user } = useAuth()
  const tint = scheme === 'dark' ? MD3Colors.primary70 : MD3Colors.primary40

  const isAdmin = user?.role === 'admin'

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: tint,
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Open Leads',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="folder-open" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Closed Leads',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="check-circle" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: 'Categories',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="tag-multiple" size={24} color={color} />
          ),
          // ✅ Hide tab for non-admins
          href: isAdmin ? '/categories' : null,
        }}
      />
    </Tabs>
  )
}
