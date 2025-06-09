import { NotificationProvider } from "@/contexts/NotificationContext";
import { Stack } from "expo-router";
import React from "react";

const LeaderLayout = () => {
  return (
    <NotificationProvider>
      <Stack>
        <Stack.Screen name="admin" options={{ headerShown: false }} />
        <Stack.Screen name="leader" options={{ headerShown: false }} />
      </Stack>
    </NotificationProvider>
  );
};

export default LeaderLayout;
