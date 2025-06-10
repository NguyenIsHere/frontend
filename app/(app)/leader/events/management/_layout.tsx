import { EventsProvider } from '@/context/EventsContext';
import { Slot } from 'expo-router';
import React from 'react';

export default function EventsLayout() {
    return (
        <EventsProvider>
            <Slot />
        </EventsProvider>
    );
}
