import { Octicons } from '@expo/vector-icons'
import { Tabs } from 'expo-router'
import React from 'react'
import { Platform } from 'react-native'

// --- COMPONENT LAYOUT CHÍNH ---
export default function AdminLayout () {
  const PRIMARY_COLOR = '#3E4FF5'
  const INACTIVE_COLOR = '#6B7280'

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: PRIMARY_COLOR,
        tabBarInactiveTintColor: INACTIVE_COLOR,
        tabBarStyle: {
          height: 70,
          paddingTop: 8,
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          backgroundColor: 'white',
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.05,
              shadowRadius: 4
            },
            android: {
              elevation: 5
            }
          })
        }
      }}
    >
      <Tabs.Screen
        name='accounts'
        options={{
          title: 'Tài khoản',
          tabBarIcon: ({ color, size }) => (
            <Octicons name='people' size={size} color={color} />
          )
        }}
      />
      <Tabs.Screen
        name='chapters'
        options={{
          title: 'Chi đoàn',
          tabBarIcon: ({ color, size }) => (
            <Octicons name='organization' size={size} color={color} />
          )
        }}
      />
      <Tabs.Screen
        name='settings'
        options={{
          title: 'Cài đặt',
          tabBarIcon: ({ color, size }) => (
            <Octicons name='gear' size={size} color={color} />
          )
        }}
      />
    </Tabs>
  )
}
