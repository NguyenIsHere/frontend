import { Stack } from 'expo-router'
import React from 'react'

const LeaderLayout = () => {
  return (
    <Stack>
      <Stack.Screen name='admin' options={{ headerShown: false }} />
      <Stack.Screen name='leader' options={{ headerShown: false }} />
            <Stack.Screen name='member' options={{ headerShown: false }} />
    </Stack>
  )
}

export default LeaderLayout
