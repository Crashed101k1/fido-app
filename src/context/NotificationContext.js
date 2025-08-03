import React, { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  // Añadir una notificación
  const addNotification = useCallback((notif) => {
    setNotifications((prev) => {
      // Evitar duplicados por id
      if (prev.some(n => n.id === notif.id)) return prev;
      return [...prev, notif];
    });
  }, []);

  // Eliminar una notificación por id
  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter(n => n.id !== id));
  }, []);

  // Limpiar todas
  const clearNotifications = useCallback(() => setNotifications([]), []);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification, clearNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
