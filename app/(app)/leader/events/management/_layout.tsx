import { Stack } from 'expo-router';
import React from 'react';

const ManagementEventLayout = () => {
    return (
        <Stack
            screenOptions={{
                headerShown: false, // Hide the default header
            }}
        >
            <Stack.Screen name="index" />
            <Stack.Screen name="create" />
            <Stack.Screen name="detail" />
        </Stack>
    );
};

export default ManagementEventLayout;
