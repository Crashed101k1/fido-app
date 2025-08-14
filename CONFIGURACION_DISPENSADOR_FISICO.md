# 🔧 Configuración para Dispensador Físico FIDO - DESDE TU PC

## 📋 **CONFIGURACIÓN COMPLETA DESDE CERO EN TU PC**

Como anteriormente usabas otra PC, aquí tienes la configuración completa para tu nueva máquina:

## 🔧 **PASO 1: INSTALAR ARDUINO IDE EN TU PC**

### Descargar e Instalar:
1. Ve a **https://www.arduino.cc/en/software**
2. Descarga **Arduino IDE 2.x** (versión más reciente)
3. Instala en tu PC siguiendo las instrucciones

## 📦 **PASO 2: CONFIGURAR SOPORTE ESP32**

### En Arduino IDE:
1. Abrir **File > Preferences**
2. En "Additional Board Manager URLs" agregar:
   ```
   https://espressif.github.io/arduino-esp32/package_esp32_index.json
   ```
3. Ir a **Tools > Board > Boards Manager**
4. Buscar "ESP32" 
5. Instalar **"ESP32 by Espressif Systems"** (versión más reciente)

## 📚 **PASO 3: INSTALAR BIBLIOTECAS NECESARIAS**

### En Arduino IDE ir a **Tools > Manage Libraries** y buscar e instalar:

1. **ESP32Servo** por Kevin Harrington
2. **HX711** por Bogdan Necula
3. **LiquidCrystal I2C** por Frank de Brabander
4. **ArduinoJson** por Benoit Blanchon
5. **PubSubClient** por Nick O'Leary
6. **WiFi** (ya incluida con ESP32)
7. **Wire** (ya incluida)

## 🔌 **PASO 4: CONECTAR LA PLACA A TU PC**

### Conexión física:
1. **Conectar ESP32 a tu PC** con cable USB-C (LOLIN S3)
2. **Instalar driver** si es necesario:
   - Windows: Puede instalar automáticamente
   - Si no: Buscar **"CP210x USB to UART Bridge Driver"** en Google

### Verificar conexión:
1. En Arduino IDE: **Tools > Port**
2. Seleccionar el puerto COM que aparezca (ej: COM3, COM4, etc.)
3. En **Tools > Board** seleccionar **"ESP32S3 Dev Module"**

## 📁 **PASO 5: PREPARAR EL CÓDIGO EN TU PC**

### Copiar archivos del proyecto:
1. **Crear carpeta**: `C:\Users\TuUsuario\Documents\Arduino\fido_smart_dispenser\`
2. **Copiar estos archivos** desde tu proyecto FIDO:
   ```
   esp32_mqtt_dispenser/fido_smart_dispenser.ino
   esp32_mqtt_dispenser/mqtt_connection.h
   esp32_mqtt_dispenser/publish_with_type.h
   ```

### **IMPORTANTE - Configurar tu WiFi:**
En `mqtt_connection.h` **DEBES cambiar** estos valores:
```cpp
// ⚠️ CAMBIAR POR TU RED WIFI
const char* ssid = "TU_WIFI_NOMBRE";           // Nombre de tu WiFi
const char* password = "TU_WIFI_PASSWORD";     // Contraseña de tu WiFi

// ✅ MQTT ya configurado (NO cambiar)
const char* mqtt_server = "shiftr.io";
const int mqtt_port = 1883;
const char* mqtt_user = "FIDO_2025";
const char* mqtt_password = "FIDO2025!";
```

## ⚙️ **PASO 6: CONFIGURAR PLACA EN ARDUINO IDE**

### Settings para ESP32-S3 LOLIN:
- **Board**: "ESP32S3 Dev Module"
- **Upload Speed**: 921600
- **USB Mode**: "Hardware CDC and JTAG"
- **USB CDC On Boot**: "Enabled"
- **USB Firmware MSC On Boot**: "Disabled"
- **USB DFU On Boot**: "Disabled"
- **Upload Mode**: "UART0 / Hardware CDC"
- **CPU Frequency**: 240MHz
- **Flash Mode**: QIO
- **Flash Size**: 16MB
- **Partition Scheme**: "16M Flash (3MB APP/9.9MB FATFS)"
- **Port**: El COM que detectó tu placa (ej: COM3)
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
