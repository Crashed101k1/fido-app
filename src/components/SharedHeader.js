import React from 'react';
import { View, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SharedHeader({ navigation }) {
  const handleMenuPress = () => {
    navigation.openDrawer();
  };

  const handleNotificationPress = () => {
    // Funcionalidad de notificaciones
  };

  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.menuButton} onPress={handleMenuPress}>
        <View style={styles.menuLine} />
        <View style={styles.menuLine} />
        <View style={styles.menuLine} />
      </TouchableOpacity>
      
      <View style={styles.logoContainer}>
        <Image 
          source={require('../../assets/FIDO_LOGO.png')} 
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>
      
      <TouchableOpacity style={styles.notificationButton} onPress={handleNotificationPress}>
        <Ionicons name="notifications-outline" size={24} color="#000" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 25,
    justifyContent: 'space-between',
  },
  menuButton: {
    padding: 5,
  },
  menuLine: {
    width: 22,
    height: 3,
    backgroundColor: '#000',
    marginVertical: 2,
    borderRadius: 2,
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
  },
  logoImage: {
    width: 50,
    height: 50,
  },
  notificationButton: {
    padding: 5,
  },
});
