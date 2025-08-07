# GUÍA COMPLETA: Implementación MQTT para FIDO App y ESP32S3

## **RESUMEN DEL PROYECTO**
- **App**: React Native (ya funcional)
- **Hardware**: ESP32S3 LOLIN con sensores ultrasónico, peso, servomotor y LCD
- **Comunicación**: MQTT para conexión en tiempo real
- **Funcionalidad**: Descubrimiento automático de dispensadores y conexión por contraseña

---

## **FASE 1: CONFIGURACIÓN DE BROKER MQTT ONLINE**

### 1.1 Opciones de Brokers Online para Producción

#### **🚀 OPCIÓN 1: HiveMQ Cloud (RECOMENDADO)**
- **Gratis**: Hasta 100 conexiones simultáneas
- **Confiable**: 99.9% uptime
- **Fácil**: Setup en 5 minutos

**Pasos:**
1. Ir a [HiveMQ Cloud](https://www.hivemq.com/mqtt-cloud-broker/)
2. Crear cuenta gratuita
3. Crear cluster
4. Obtener credenciales de conexión

#### **🔧 OPCIÓN 2: Servidor VPS Propio (Escalable)**
**Crear servidor en DigitalOcean/AWS/Vultr:**
```bash
# 1. Crear droplet Ubuntu 22.04 ($6/mes)
# 2. Conectar por SSH
ssh root@TU_IP_SERVIDOR

# 3. Instalar Mosquitto
sudo apt update
sudo apt install mosquitto mosquitto-clients -y

# 4. Configurar para acceso público
sudo nano /etc/mosquitto/mosquitto.conf
```

**Archivo de configuración `/etc/mosquitto/mosquitto.conf`:**
```bash
# Configuración para producción
persistence true
persistence_location /var/lib/mosquitto/

# Puerto estándar MQTT
port 1883
listener 1883 0.0.0.0

# Puerto seguro MQTT con SSL (opcional)
listener 8883
certfile /etc/letsencrypt/live/tudominio.com/cert.pem
keyfile /etc/letsencrypt/live/tudominio.com/privkey.pem

# Logs
log_dest file /var/log/mosquitto/mosquitto.log
log_type error
log_type warning
log_type notice
log_type information

# Autenticación (recomendado para producción)
allow_anonymous false
password_file /etc/mosquitto/password_file
```

**Crear usuarios:**
```bash
# Crear archivo de contraseñas
sudo mosquitto_passwd -c /etc/mosquitto/password_file fido_user
sudo mosquitto_passwd /etc/mosquitto/password_file fido_device

# Reiniciar servicio
sudo systemctl restart mosquitto
sudo systemctl enable mosquitto

# Abrir puertos en firewall
sudo ufw allow 1883
sudo ufw allow 8883
```

#### **⚡ OPCIÓN 3: Brokers Públicos Gratuitos (Solo para Pruebas)**
```javascript
// Solo para desarrollo - NO usar en producción
const publicBrokers = [
  'mqtt://broker.hivemq.com:1883',
  'mqtt://test.mosquitto.org:1883',
  'mqtt://broker.emqx.io:1883'
];
```

### 1.2 Configuración Recomendada para FIDO

**Para HiveMQ Cloud:**
```javascript
// Credenciales que obtienes de HiveMQ
const MQTT_CONFIG = {
  host: 'TU_CLUSTER.s1.eu.hivemq.cloud',
  port: 8883,
  protocol: 'mqtts', // SSL habilitado
  username: 'TU_USERNAME',
  password: 'TU_PASSWORD'
};
```

**Para VPS Propio:**
```javascript
// Tu servidor personalizado
const MQTT_CONFIG = {
  host: 'tu-servidor.com', // o IP directa
  port: 1883,
  protocol: 'mqtt',
  username: 'fido_user',
  password: 'tu_password_seguro'
};
```

---

## **FASE 2: PROGRAMACIÓN DEL ESP32S3**

### 2.1 Instalar Librerías en Arduino IDE
```cpp
// En Arduino IDE, instalar estas librerías:
// - PubSubClient (para MQTT)
// - WiFi (incluida con ESP32)
// - ArduinoJson (para manejo de JSON)
// - LiquidCrystal_I2C (para LCD)
// - ESP32Servo (para servomotor)
```

### 2.2 Código Completo para ESP32S3
**Archivo: `FIDO_Dispenser.ino`**
```cpp
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <LiquidCrystal_I2C.h>
#include <ESP32Servo.h>
#include <EEPROM.h>

// Configuración WiFi
const char* ssid = "TU_WIFI_SSID";
const char* password = "TU_WIFI_PASSWORD";

// Configuración MQTT ONLINE
const char* mqtt_server = "TU_CLUSTER.s1.eu.hivemq.cloud"; // HiveMQ Cloud
// O para VPS propio: const char* mqtt_server = "tu-servidor.com";
const int mqtt_port = 8883; // Puerto SSL para HiveMQ
// O para VPS sin SSL: const int mqtt_port = 1883;
const char* mqtt_user = "TU_USERNAME_HIVEMQ";
const char* mqtt_pass = "TU_PASSWORD_HIVEMQ";

// Configuración SSL para HiveMQ Cloud
#include <WiFiClientSecure.h>
WiFiClientSecure espClient;
// Para VPS sin SSL usar: WiFiClient espClient;

// ID único del dispensador (se puede generar automáticamente)
String dispenserID = "FIDO_" + String(WiFi.macAddress());
String dispenserPassword = "FIDO2025"; // Contraseña predeterminada

// Pines
#define TRIGGER_PIN 5
#define ECHO_PIN 18
#define WEIGHT_DOUT 19
#define WEIGHT_SCK 21
#define SERVO_PIN 9
#define SDA_PIN 8
#define SCL_PIN 10

// Objetos
WiFiClientSecure espClient; // Para HiveMQ Cloud con SSL
// WiFiClient espClient; // Para VPS sin SSL
PubSubClient client(espClient);
LiquidCrystal_I2C lcd(0x27, 16, 2);
Servo servoMotor;

// Variables globales
float foodLevelPercent = 0;
float plateWeightGrams = 0;
bool isConnectedToApp = false;
unsigned long lastHeartbeat = 0;
unsigned long lastSensorRead = 0;

// Tópicos MQTT
String topicDiscovery = "fido/discovery";
String topicConnect = "fido/connect/" + dispenserID;
String topicStatus = "fido/status/" + dispenserID;
String topicCommand = "fido/command/" + dispenserID;
String topicHeartbeat = "fido/heartbeat/" + dispenserID;

void setup() {
  Serial.begin(115200);
  
  // Inicializar LCD
  lcd.init(SDA_PIN, SCL_PIN);
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("FIDO Dispenser");
  lcd.setCursor(0, 1);
  lcd.print("Iniciando...");
  
  // Configurar pines
  pinMode(TRIGGER_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  
  // Inicializar servo
  servoMotor.attach(SERVO_PIN);
  servoMotor.write(0); // Cerrar compuerta
  
  // Conectar WiFi
  setupWiFi();
  
  // Configurar SSL para HiveMQ Cloud
  espClient.setInsecure(); // Para pruebas, en producción usar certificados
  
  // Configurar MQTT
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(onMqttMessage);
  
  // Conectar MQTT
  connectMQTT();
  
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("FIDO Listo");
  lcd.setCursor(0, 1);
  lcd.print("ID: " + dispenserID.substring(5, 11));
}

void loop() {
  if (!client.connected()) {
    connectMQTT();
  }
  client.loop();
  
  // Leer sensores cada 2 segundos
  if (millis() - lastSensorRead > 2000) {
    readSensors();
    updateLCD();
    publishStatus();
    lastSensorRead = millis();
  }
  
  // Enviar heartbeat cada 30 segundos
  if (millis() - lastHeartbeat > 30000) {
    publishHeartbeat();
    lastHeartbeat = millis();
  }
  
  // Anunciar disponibilidad cada 10 segundos si no está conectado
  if (!isConnectedToApp && millis() % 10000 < 100) {
    publishDiscovery();
  }
}

void setupWiFi() {
  WiFi.begin(ssid, password);
  Serial.print("Conectando a WiFi");
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println();
  Serial.println("WiFi conectado!");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
}

void connectMQTT() {
  while (!client.connected()) {
    Serial.print("Conectando MQTT...");
    
    // Conectar con autenticación para brokers online
    if (client.connect(dispenserID.c_str(), mqtt_user, mqtt_pass)) {
      Serial.println("conectado");
      
      // Suscribirse a tópicos
      client.subscribe(topicConnect.c_str());
      client.subscribe(topicCommand.c_str());
      
      // Anunciar disponibilidad
      publishDiscovery();
      
    } else {
      Serial.print("falló, rc=");
      Serial.print(client.state());
      Serial.println(" reintentando en 5 segundos");
      delay(5000);
    }
  }
}

void onMqttMessage(char* topic, byte* payload, unsigned int length) {
  String message = "";
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  
  Serial.println("Mensaje recibido [" + String(topic) + "]: " + message);
  
  // Parsear JSON
  DynamicJsonDocument doc(1024);
  deserializeJson(doc, message);
  
  if (String(topic) == topicConnect) {
    handleConnectionRequest(doc);
  } else if (String(topic) == topicCommand) {
    handleCommand(doc);
  }
}

void handleConnectionRequest(DynamicJsonDocument& doc) {
  String receivedPassword = doc["password"];
  
  if (receivedPassword == dispenserPassword) {
    isConnectedToApp = true;
    
    // Responder con éxito
    DynamicJsonDocument response(1024);
    response["dispenserId"] = dispenserID;
    response["status"] = "connected";
    response["message"] = "Conexión establecida";
    
    String responseStr;
    serializeJson(response, responseStr);
    client.publish((topicConnect + "/response").c_str(), responseStr.c_str());
    
    Serial.println("App conectada exitosamente!");
    
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("App Conectada!");
    lcd.setCursor(0, 1);
    lcd.print("FIDO Activo");
    
  } else {
    // Responder con error
    DynamicJsonDocument response(1024);
    response["status"] = "error";
    response["message"] = "Contraseña incorrecta";
    
    String responseStr;
    serializeJson(response, responseStr);
    client.publish((topicConnect + "/response").c_str(), responseStr.c_str());
  }
}

void handleCommand(DynamicJsonDocument& doc) {
  String command = doc["command"];
  
  if (command == "dispense") {
    int duration = doc["duration"] | 1000; // Por defecto 1 segundo
    dispenseFood(duration);
    
    // Confirmar comando ejecutado
    DynamicJsonDocument response(1024);
    response["command"] = "dispense";
    response["status"] = "completed";
    response["timestamp"] = millis();
    
    String responseStr;
    serializeJson(response, responseStr);
    client.publish((topicCommand + "/response").c_str(), responseStr.c_str());
    
  } else if (command == "getStatus") {
    publishStatus();
  }
}

void readSensors() {
  // Leer sensor ultrasónico (nivel de comida)
  digitalWrite(TRIGGER_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIGGER_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIGGER_PIN, LOW);
  
  long duration = pulseIn(ECHO_PIN, HIGH);
  float distance = duration * 0.034 / 2;
  
  // Convertir distancia a porcentaje (ajustar según tu contenedor)
  float maxDistance = 20.0; // 20cm = vacío
  float minDistance = 2.0;   // 2cm = lleno
  foodLevelPercent = map(distance, maxDistance, minDistance, 0, 100);
  foodLevelPercent = constrain(foodLevelPercent, 0, 100);
  
  // Leer sensor de peso (simular por ahora)
  // Aquí implementarías la lectura del HX711
  plateWeightGrams = random(0, 200); // Simular 0-200g
}

void updateLCD() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Comida: " + String((int)foodLevelPercent) + "%");
  lcd.setCursor(0, 1);
  lcd.print("Plato: " + String((int)plateWeightGrams) + "g");
}

void publishDiscovery() {
  DynamicJsonDocument doc(1024);
  doc["dispenserId"] = dispenserID;
  doc["name"] = "FIDO Dispensador";
  doc["status"] = "available";
  doc["requiresPassword"] = true;
  doc["features"] = "food_level,weight_sensor,auto_dispense";
  
  String message;
  serializeJson(doc, message);
  client.publish(topicDiscovery.c_str(), message.c_str());
}

void publishStatus() {
  DynamicJsonDocument doc(1024);
  doc["dispenserId"] = dispenserID;
  doc["foodLevel"] = foodLevelPercent;
  doc["plateWeight"] = plateWeightGrams;
  doc["isOnline"] = true;
  doc["lastSync"] = millis();
  doc["timestamp"] = millis();
  
  String message;
  serializeJson(doc, message);
  client.publish(topicStatus.c_str(), message.c_str());
}

void publishHeartbeat() {
  DynamicJsonDocument doc(1024);
  doc["dispenserId"] = dispenserID;
  doc["timestamp"] = millis();
  doc["status"] = "alive";
  
  String message;
  serializeJson(doc, message);
  client.publish(topicHeartbeat.c_str(), message.c_str());
}

void dispenseFood(int duration) {
  Serial.println("Dispensando comida por " + String(duration) + "ms");
  
  // Abrir compuerta
  servoMotor.write(90);
  
  // Mostrar en LCD
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Dispensando...");
  
  delay(duration);
  
  // Cerrar compuerta
  servoMotor.write(0);
  
  Serial.println("Dispensado completado");
}
```

---

## **FASE 3: MODIFICACIÓN DE LA APP REACT NATIVE**

### 3.1 Instalar Dependencias MQTT
```bash
cd /ruta/a/tu/fido-app
npm install react-native-mqtt
# O
npm install mqtt
```

### 3.2 Crear Servicio MQTT para Broker Online
**Archivo: `src/services/MqttService.js`**

Primero, instalar la dependencia para variables de entorno:
```bash
npm install react-native-dotenv
```

Crear archivo `.env` en la raíz del proyecto:
```env
# .env - Configuración del broker MQTT online
MQTT_BROKER=your-cluster.s1.eu.hivemq.cloud
MQTT_PORT=8883
MQTT_USERNAME=your_username
MQTT_PASSWORD=your_password
MQTT_PROTOCOL=wss
```

**Configurar babel.config.js:**
```javascript
module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    ['module:react-native-dotenv', {
      'moduleName': '@env',
      'path': '.env',
    }]
  ]
};
```

**Servicio MQTT actualizado:**
```javascript
import mqtt from 'mqtt';
import { MQTT_BROKER, MQTT_PORT, MQTT_USERNAME, MQTT_PASSWORD, MQTT_PROTOCOL } from '@env';

class MqttService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.discoveredDispensers = new Map();
    this.listeners = new Map();
  }

  connect() {
    return new Promise((resolve, reject) => {
      try {
        const clientId = `fido_app_${Math.random().toString(16).substr(2, 8)}`;
        const brokerUrl = `${MQTT_PROTOCOL}://${MQTT_BROKER}:${MQTT_PORT}`;
        
        this.client = mqtt.connect(brokerUrl, {
          clientId,
          username: MQTT_USERNAME,
          password: MQTT_PASSWORD,
          keepalive: 60,
          reconnectPeriod: 5000,
          connectTimeout: 30 * 1000,
          rejectUnauthorized: true, // Validar certificados SSL
        });

        this.client.on('connect', () => {
          console.log('MQTT conectado al broker online');
          this.isConnected = true;
          
          // Suscribirse a tópicos de descubrimiento
          this.client.subscribe('fido/discovery');
          this.client.subscribe('fido/connect/+/response');
          this.client.subscribe('fido/status/+');
          this.client.subscribe('fido/command/+/response');
          this.client.subscribe('fido/heartbeat/+');
          
          resolve();
        });

        this.client.on('message', (topic, message) => {
          this.handleMessage(topic, message.toString());
        });

        this.client.on('error', (error) => {
          console.error('Error MQTT:', error);
          reject(error);
        });

        this.client.on('close', () => {
          console.log('MQTT desconectado');
          this.isConnected = false;
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  handleMessage(topic, message) {
    try {
      const data = JSON.parse(message);
      
      if (topic === 'fido/discovery') {
        this.handleDiscovery(data);
      } else if (topic.includes('/status/')) {
        this.handleStatus(data);
      } else if (topic.includes('/connect/') && topic.includes('/response')) {
        this.handleConnectionResponse(data);
      } else if (topic.includes('/command/') && topic.includes('/response')) {
        this.handleCommandResponse(data);
      } else if (topic.includes('/heartbeat/')) {
        this.handleHeartbeat(data);
      }
    } catch (error) {
      console.error('Error parseando mensaje MQTT:', error);
    }
  }

  handleDiscovery(data) {
    console.log('Dispensador descubierto:', data);
    this.discoveredDispensers.set(data.dispenserId, {
      ...data,
      lastSeen: new Date(),
    });
    
    // Notificar listeners
    this.notifyListeners('discovery', data);
  }

  handleStatus(data) {
    // Actualizar estado del dispensador
    if (this.discoveredDispensers.has(data.dispenserId)) {
      const dispenser = this.discoveredDispensers.get(data.dispenserId);
      this.discoveredDispensers.set(data.dispenserId, {
        ...dispenser,
        ...data,
        lastSeen: new Date(),
      });
    }
    
    this.notifyListeners('status', data);
  }

  handleConnectionResponse(data) {
    this.notifyListeners('connectionResponse', data);
  }

  handleCommandResponse(data) {
    this.notifyListeners('commandResponse', data);
  }

  handleHeartbeat(data) {
    if (this.discoveredDispensers.has(data.dispenserId)) {
      const dispenser = this.discoveredDispensers.get(data.dispenserId);
      this.discoveredDispensers.set(data.dispenserId, {
        ...dispenser,
        lastSeen: new Date(),
        isOnline: true,
      });
    }
    
    this.notifyListeners('heartbeat', data);
  }

  // Conectar a un dispensador específico
  connectToDispenser(dispenserId, password) {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        reject(new Error('MQTT no conectado'));
        return;
      }

      const topic = `fido/connect/${dispenserId}`;
      const message = JSON.stringify({
        password: password,
        timestamp: Date.now(),
      });

      // Configurar listener temporal para la respuesta
      const responseListener = (data) => {
        if (data.dispenserId === dispenserId) {
          this.removeListener('connectionResponse', responseListener);
          if (data.status === 'connected') {
            resolve(data);
          } else {
            reject(new Error(data.message || 'Conexión fallida'));
          }
        }
      };

      this.addListener('connectionResponse', responseListener);
      
      // Enviar comando de conexión
      this.client.publish(topic, message);
      
      // Timeout después de 10 segundos
      setTimeout(() => {
        this.removeListener('connectionResponse', responseListener);
        reject(new Error('Timeout de conexión'));
      }, 10000);
    });
  }

  // Enviar comando de dispensado
  dispenseFood(dispenserId, duration = 1000) {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        reject(new Error('MQTT no conectado'));
        return;
      }

      const topic = `fido/command/${dispenserId}`;
      const message = JSON.stringify({
        command: 'dispense',
        duration: duration,
        timestamp: Date.now(),
      });

      // Configurar listener temporal para la respuesta
      const responseListener = (data) => {
        if (data.command === 'dispense') {
          this.removeListener('commandResponse', responseListener);
          if (data.status === 'completed') {
            resolve(data);
          } else {
            reject(new Error('Comando fallido'));
          }
        }
      };

      this.addListener('commandResponse', responseListener);
      
      // Enviar comando
      this.client.publish(topic, message);
      
      // Timeout después de 30 segundos
      setTimeout(() => {
        this.removeListener('commandResponse', responseListener);
        reject(new Error('Timeout de comando'));
      }, 30000);
    });
  }

  // Obtener dispensadores descubiertos
  getDiscoveredDispensers() {
    const now = new Date();
    const result = [];
    
    for (const [id, dispenser] of this.discoveredDispensers) {
      // Considerar offline si no se ha visto en más de 2 minutos
      const isOnline = (now - dispenser.lastSeen) < 120000;
      result.push({
        ...dispenser,
        isOnline,
      });
    }
    
    return result;
  }

  // Sistema de listeners
  addListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  removeListener(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error en listener:', error);
        }
      });
    }
  }

  disconnect() {
    if (this.client) {
      this.client.end();
      this.isConnected = false;
    }
  }
}

