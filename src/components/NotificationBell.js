import React, { useState, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Animated, FlatList, Dimensions, Modal as RNModal, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications } from '../context/NotificationContext';

const { width } = Dimensions.get('window');

export default function NotificationBell({ navigation }) {
  const { notifications, removeNotification } = useNotifications();
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const dropdownAnim = useRef(new Animated.Value(0)).current;

  const toggleDropdown = () => {
    setDropdownVisible((prev) => {
      if (!prev) {
        Animated.timing(dropdownAnim, { 
          toValue: 1, 
          duration: 200, 
          useNativeDriver: Platform.OS !== 'web' 
        }).start();
      } else {
        Animated.timing(dropdownAnim, { 
          toValue: 0, 
          duration: 150, 
          useNativeDriver: Platform.OS !== 'web' 
        }).start();
      }
      return !prev;
    });
  };

  const handleNotificationPress = async (notif) => {
    setDropdownVisible(false);
    if (notif.onPress) {
      // Si la acción retorna true, eliminar la notificación
      const result = await notif.onPress();
      if (result === true) {
        removeNotification(notif.id);
      }
    }
  };

  return (
    <View style={{ position: 'relative', zIndex: 1000 }}>
      <TouchableOpacity onPress={toggleDropdown} style={styles.bellButton}>
        <Ionicons name="notifications-outline" size={28} color="#4CAF50" />
        {notifications.length > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{notifications.length}</Text>
          </View>
        )}
      </TouchableOpacity>
      {dropdownVisible && (
        <RNModal
          visible={dropdownVisible}
          transparent
          animationType="fade"
          onRequestClose={toggleDropdown}
        >
          <TouchableOpacity
            style={styles.overlay}
            activeOpacity={1}
            onPress={toggleDropdown}
          >
            <Animated.View style={[styles.dropdownAbsolute, { opacity: dropdownAnim, transform: [{ scaleY: dropdownAnim }] }] }>
              {notifications.length === 0 ? (
                <Text style={styles.emptyText}>Sin notificaciones</Text>
              ) : (
                <FlatList
                  data={notifications}
                  keyExtractor={item => item.id}
                  style={{ maxHeight: 300, width: width * 0.8 }}
                  renderItem={({ item }) => (
                <TouchableOpacity style={styles.notifItem} onPress={() => handleNotificationPress(item)}>
                      <Ionicons name={item.icon || 'alert-circle'} size={22} color={item.color || '#4CAF50'} style={{ marginRight: 10 }} />
                      <Text style={styles.notifText}>{item.message}</Text>
                    </TouchableOpacity>
                  )}
                />
              )}
            </Animated.View>
          </TouchableOpacity>
        </RNModal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bellButton: {
    padding: 6,
  },
  badge: {
    position: 'absolute',
    right: 2,
    top: 2,
    backgroundColor: '#F44336',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    zIndex: 2,
  },
  badgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  dropdownAbsolute: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 50,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 16,
    minWidth: 220,
    maxWidth: width * 0.8,
    zIndex: 10000,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.08)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    zIndex: 9999,
  },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  notifText: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  emptyText: {
    color: '#999',
    textAlign: 'center',
    padding: 20,
    fontSize: 15,
  },
});
