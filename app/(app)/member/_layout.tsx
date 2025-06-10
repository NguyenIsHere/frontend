import { Ionicons, Octicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

const EventsLayout = () => {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#2563eb', // blue-600
                tabBarInactiveTintColor: '#6b7280', // gray-500
                tabBarStyle: { backgroundColor: 'white' },
            }}
        >

            <Tabs.Screen
                name="post"
                options={{
                    title: 'Bảng tin',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="newspaper" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="upcoming"
                options={{
                    title: 'Sắp diễn ra',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="calendar" size={size} color={color} />
                    ),
                }}
            />            <Tabs.Screen
                name="my-events/index"
                options={{
                    title: 'Của tôi',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person" size={size} color={color} />
                    ),
                }}
            />
             <Tabs.Screen
        name="messages"
        options={{
          title: "Liên hệ",
          tabBarIcon: ({ color, size }) => (
            <Octicons name="comment" size={size} color={color} />
          ),
        }}
      />
       {/* <Tabs.Screen
              name='notifications'
              options={{
                title: 'Thông báo',
                tabBarIcon: ({ color, size }) => (
                  <Octicons name='bell' size={size} color={color} />
                )
              }}
            /> */}
 <Tabs.Screen
        name='settings'
        options={{
          title: 'Cài đặt',
          tabBarIcon: ({ color, size }) => (
            <Octicons name='gear' size={size} color={color} />
          )
        }}
      />
            {/* Ẩn các tab index và detail */}
            <Tabs.Screen
                name="index"
                options={{
                    href: null, // Ẩn khỏi tab bar
                }}
            />
            <Tabs.Screen
                name="detail"
                options={{
                    href: null, // Ẩn khỏi tab bar
                }}
            />
        </Tabs>
    );
};

export default EventsLayout;