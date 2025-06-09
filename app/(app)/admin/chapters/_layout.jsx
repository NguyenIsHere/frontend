import { Stack } from "expo-router";
import { SafeAreaView } from "react-native";

const RootLayout = () => {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Stack>
        <Stack.Screen name='index' options={{ headerShown: false }} />
        <Stack.Screen
          name='edit'
          options={{ headerShown: false, presentation: "modal" }}
        />
        <Stack.Screen
          name='add'
          options={{ headerShown: false, presentation: "modal" }}
        />
        <Stack.Screen name='[id]' options={{ headerShown: false }} />
      </Stack>
    </SafeAreaView>
  );
};

export default RootLayout;
