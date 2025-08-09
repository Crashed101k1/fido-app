/*
 * MQTT CONNECTION HANDLER FOR FIDO SMART DISPENSER
 * 
 * Este archivo maneja toda la conectividad MQTT con shiftr.io
 * para el dispensador inteligente FIDO
 */

#ifndef MQTT_CONNECTION_H
#define MQTT_CONNECTION_H

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// ========== CONFIGURACIÓN DE CONEXIÓN ==========
// WiFi Credentials
const char* ssid = "Torre B402";
const char* password = "73144984";

// MQTT Broker (shiftr.io)
const char* mqtt_server = "eridanus.cloud.shiftr.io";
const int mqtt_port = 1883;
const char* mqtt_user = "eridanus";
const char* mqtt_password = "Aeui6hvnooMPWo2j";

// Device Configuration
String device_id = ""; // Se generará automáticamente basado en MAC
String device_name = "FIDO_Dispenser";

// ========== TOPICS MQTT ==========
String topic_discovery = "fido/dispensers/discovery";
String topic_status = "";     // Se configurará dinámicamente
String topic_data = "";       // Se configurará dinámicamente  
String topic_commands = "";   // Se configurará dinámicamente
String topic_response = "";   // Se configurará dinámicamente

// ========== OBJETOS GLOBALES ==========
WiFiClient espClient;
PubSubClient client(espClient);

// ========== VARIABLES DE CONTROL ==========
unsigned long lastMQTTHeartbeat = 0;
unsigned long lastDataSend = 0;
bool mqttConnected = false;
bool wifiConnected = false;

// Callback para comandos recibidos
void (*commandCallback)(String command, JsonObject data) = nullptr;

// ========== DECLARACIONES FORWARD ==========
void publishResponse(String command, String result, String message = "");
void publishDiscovery();
void publishStatus(String status, String description = "");
void publishSensorData(float weight, float distance, String dispenserState, float dispensedAmount = 0);

// ========== FUNCIONES DE CONECTIVIDAD ==========

/**
 * Genera un ID único para el dispositivo basado en la MAC
 */
void generateDeviceID() {
  uint64_t chipid = ESP.getEfuseMac();
  device_id = "FIDO_" + String((uint32_t)(chipid >> 32), HEX) + String((uint32_t)chipid, HEX);
  device_id.toUpperCase();
  
  // Configurar topics dinámicamente
  topic_status = "fido/dispensers/" + device_id + "/status";
  topic_data = "fido/dispensers/" + device_id + "/data";
  topic_commands = "fido/dispensers/" + device_id + "/commands";
  topic_response = "fido/dispensers/" + device_id + "/response";
  
  Serial.println("Device ID: " + device_id);
}

/**
 * Conecta a la red WiFi
 */
bool connectWiFi() {
  Serial.print("Conectando a WiFi: ");
  Serial.println(ssid);
  
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    wifiConnected = true;
    Serial.println();
    Serial.println("WiFi conectado!");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
    return true;
  } else {
    wifiConnected = false;
    Serial.println();
    Serial.println("Error conectando WiFi");
    return false;
  }
}

/**
 * Callback para mensajes MQTT recibidos
 */
void onMqttMessage(char* topic, byte* payload, unsigned int length) {
  String topicStr = String(topic);
  String message = "";
  
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  
  Serial.println("Mensaje recibido [" + topicStr + "]: " + message);
  
  // Procesar mensajes de discovery
  if (topicStr == topic_discovery) {
    StaticJsonDocument<200> doc;
    DeserializationError error = deserializeJson(doc, message);
    
    if (!error) {
      String action = doc["action"].as<String>();
      if (action == "discover") {
        // Responder al discovery con información del dispositivo
        publishDiscovery();
        Serial.println("Respondiendo a discovery request");
      }
    }
  }
  
  // Procesar comandos
  if (topicStr == topic_commands) {
    Serial.println("📥 Procesando comando en tópico: " + topicStr);
    StaticJsonDocument<200> doc;
    DeserializationError error = deserializeJson(doc, message);
    
    if (!error) {
      Serial.println("✅ JSON parseado correctamente");
      Serial.println("Contenido completo del JSON:");
      serializeJsonPretty(doc, Serial);
      Serial.println();
      
      // Extraer comando (puede ser "command" o "action")
      String command = "";
      if (doc.containsKey("command")) {
        command = doc["command"].as<String>();
        Serial.println("Comando extraído de 'command': " + command);
      } else if (doc.containsKey("action")) {
        command = doc["action"].as<String>();
        Serial.println("Comando extraído de 'action': " + command);
      } else {
        Serial.println("❌ No se encontró 'command' ni 'action' en el JSON");
      }
      
      // Obtener datos adicionales
      JsonObject data;
      if (doc.containsKey("data")) {
        data = doc["data"];
        Serial.println("📄 Usando campo 'data' como datos adicionales");
      } else {
        // Si no hay "data", usar el documento completo como datos
        data = doc.as<JsonObject>();
        Serial.println("📄 Usando documento completo como datos");
      }
      
      // Llamar callback si está configurado
      if (commandCallback != nullptr && command != "") {
        Serial.println("🔄 Llamando callback con comando: " + command);
        commandCallback(command, data);
      } else if (command == "") {
        Serial.println("❌ Comando vacío, no se ejecuta callback");
      } else {
        Serial.println("❌ Callback no configurado");
      }
      
      // Enviar respuesta de confirmación solo si no es comando de conexión
      if (command != "connect") {
        publishResponse(command, "received", "");
      }
    } else {
      Serial.println("❌ Error parseando JSON: " + String(error.c_str()));
    }
  }
}

/**
 * Conecta al broker MQTT
 */
