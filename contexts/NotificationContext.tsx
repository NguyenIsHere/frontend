import React, { createContext, ReactNode, useContext, useState } from 'react';

export interface Notification {
  id: number;
  title: string;
  text: string;
  createdAt: string;
}

interface NotificationContextProps {
  notifications: Notification[];
  addNotification: (notif: Notification) => void;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (notif: Notification) => {
    setNotifications(prev => [notif, ...prev]);
  };

  return (
    <NotificationContext.Provider value={{ notifications, addNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextProps => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
