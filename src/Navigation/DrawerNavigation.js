import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import AccountScreen from '../screens/AccountScreen';
import AboutScreen from '../screens/AboutScreen';
import ContactScreen from '../screens/ContactScreen';

const Drawer = createDrawerNavigator();

// Custom Drawer Content
function CustomDrawerContent({ navigation }) {
  const menuItems = [
    { name: 'Mi Cuenta', screen: 'Account', icon: 'person-outline' },
    { name: 'Inicio', screen: 'Home', icon: 'home-outline' },
    { name: 'Acerca De', screen: 'About', icon: 'information-circle-outline' },
    { name: 'Contáctanos', screen: 'Contact', icon: 'mail-outline' },
    { name: 'Cerrar Sesión', screen: 'Login', icon: 'log-out-outline' },
  ];

  return (
    <View style={styles.drawerContainer}>
      <View style={styles.drawerHeader}>
        <View style={styles.menuIcon}>
          <Ionicons name="menu" size={24} color="#000" />
        </View>
      </View>
      
      <View style={styles.menuItems}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={() => navigation.navigate(item.screen)}
          >
            <Ionicons name={item.icon} size={20} color="#000" style={styles.menuItemIcon} />
            <Text style={styles.menuItemText}>{item.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <View style={styles.drawerFooter}>
        <Text style={styles.versionText}>F.I.D.O versión 1.2.0</Text>
      </View>
    </View>
  );
}

export default function DrawerNavigation() {
  return (
    <Drawer.Navigator
      initialRouteName="Home"
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          backgroundColor: '#FFFFFF',
          width: 280,
        },
        drawerPosition: 'left',
      }}
    >
      <Drawer.Screen 
        name="Account" 
        component={AccountScreen}
        options={{ drawerLabel: 'Mi Cuenta' }}
      />
      <Drawer.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ drawerLabel: 'Inicio' }}
      />
      <Drawer.Screen 
        name="About" 
        component={AboutScreen}
        options={{ drawerLabel: 'Acerca De' }}
      />
      <Drawer.Screen 
        name="Contact" 
        component={ContactScreen}
        options={{ drawerLabel: 'Contáctanos' }}
      />
      <Drawer.Screen 
        name="Login" 
        component={LoginScreen}
        options={{ drawerLabel: 'Cerrar Sesión' }}
      />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  drawerHeader: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  menuIcon: {
    padding: 5,
  },
  menuItems: {
    flex: 1,
    paddingTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  menuItemIcon: {
    marginRight: 15,
  },
  menuItemText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '400',
  },
  drawerFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  versionText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'left',
  },
});