bool connectMQTT() {
  if (!wifiConnected) {
    Serial.println("WiFi no conectado, no se puede conectar MQTT");
    return false;
  }
  
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(onMqttMessage);
  
  Serial.print("Conectando a MQTT broker: ");
  Serial.println(mqtt_server);
  
  if (client.connect(device_id.c_str(), mqtt_user, mqtt_password)) {
    mqttConnected = true;
    Serial.println("MQTT conectado!");
    
    // Suscribirse a topics
    client.subscribe(topic_commands.c_str());
    Serial.println("Suscrito a: " + topic_commands);
    
    client.subscribe(topic_discovery.c_str());
    Serial.println("Suscrito a: " + topic_discovery);
    
    // Publicar mensaje de descubrimiento
    publishDiscovery();
    
    // Publicar estado inicial
    publishStatus("online", "Sistema iniciado");
    
    return true;
  } else {
    mqttConnected = false;
    Serial.print("Error conectando MQTT, rc=");
    Serial.println(client.state());
    return false;
  }
}

/**
 * Publica mensaje de descubrimiento para que la app detecte el dispensador
 */
void publishDiscovery() {
  StaticJsonDocument<300> doc;
  
  doc["deviceId"] = device_id;
  doc["name"] = device_name;
  doc["type"] = "smart_dispenser";
  doc["version"] = "1.0.0";
  doc["ip"] = WiFi.localIP().toString();
  doc["timestamp"] = millis();
  doc["isAvailable"] = true;
  doc["batteryLevel"] = 100; // Simulado para ESP32 con alimentación
  
  String message;
  serializeJson(doc, message);
  
  client.publish(topic_discovery.c_str(), message.c_str(), true); // retained = true
  Serial.println("Mensaje de descubrimiento publicado");
}

/**
 * Publica el estado del dispensador
 */
void publishStatus(String status, String description) {
  if (!mqttConnected) return;
  
  StaticJsonDocument<200> doc;
  doc["deviceId"] = device_id;
  doc["status"] = status;
  doc["description"] = description;
  doc["timestamp"] = millis();
  doc["isOnline"] = true;
  
  String message;
  serializeJson(doc, message);
  
  client.publish(topic_status.c_str(), message.c_str());
}

/**
 * Publica datos de sensores del dispensador
 */
void publishSensorData(float weight, float distance, String dispenserState, float dispensedAmount) {
  if (!mqttConnected) return;
  
  StaticJsonDocument<300> doc;
  doc["deviceId"] = device_id;
  doc["timestamp"] = millis();
  
  // Datos de sensores
  doc["weight"] = round(weight * 10) / 10.0; // 1 decimal
  doc["distance"] = round(distance * 10) / 10.0;
  doc["dispenserState"] = dispenserState;
  doc["dispensedAmount"] = round(dispensedAmount * 10) / 10.0;
  
  // Calcular nivel del contenedor como porcentaje
  float containerLevel = 0;
  const float DIST_FULL = 8.0;
  const float DIST_EMPTY = 12.5;
  
  if (distance <= DIST_FULL) {
    containerLevel = 100;
  } else if (distance >= DIST_EMPTY) {
    containerLevel = 0;
  } else {
    containerLevel = 100.0 * (DIST_EMPTY - distance) / (DIST_EMPTY - DIST_FULL);
  }
  containerLevel = constrain(containerLevel, 0, 100);
  
  doc["containerLevel"] = round(containerLevel);
  doc["batteryLevel"] = 100; // Simulado
  doc["isOnline"] = true;
  
  String message;
  serializeJson(doc, message);
  
  client.publish(topic_data.c_str(), message.c_str());
}

/**
 * Publica respuesta a comandos
 */
void publishResponse(String command, String result, String message) {
  if (!mqttConnected) return;
  
  StaticJsonDocument<200> doc;
  doc["deviceId"] = device_id;
  doc["command"] = command;
  doc["result"] = result;
  doc["message"] = message;
  doc["timestamp"] = millis();
  
  String response;
  serializeJson(doc, response);
  
  client.publish(topic_response.c_str(), response.c_str());
}

/**
 * Configura callback para comandos recibidos
 */
void setCommandCallback(void (*callback)(String command, JsonObject data)) {
  commandCallback = callback;
}

/**
 * Mantiene la conexión MQTT activa
 */
void maintainMQTTConnection() {
  if (!client.connected() && wifiConnected) {
    unsigned long now = millis();
    if (now - lastMQTTHeartbeat > 5000) { // Reintentar cada 5 segundos
      if (connectMQTT()) {
        lastMQTTHeartbeat = now;
      }
    }
  }
  
  if (mqttConnected) {
    client.loop();
    
    // Heartbeat cada 30 segundos
    unsigned long now = millis();
    if (now - lastMQTTHeartbeat > 30000) {
      publishStatus("online", "Heartbeat");
      lastMQTTHeartbeat = now;
    }
  }
}

/**
 * Inicializa la conectividad
 */
bool initConnectivity() {
  generateDeviceID();
  
  if (connectWiFi()) {
    delay(1000);
    return connectMQTT();
  }
  
  return false;
}

/**
 * Verifica el estado de las conexiones
 */
bool isConnected() {
  return wifiConnected && mqttConnected;
}

/**
 * Obtiene información de conexión
 */
String getConnectionInfo() {
  String info = "WiFi: " + String(wifiConnected ? "OK" : "FAIL");
  info += " | MQTT: " + String(mqttConnected ? "OK" : "FAIL");
  if (wifiConnected) {
    info += " | IP: " + WiFi.localIP().toString();
  }
  return info;
}

#endif // MQTT_CONNECTION_H