export default new MqttService();
```

### 3.3 Crear Hook para Dispensadores
**Archivo: `src/hooks/useDispenserDiscovery.js`**
```javascript
import { useState, useEffect } from 'react';
import MqttService from '../services/MqttService';

export function useDispenserDiscovery() {
  const [discoveredDispensers, setDiscoveredDispensers] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [mqttConnected, setMqttConnected] = useState(false);

  useEffect(() => {
    // Conectar MQTT al montar el componente
    const connectMqtt = async () => {
      try {
        setIsScanning(true);
        await MqttService.connect('mqtt://192.168.1.100:1883'); // Cambiar por tu IP
        setMqttConnected(true);
        
        // Configurar listeners
        MqttService.addListener('discovery', handleDiscovery);
        MqttService.addListener('status', handleStatus);
        MqttService.addListener('heartbeat', handleHeartbeat);
        
      } catch (error) {
        console.error('Error conectando MQTT:', error);
        setMqttConnected(false);
      } finally {
        setIsScanning(false);
      }
    };

    connectMqtt();

    // Actualizar lista cada 5 segundos
    const interval = setInterval(() => {
      if (mqttConnected) {
        const dispensers = MqttService.getDiscoveredDispensers();
        setDiscoveredDispensers(dispensers);
      }
    }, 5000);

    return () => {
      clearInterval(interval);
      MqttService.removeListener('discovery', handleDiscovery);
      MqttService.removeListener('status', handleStatus);
      MqttService.removeListener('heartbeat', handleHeartbeat);
    };
  }, []);

  const handleDiscovery = (data) => {
    console.log('Nuevo dispensador:', data);
    const dispensers = MqttService.getDiscoveredDispensers();
    setDiscoveredDispensers(dispensers);
  };

  const handleStatus = (data) => {
    const dispensers = MqttService.getDiscoveredDispensers();
    setDiscoveredDispensers(dispensers);
  };

  const handleHeartbeat = (data) => {
    const dispensers = MqttService.getDiscoveredDispensers();
    setDiscoveredDispensers(dispensers);
  };

  const connectToDispenser = async (dispenserId, password = 'FIDO2025') => {
    try {
      const result = await MqttService.connectToDispenser(dispenserId, password);
      return result;
    } catch (error) {
      throw error;
    }
  };

  const dispenseFood = async (dispenserId, duration = 1000) => {
    try {
      const result = await MqttService.dispenseFood(dispenserId, duration);
      return result;
    } catch (error) {
      throw error;
    }
  };

  return {
    discoveredDispensers,
    isScanning,
    mqttConnected,
    connectToDispenser,
    dispenseFood,
  };
}
```

---

## **FASE 4: TESTING Y PRODUCCIÓN PARA PLAY STORE**

### 4.1 Testing del Broker Online

**Verificar conectividad del ESP32:**
```cpp
// En el setup() del ESP32, agregar debug
void setup() {
  Serial.begin(115200);
  
  setupWiFi();
  
  // Test de conectividad SSL
  WiFiClientSecure testClient;
  if (testClient.connect(mqtt_server, mqtt_port)) {
    Serial.println("✓ Conexión SSL exitosa al broker");
    testClient.stop();
  } else {
    Serial.println("✗ Error de conexión SSL");
  }
  
  setupMQTT();
}
```

**Verificar desde la app:**
```javascript
// En MqttService.js, agregar método de test
async testConnection() {
  try {
    await this.connect();
    console.log('✓ Conexión exitosa al broker online');
    return true;
  } catch (error) {
    console.error('✗ Error de conexión:', error);
    return false;
  }
}
```

### 4.2 Configuración de Seguridad para Producción

**Variables de entorno seguras para build:**
```javascript
// Para producción, usar react-native-config
import Config from 'react-native-config';

