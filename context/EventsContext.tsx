import React, { createContext, ReactNode, useState } from 'react';

interface EventsContextType {
    shouldRefresh: boolean;
    setShouldRefresh: (value: boolean) => void;
}

export const EventsContext = createContext<EventsContextType>({
    shouldRefresh: false,
    setShouldRefresh: () => { },
});

interface EventsProviderProps {
    children: ReactNode;
}

export const EventsProvider = ({ children }: EventsProviderProps) => {
    const [shouldRefresh, setShouldRefresh] = useState(false);

    return (
        <EventsContext.Provider value={{ shouldRefresh, setShouldRefresh }}>
            {children}
        </EventsContext.Provider>
    );
};
