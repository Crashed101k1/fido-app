import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Image,
  ActivityIndicator
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function RegisterScreen({ navigation }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();

  const handleRegister = async () => {
    // Validar campos vacíos
    if (!fullName.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert("Error", "Por favor completa todos los campos");
      return;
    }

    // Validar nombre completo (mínimo 2 palabras)
    const nameWords = fullName.trim().split(" ");
    if (nameWords.length < 2) {
      Alert.alert("Error", "Por favor ingresa tu nombre completo");
      return;
    }

    // Validación básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Error", "Por favor ingresa un email válido");
      return;
    }

    // Validar longitud de contraseña
    if (password.length < 6) {
      Alert.alert("Error", "La contraseña debe tener al menos 6 caracteres");
      return;
    }

    // Validar que las contraseñas coincidan
    if (password !== confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden");
      return;
    }

    try {
      setLoading(true);
      await signup(email, password, fullName.trim());
      
      // El usuario ahora está autenticado automáticamente
      // El AuthContext manejará la navegación al HomeScreen
      // No necesitamos hacer nada más aquí
      
    } catch (error) {
      let errorMessage = "Error al crear la cuenta";
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = "Ya existe una cuenta con este correo electrónico";
          break;
        case 'auth/invalid-email':
          errorMessage = "Correo electrónico inválido";
          break;
        case 'auth/weak-password':
          errorMessage = "La contraseña es muy débil";
          break;
        case 'auth/operation-not-allowed':
          errorMessage = "El registro con email no está habilitado";
          break;
        default:
          errorMessage = error.message;
      }
      
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigation.navigate("Login");
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo FIDO */}
        <View style={styles.logoContainer}>
          <Image
            source={require("../../assets/FIDO_LOGO.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* Contenido principal */}
        <View style={styles.mainContent}>
          <Text style={styles.title}>Crear Cuenta</Text>
          <Text style={styles.subtitle}>
            Únete a la comunidad FIDO
          </Text>

          {/* Formulario de registro */}
          <View style={styles.formContainer}>
            <TextInput
              style={styles.input}
              placeholder="Nombre completo"
              placeholderTextColor="#999"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              autoCorrect={false}
              editable={!loading}
            />

            <TextInput
              style={styles.input}
              placeholder="Correo electrónico"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Contraseña (mínimo 6 caracteres)"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />

            <TextInput
              style={styles.input}
              placeholder="Confirmar contraseña"
              placeholderTextColor="#999"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />

            {/* Botón de registro */}
            <TouchableOpacity 
              style={[styles.registerButton, loading && styles.registerButtonDisabled]} 
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.registerButtonText}>Crear Cuenta</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Login */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>¿Ya tienes cuenta?</Text>
            <TouchableOpacity onPress={handleBackToLogin} disabled={loading}>
              <Text style={[styles.loginLink, loading && styles.linkDisabled]}>
                Inicia sesión aquí
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Los estilos son similares a LoginScreen con pequeñas variaciones
const styles = StyleSheet.create({
  // ... (mismo estilo que LoginScreen con ajustes menores)
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoImage: {
    width: 100,
    height: 100,
  },
  mainContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  formContainer: {
    width: '100%',
    maxWidth: 350,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 15,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E8EAED',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  registerButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  registerButtonDisabled: {
    backgroundColor: '#BDC3C7',
    shadowOpacity: 0,
    elevation: 0,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 30,
  },
  loginText: {
    color: '#7F8C8D',
    fontSize: 16,
  },
  loginLink: {
    color: '#4472C4',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 5,
  },
  linkDisabled: {
    color: '#BDC3C7',
  },
});