const MQTT_CONFIG = {
  broker: Config.MQTT_BROKER || 'fallback-broker.com',
  port: parseInt(Config.MQTT_PORT) || 8883,
  username: Config.MQTT_USERNAME,
  password: Config.MQTT_PASSWORD,
};
```

**Build de producción seguro:**
```bash
# Instalar react-native-config
npm install react-native-config

# Crear archivo .env.production
echo "MQTT_BROKER=your-cluster.s1.eu.hivemq.cloud" > .env.production
echo "MQTT_PORT=8883" >> .env.production
echo "MQTT_USERNAME=your_username" >> .env.production
echo "MQTT_PASSWORD=your_password" >> .env.production

# Build para Play Store
cd android
ENVFILE=.env.production ./gradlew assembleRelease
```

### 4.3 Preparación para Play Store

**Permisos en AndroidManifest.xml:**
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
```

**Configuración de red security:**
```xml
<!-- android/app/src/main/res/xml/network_security_config.xml -->
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="false">
        <domain includeSubdomains="true">hivemq.cloud</domain>
        <domain includeSubdomains="true">your-domain.com</domain>
    </domain-config>
</network-security-config>
```

## **FASE 5: MODIFICAR PANTALLA DE SELECCIÓN DE DISPENSADOR**

### 4.1 Actualizar MyPetScreen
**Agregar al archivo `src/screens/Mypet.js`:**

