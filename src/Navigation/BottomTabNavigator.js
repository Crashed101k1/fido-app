import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import MyPetScreen from '../screens/Mypet';
import EatTimeScreen from '../screens/EatTime'; // Importar la nueva pantalla

const Tab = createBottomTabNavigator();

// Screen temporal para Statistics
function TempStatisticsScreen({ navigation }) {
  const handleMenuPress = () => {
    navigation.navigate('DrawerNav');
  };

  const handleNotificationPress = () => {
    // Funcionalidad de notificaciones
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={handleMenuPress}>
          <View style={styles.menuLine} />
          <View style={styles.menuLine} />
          <View style={styles.menuLine} />
        </TouchableOpacity>
        
        {/* Logo FIDO */}
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/FIDO_LOGO.png')} 
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
        
        {/* Notification icon */}
        <TouchableOpacity style={styles.notificationButton} onPress={handleNotificationPress}>
          <Ionicons name="notifications-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <View style={styles.tempScreen}>
        <Text style={styles.tempText}>Dieta Animal</Text>
        <Text style={styles.tempSubtext}>Próximamente...</Text>
      </View>
    </View>
  );
}

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E0E0E0',
          paddingVertical: 5,
          height: 70,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          marginTop: 4,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          let iconSize = 20;

          if (route.name === 'MyPet') {
            iconName = 'bone';
            if (focused) {
              return (
                <View style={styles.activeTabItem}>
                  <Ionicons name={iconName} size={iconSize} color="#FFFFFF" />
                </View>
              );
            }
            color = '#666';
          } else if (route.name === 'EatTime') {
            iconName = 'time';
            iconSize = 24;
            color = '#000';
            if (focused) {
              return (
                <View style={[styles.timeButton, styles.timeButtonFocused]}>
                  <Ionicons name={iconName} size={iconSize} color="#000" />
                </View>
              );
            }
            return (
              <View style={styles.timeButton}>
                <Ionicons name={iconName} size={iconSize} color={color} />
              </View>
            );
          } else if (route.name === 'Statistics') {
            iconName = 'bar-chart';
            color = focused ? '#4472C4' : '#666';
          }

          return <Ionicons name={iconName} size={iconSize} color={color} />;
        },
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#666',
        tabBarLabelStyle: ({ focused }) => ({
          fontSize: 10,
          color: focused && route.name === 'MyPet' ? '#FFFFFF' : 
                 focused && route.name === 'EatTime' ? '#000' :
                 focused && route.name === 'Statistics' ? '#4472C4' : '#666',
          fontWeight: focused ? '600' : 'normal',
        }),
      })}
    >
      <Tab.Screen 
        name="MyPet" 
        component={MyPetScreen}
        options={{
          tabBarLabel: 'Mi Mascota',
        }}
      />
      <Tab.Screen 
        name="EatTime" 
        component={EatTimeScreen} // Usar la nueva pantalla
        options={{
          tabBarLabel: 'Hora de Comer',
        }}
      />
      <Tab.Screen 
        name="Statistics" 
        component={TempStatisticsScreen}
        options={{
          tabBarLabel: 'Dieta Animal',
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E0D5F7',
  },
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
  tempScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E0D5F7',
  },
  tempText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  tempSubtext: {
    fontSize: 16,
    color: '#666',
  },
  timeButton: {
    backgroundColor: '#FFD54F',
    borderRadius: 25,
    padding: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  timeButtonFocused: {
    backgroundColor: '#FF6B6B',
  },
  activeTabItem: {
    backgroundColor: '#FF6B6B',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    alignItems: 'center',
  },
});