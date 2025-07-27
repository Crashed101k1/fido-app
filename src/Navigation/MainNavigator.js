/**
 * FIDO - Navegador Principal de la Aplicación
 * 
 * Este archivo contiene la estructura de navegación completa de la aplicación,
 * incluyendo la navegación por pestañas (tabs) y el drawer lateral.
 * 
 * Estructura de navegación:
 * - Tab Navigator: Navegación principal con 4 pestañas principales
 * - Drawer Navigator: Menú lateral con opciones adicionales
 * - Header personalizado: Con logo, menú hamburguesa y notificaciones
 * 
 * Pantallas principales (Tab Navigator):
 * 1. Dashboard: Pantalla principal con estado de dispensadores
 * 2. Mi Mascota: Gestión de mascotas y configuración
 * 3. Horarios: Configuración de horarios de alimentación
 * 4. Mi Cuenta: Gestión del perfil de usuario
 * 
 * Pantallas secundarias (Drawer):
 * - Estadísticas: Información y redirección al sitio web
 * - Acerca de: Información sobre la aplicación
 * - Contacto: Información de contacto y soporte
 * 
 * Dependencias:
 * - React Navigation v6: Tab y Drawer navigators
 * - Expo Vector Icons: Iconografía consistente
 * - Assets locales: Logo de FIDO
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';

// Importar screens principales
import HomeScreen from '../screens/HomeScreen';
import MyPetScreen from '../screens/Mypet';
import EatTimeScreen from '../screens/EatTime';
import Estadistics from '../screens/Estadistics';
import AccountScreen from '../screens/AccountScreen';
import AboutScreen from '../screens/AboutScreen';
import ContactScreen from '../screens/ContactScreen';

// Crear instancias de navegadores
const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

/**
 * Componente de Header personalizado integrado
 * 
 * Proporciona una barra de navegación superior consistente con:
 * - Botón de menú hamburguesa para abrir el drawer
 * - Logo centrado de FIDO
 * - Botón de notificaciones
 * 
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.navigation - Objeto de navegación
 * @returns {JSX.Element} Componente de header personalizado
 */
function DrawerHeader({ navigation }) {
  /**
   * Función para abrir el drawer lateral
   * @function handleMenuPress
   * @returns {void}
   */
  const handleMenuPress = () => {
    navigation.openDrawer();
  };

  /**
   * Función para manejar las notificaciones
   * En una aplicación real, esto abriría una pantalla de notificaciones
   * @function handleNotificationPress
   * @returns {void}
   */
  const handleNotificationPress = () => {
    // Funcionalidad de notificaciones por implementar
  };

  return (
    <View style={styles.header}>
      {/* Botón de menú hamburguesa personalizado */}
      <TouchableOpacity style={styles.menuButton} onPress={handleMenuPress}>
        <View style={styles.menuLine} />
        <View style={styles.menuLine} />
        <View style={styles.menuLine} />
      </TouchableOpacity>
      
      {/* Contenedor del logo centrado */}
      <View style={styles.logoContainer}>
        <Image 
          source={require('../../assets/FIDO_LOGO.png')} 
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>
      
      {/* Botón de notificaciones */}
      <TouchableOpacity style={styles.notificationButton} onPress={handleNotificationPress}>
        <Ionicons name="notifications-outline" size={24} color="#000" />
      </TouchableOpacity>
    </View>
  );
}

// Wrapper para las pantallas que incluye el header
function ScreenWithHeader({ children, navigation }) {
  return (
    <View style={{ flex: 1 }}>
      <DrawerHeader navigation={navigation} />
      {children}
    </View>
  );
}

