import React, { useState } from 'react';
import Toast from '../components/Toast';
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

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setToast({ visible: true, message: 'Por favor ingresa tu email y contraseña', type: 'error' });
      setTimeout(() => setToast({ visible: false, message: '', type: 'info' }), 2500);
      return;
    }

    // Validación de email (sin espacios, formato correcto)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email) || email.includes(' ')) {
      setToast({ visible: true, message: 'Por favor ingresa un email válido y sin espacios', type: 'error' });
      setTimeout(() => setToast({ visible: false, message: '', type: 'info' }), 2500);
      return;
    }

    // Validar que la contraseña no tenga espacios
    if (password.includes(' ')) {
      setToast({ visible: true, message: 'La contraseña no debe contener espacios', type: 'error' });
      setTimeout(() => setToast({ visible: false, message: '', type: 'info' }), 2500);
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
      // La navegación se manejará automáticamente por el AuthContext
    } catch (error) {
      let errorMessage = "No se pudo iniciar sesión.";
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = "No existe una cuenta con este correo. Regístrate primero.";
          break;
        case 'auth/wrong-password':
          errorMessage = "La contraseña es incorrecta. Intenta de nuevo.";
          break;
        case 'auth/invalid-email':
          errorMessage = "El correo ingresado no es válido. Verifica el formato.";
          break;
        case 'auth/user-disabled':
          errorMessage = "Tu cuenta ha sido deshabilitada. Contacta soporte si es un error.";
          break;
        case 'auth/too-many-requests':
          errorMessage = "Demasiados intentos fallidos. Espera unos minutos e intenta de nuevo.";
          break;
        default:
          errorMessage = "No se pudo iniciar sesión. Verifica tus datos o intenta más tarde.";
      }
      setToast({ visible: true, message: errorMessage, type: 'error' });
      setTimeout(() => setToast({ visible: false, message: '', type: 'info' }), 2500);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = () => {
    navigation.navigate("Register");
  };

  const handleLogoPress = () => {
    // Remover el atajo de desarrollador en producción
    Alert.alert("FIDO", "¡Bienvenido a FIDO!");
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Toast visible={toast.visible} message={toast.message} type={toast.type} />
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo FIDO */}
        <View style={styles.logoContainer}>
          <TouchableOpacity onPress={handleLogoPress} activeOpacity={0.7}>
            <Image
              source={require("../../assets/FIDO_LOGO.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>

        {/* Contenido principal */}
        <View style={styles.mainContent}>
          <Text style={styles.title}>Bienvenido a FIDO</Text>
          <Text style={styles.subtitle}>
            Tu asistente inteligente para la alimentación de mascotas
          </Text>

          {/* Formulario de login */}
          <View style={styles.formContainer}>
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
              placeholder="Contraseña"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />

            {/* Botón de iniciar sesión */}
            <TouchableOpacity 
              style={[styles.loginButton, loading && styles.loginButtonDisabled]} 
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Registro */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>¿No tienes cuenta?</Text>
            <TouchableOpacity onPress={handleRegister} disabled={loading}>
              <Text style={[styles.registerLink, loading && styles.linkDisabled]}>
                Regístrate aquí
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
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
    marginBottom: 40,
  },
  logoImage: {
    width: 120,
    height: 120,
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
    marginBottom: 40,
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
  loginButton: {
    backgroundColor: '#4472C4',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#4472C4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  loginButtonDisabled: {
    backgroundColor: '#BDC3C7',
    shadowOpacity: 0,
    elevation: 0,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  registerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 30,
  },
  registerText: {
    color: '#7F8C8D',
    fontSize: 16,
  },
  registerLink: {
    color: '#4472C4',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 5,
  },
  linkDisabled: {
    color: '#BDC3C7',
  },
});