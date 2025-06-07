import { Stack } from 'expo-router'
import React from 'react'

const LeaderLayout = () => {
  return (
    <Stack>
      <Stack.Screen name='index' options={{ headerShown: false }} />
      <Stack.Screen name='detail' options={{ headerShown: false }} />
      <Stack.Screen name='edit' options={{ headerShown: false }} />
    </Stack>
  )
}

export default LeaderLayout
