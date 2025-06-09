import { Stack } from 'expo-router';
import React from 'react';
import { LogBox, SafeAreaView, StyleSheet, View } from 'react-native';

import React from 'react';
import Toast from 'react-native-toast-message';
import './global.css';

// Ignore VirtualizedLists warning globally
LogBox.ignoreLogs([
  'VirtualizedLists should never be nested',
  'Text strings must be rendered within a <Text> component'
]);

// Prevents the warning about nested NavigationContainer
// Expo Router manages its own NavigationContainer
export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(auth)',
};

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