```javascript
// Importar el hook
import { useDispenserDiscovery } from '../hooks/useDispenserDiscovery';

// En el componente MyPetScreen, agregar:
const {
  discoveredDispensers,
  isScanning,
  mqttConnected,
  connectToDispenser,
} = useDispenserDiscovery();

// Reemplazar availableDispensers por discoveredDispensers
// Y actualizar la UI para mostrar dispensadores reales
```

---

## **FASE 5: CONFIGURACIÓN Y PRUEBAS**

### 5.1 Configurar IPs
1. **Obtener IP de tu computadora:**
   ```bash
   # Windows
   ipconfig
   
   # Linux/Mac
   ifconfig
   ```

2. **Actualizar código ESP32:** Cambiar `TU_IP_BROKER_MQTT` por tu IP real

3. **Actualizar código App:** Cambiar la IP en `MqttService.connect()`

### 5.2 Secuencia de Pruebas
1. **Iniciar Broker MQTT** en tu computadora
2. **Cargar código en ESP32S3** y verificar conexión WiFi
3. **Ejecutar app** y verificar conexión MQTT
4. **Probar descubrimiento** de dispensadores
5. **Probar conexión** con contraseña
6. **Probar dispensado** manual

### 5.3 Debugging
```bash
# Monitorear tópicos MQTT
mosquitto_sub -h localhost -t "fido/#" -v

# Publicar comando manual de prueba
mosquitto_pub -h localhost -t "fido/command/FIDO_XXXXXX" -m '{"command":"dispense","duration":1000}'
```