// Custom Drawer Content
function CustomDrawerContent({ navigation, state }) {
  // Obtener la ruta actual para determinar si mostrar "Inicio"
  const currentRoute = state.routes[state.index];
  const isInTabNavigator = currentRoute.name === 'TabNavigator';
  
  // Definir los elementos del menú de forma explícita
  let menuItems;
  
  if (isInTabNavigator) {
    // Cuando estamos en TabNavigator - 4 opciones
    menuItems = [
      { name: 'Mi Cuenta', screen: 'Account', icon: 'person-outline' },
      { name: 'Acerca de', screen: 'About', icon: 'information-circle-outline' },
      { name: 'Contáctanos', screen: 'Contact', icon: 'chatbubbles-outline' },
      { name: 'Cerrar sesión', screen: 'Login', icon: 'log-out-outline' },
    ];
  } else {
    // Cuando NO estamos en TabNavigator - 5 opciones con Inicio
    menuItems = [
      { name: 'Inicio', screen: 'TabNavigator', icon: 'home-outline' },
      { name: 'Mi Cuenta', screen: 'Account', icon: 'person-outline' },
      { name: 'Acerca de', screen: 'About', icon: 'information-circle-outline' },
      { name: 'Contáctanos', screen: 'Contact', icon: 'chatbubbles-outline' },
      { name: 'Cerrar sesión', screen: 'Login', icon: 'log-out-outline' },
    ];
  }

  const handleLogout = () => {
    // Obtener el navigation del nivel superior (Stack Navigator)
    try {
      const rootNavigation = navigation.getParent();
      if (rootNavigation) {
        rootNavigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }
    } catch (error) {
      console.log('Error navigating to login:', error);
      // Fallback: intentar navegar directamente
      navigation.navigate('Login');
    }
  };

  return (
    <View style={styles.drawerContainer}>
      <View style={styles.drawerHeader}>
        <View style={styles.menuIcon}>
          <Ionicons name="menu" size={24} color="#000" />
        </View>
        <Text style={styles.drawerTitle}>F.I.D.O</Text>
      </View>
      
      <View style={styles.menuItems} key={`menu-${isInTabNavigator ? 'tab' : 'drawer'}-${menuItems.length}`}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={`${item.screen}-${index}-${item.icon}`}
            style={styles.menuItem}
            onPress={() => {
              if (item.screen === 'Login') {
                handleLogout();
              } else if (item.screen === 'TabNavigator') {
                // Navegar al TabNavigator y específicamente a la pestaña Home
                navigation.navigate('TabNavigator', { 
                  screen: 'Home' 
                });
              } else {
                navigation.navigate(item.screen);
              }
            }}
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

// Tab Navigator principal que siempre está visible
function MainTabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E0E0E0',
          paddingVertical: 8,
          height: 75,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          marginTop: 4,
          fontWeight: '600',
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          let iconSize = focused ? 26 : 22;
          let iconColor = color;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'MyPet') {
            iconName = focused ? 'paw' : 'paw-outline';
          } else if (route.name === 'EatTime') {
            iconName = focused ? 'restaurant' : 'restaurant-outline';
          } else if (route.name === 'Statistics') {
            iconName = focused ? 'bar-chart' : 'bar-chart-outline';
          }

          return (
            <View style={[
              styles.tabIconContainer,
              focused && styles.tabIconContainerActive
            ]}>
              <Ionicons 
                name={iconName} 
                size={iconSize} 
                color={iconColor}
                style={[
                  styles.tabIcon,
                  focused && styles.tabIconActive
                ]}
              />
              {focused && <View style={styles.tabIndicator} />}
            </View>
          );
        },
        tabBarActiveTintColor: '#4CAF50',
        tabBarInactiveTintColor: '#666',
        tabBarItemStyle: {
          paddingVertical: 5,
        },
      })}
    >
      <Tab.Screen 
        name="Home"
        options={{ tabBarLabel: 'Inicio' }}
      >
        {(props) => (
          <ScreenWithHeader navigation={props.navigation}>
            <HomeScreen {...props} />
          </ScreenWithHeader>
        )}
      </Tab.Screen>
      
      <Tab.Screen 
        name="MyPet"
        options={{ tabBarLabel: 'Mi Mascota' }}
      >
        {(props) => (
          <ScreenWithHeader navigation={props.navigation}>
            <MyPetScreen {...props} />
          </ScreenWithHeader>
        )}
      </Tab.Screen>
      
      <Tab.Screen 
        name="EatTime"
        options={{ tabBarLabel: 'Hora de Comer' }}
      >
        {(props) => (
          <ScreenWithHeader navigation={props.navigation}>
            <EatTimeScreen {...props} />
          </ScreenWithHeader>
        )}
      </Tab.Screen>
      
      <Tab.Screen 
        name="Statistics"
        options={{ tabBarLabel: 'Estadísticas' }}
      >
        {(props) => (
          <ScreenWithHeader navigation={props.navigation}>
            <Estadistics {...props} />
          </ScreenWithHeader>
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

// Drawer Navigator principal que envuelve todo
export default function MainNavigator() {
  return (
    <Drawer.Navigator
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
      {/* Pantallas principales con tabs siempre visibles */}
      <Drawer.Screen name="TabNavigator" component={MainTabNavigator} />
      
      {/* Pantallas del drawer con tabs visibles pero con contenido diferente */}
      <Drawer.Screen name="Account">
        {(props) => (
          <View style={{ flex: 1 }}>
            <DrawerHeader navigation={props.navigation} />
            <AccountScreen {...props} />
          </View>
        )}
      </Drawer.Screen>
      
      <Drawer.Screen name="About">
        {(props) => (
          <View style={{ flex: 1 }}>
            <DrawerHeader navigation={props.navigation} />
            <AboutScreen {...props} />
          </View>
        )}
      </Drawer.Screen>
      
      <Drawer.Screen name="Contact">
        {(props) => (
          <View style={{ flex: 1 }}>
            <DrawerHeader navigation={props.navigation} />
            <ContactScreen {...props} />
          </View>
        )}
      </Drawer.Screen>
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  // Estilos del Header integrado
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
  // Estilos del Tab Navigator mejorado
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    height: 40,
    borderRadius: 12,
    position: 'relative',
    backgroundColor: 'transparent',
    marginBottom: 8,
  },
  tabIconContainerActive: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    transform: [{ scale: 1.05 }],
  },
  tabIcon: {
    marginBottom: 2,
  },
  tabIconActive: {
    textShadowColor: 'rgba(76, 175, 80, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: -18,
    width: 25,
    height: 3,
    backgroundColor: '#4CAF50',
    borderRadius: 2,
  },
  // Estilos del Drawer
  drawerContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  drawerHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    marginRight: 15,
  },
  drawerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
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
