// app/(tabs)/_layout.tsx
import { initSocket } from '@/socket';
import type { DefaultEventsMap } from '@socket.io/component-emitter';
import { Stack } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Image, Text, View } from "react-native";
import type { Socket } from 'socket.io-client';

export default function Layout() {
  const socketRef = useRef<Socket<DefaultEventsMap, DefaultEventsMap> | null>(null);
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