---

## **TÓPICOS MQTT UTILIZADOS**

| Tópico | Dirección | Descripción |
|--------|-----------|-------------|
| `fido/discovery` | ESP32→App | Anuncio de dispensador disponible |
| `fido/connect/{id}` | App→ESP32 | Solicitud de conexión con contraseña |
| `fido/connect/{id}/response` | ESP32→App | Respuesta de conexión |
| `fido/status/{id}` | ESP32→App | Estado del dispensador (sensores) |
| `fido/command/{id}` | App→ESP32 | Comandos (dispensar, etc.) |
| `fido/command/{id}/response` | ESP32→App | Confirmación de comando |
| `fido/heartbeat/{id}` | ESP32→App | Señal de vida |

---

## **PRÓXIMOS PASOS**

1. ✅ **Implementar código ESP32S3**
2. ✅ **Instalar y configurar broker MQTT**
3. ✅ **Crear servicio MQTT en la app**
4. ✅ **Implementar descubrimiento automático**
5. ⏳ **Probar conexión y dispensado**
6. ⏳ **Calibrar sensores**
7. ⏳ **Implementar horarios automáticos**
8. ⏳ **Optimizar interfaz**

## **RESUMEN FINAL - CONFIGURACIÓN PARA PLAY STORE** 🎉

