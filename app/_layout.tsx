import { Stack } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import './global.css';

const RootLayout = () => {
  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.container}>
        <Stack>
          <Stack.Screen name='(auth)' options={{ headerShown: false }} />
          <Stack.Screen name='(app)' options={{ headerShown: false }} />
        </Stack>
      </SafeAreaView>
      <Toast/>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
})

export default RootLayout
