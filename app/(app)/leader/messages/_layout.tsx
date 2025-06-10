// app/(tabs)/_layout.tsx
import { initSocket } from '@/socket';
import { Stack } from "expo-router";
import React, { useEffect } from "react";
import { Image, Text, View } from "react-native";

export default function Layout() {
  useEffect(() => {
   
  initSocket()
   
  }, []);
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="details/[id]"
        options={({ route }: { route: { params?: { name?: string; avatar?: string } } }) => {
          const { name, avatar } = route.params || {};

          return {
            headerTitle: () => (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                {avatar && (
                  <Image
                    source={{ uri: avatar }}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      marginRight: 8,
                    }}
                  />
                )}
                <Text style={{ fontSize: 16, fontWeight: "600" }}>
                  {name || "Đang trò chuyện"}
                </Text>
              </View>
            ),
          };
        }}
      />
    </Stack>
  );
}