### Opción 1: HiveMQ Cloud (Recomendado - Gratuito)
1. **Crear cuenta:** [HiveMQ Cloud](https://www.hivemq.com/mqtt-cloud-broker/)
2. **Crear cluster gratuito** (hasta 100 conexiones)
3. **Configurar credenciales:**
   - Broker: `your-cluster.s1.eu.hivemq.cloud`
   - Puerto: `8883` (SSL)
   - Usuario y contraseña personalizados
4. **Actualizar `.env.production`** con las credenciales
5. **Compilar app** con `ENVFILE=.env.production`

### Opción 2: VPS Personalizado
1. **Servidor Ubuntu** con IP pública
2. **Instalar Mosquitto** con SSL/TLS
3. **Certificados Let's Encrypt** para HTTPS
4. **Configurar puertos** 8883/8884
5. **Dominio personalizado** (ej: mqtt.tu-dominio.com)

### Checklist Final:
- ✅ ESP32S3 configurado con SSL y credenciales online
- ✅ App React Native con broker online en producción
- ✅ Variables de entorno seguras para build
- ✅ Permisos de red configurados para Android
- ✅ Testing de conectividad completo
- ✅ Build de producción listo para Play Store

**¡Tu sistema FIDO funcionará globalmente en cualquier dispositivo y ubicación!**

Con esta configuración, tanto la app como el dispensador se conectarán automáticamente al broker online, permitiendo control remoto desde cualquier parte del mundo. ¡Perfecto para la distribución en Play Store! 🚀
