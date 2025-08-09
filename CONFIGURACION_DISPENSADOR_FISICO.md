# 🔧 Configuración para Dispensador Físico FIDO

## ✅ **Estado Actual del Sistema**

La aplicación FIDO ahora está configurada para **conexiones MQTT reales** con tu dispensador físico ESP32-S3 LOLIN. Se han eliminado todos los datos simulados.

## 🌐 **Configuración de Red**

### **WiFi en ESP32**
Tu dispensador debe conectarse a la misma red WiFi que tu computadora/teléfono:

```cpp
// En fido_smart_dispenser.ino - líneas 15-16
const char* ssid = "TU_WIFI_SSID";        // ⚠️ Cambiar por tu red WiFi
const char* password = "TU_WIFI_PASSWORD"; // ⚠️ Cambiar por tu contraseña
```

### **Configuración MQTT (Ya configurada)**
```cpp
// Estas ya están configuradas correctamente:
const char* mqtt_server = "eridanus.cloud.shiftr.io";
const int mqtt_port = 1883;
const char* mqtt_user = "eridanus";
const char* mqtt_password = "Aeui6hvnooMPWo2j";
```

## 🔌 **Configuración de Hardware**

### **Pines del ESP32-S3 LOLIN (Ya configurados)**
```cpp
// Servo motor (dispensación)
#define SERVO_PIN 2

// Sensor de peso HX711
#define LOADCELL_DOUT_PIN 4
#define LOADCELL_SCK_PIN 5

// Sensor ultrasónico HC-SR04
#define TRIG_PIN 18
#define ECHO_PIN 19

// Display LCD I2C
// SDA: GPIO 21 (por defecto)
// SCL: GPIO 22 (por defecto)
```

## 🚀 **Pasos para Configurar tu Dispensador**

### **Paso 1: Configurar Red WiFi**
1. Abre `esp32_mqtt_dispenser/fido_smart_dispenser.ino`
2. Busca las líneas 15-16:
   ```cpp
   const char* ssid = "TU_WIFI_SSID";        // ⚠️ CAMBIAR
   const char* password = "TU_WIFI_PASSWORD"; // ⚠️ CAMBIAR
   ```
3. Reemplaza con los datos de tu red WiFi real

### **Paso 2: Generar ID Único del Dispositivo**
```cpp
// El dispensador genera automáticamente un ID único basado en su MAC:
// Formato: FIDO_XXXXXXXX (donde X es parte de la dirección MAC)
```

### **Paso 3: Calibrar Sensores (Si es necesario)**
```cpp
// Calibración del sensor de peso (línea ~45)
scale.set_scale(2280.f);  // ⚠️ Ajustar según tu calibración
scale.tare();             // Poner en cero

// Calibración del sensor ultrasónico (líneas ~110-115)
// Los valores actuales funcionan para la mayoría de casos
```

### **Paso 4: Configurar Contraseña del Dispositivo**
```cpp
// En mqtt_connection.h, línea ~95
if (password == "FIDO2025") {  // ⚠️ Cambiar si deseas otra contraseña
```

## 📱 **Cómo Funciona la Aplicación**

### **1. Conexión MQTT Automática**
- Al abrir la app, se conecta automáticamente a `shiftr.io`
- Verás el estado: "Conectado a shiftr.io" o "Desconectado"

### **2. Descubrimiento de Dispensadores**
- La app envía un mensaje de descubrimiento MQTT
- Tu dispensador responde con sus datos (ID, estado, batería, peso)
- Aparece en la lista de "Dispensadores Disponibles"

### **3. Conexión a Dispensador**
- Selecciona tu dispensador de la lista
- Ingresa la contraseña (por defecto: `FIDO2025`)
- Se establece conexión MQTT bidireccional

### **4. Control Remoto**
- **Dispensar**: Botón de play (dispensa 150g)
- **Configurar**: Acceso a configuración avanzada
- **Desconectar**: Botón de unlink

## 🔍 **Diagnóstico de Problemas**

### **Dispensador No Aparece en la Lista**
1. **Verificar WiFi**: ¿El ESP32 está conectado a la misma red?
2. **Monitor Serie**: Abrir Arduino IDE > Tools > Serial Monitor (115200 baud)
3. **Verificar logs**:
   ```
   ✅ WiFi conectado: [IP]
   ✅ MQTT conectado
   📡 Mensaje de descubrimiento recibido
   📤 Datos del dispositivo enviados
   ```

### **Error de Conexión MQTT**
1. **Internet**: Verificar que tu red tenga acceso a internet
2. **Firewall**: Asegurarse de que el puerto 1883 no esté bloqueado
3. **Credenciales**: Las credenciales están hardcodeadas y son correctas

### **Dispensador No Responde a Comandos**
1. **Estado de conexión**: Verificar que aparezca como "Conectado" en la app
2. **Contraseña**: Verificar que sea `FIDO2025` (por defecto)
3. **Logs MQTT**: Verificar en el monitor serie del ESP32

## 📊 **Mensajes MQTT Intercambiados**

### **Descubrimiento (App → Dispensador)**
```json
Topic: fido/dispensers/discovery
{
  "action": "discover",
  "timestamp": "2025-08-08T10:30:00.000Z",
  "appId": "fido_app_a1b2c3d4"
}
```

### **Respuesta de Dispositivo (Dispensador → App)**
```json
Topic: fido/dispensers/FIDO_A1B2C3D4/status
{
  "deviceId": "FIDO_A1B2C3D4",
  "name": "Dispensador FIDO",
  "type": "smart_dispenser",
  "version": "1.0.0",
  "ip": "192.168.1.100",
  "weight": 234.5,
  "containerLevel": 75,
  "batteryLevel": 85,
  "status": "ready",
  "timestamp": "2025-08-08T10:30:01.000Z"
}
```

### **Comando de Dispensación (App → Dispensador)**
```json
Topic: fido/dispensers/FIDO_A1B2C3D4/commands
{
  "action": "dispense",
  "amount": 150,
  "timestamp": "2025-08-08T10:30:02.000Z",
  "appId": "fido_app_a1b2c3d4"
}
```

### **Respuesta de Dispensación (Dispensador → App)**
```json
Topic: fido/dispensers/FIDO_A1B2C3D4/response
{
  "action": "dispense",
  "status": "success",
  "message": "Dispensando 150g",
  "timestamp": "2025-08-08T10:30:03.000Z"
}
```

## 🎯 **Siguientes Pasos**

1. **Configurar WiFi** en tu ESP32 con tus credenciales reales
2. **Cargar el código** al ESP32 usando Arduino IDE
3. **Abrir la app** FIDO en http://localhost:8081
4. **Ir a "Mis Mascotas"** → Botón de dispensador de una mascota
5. **Buscar dispositivos** y conectar a tu dispensador físico

¡Tu sistema FIDO ahora está listo para conectarse con tu dispensador físico real! 🚀
