// Función para publicar datos de sensores con campo 'type' opcional
void publishSensorData(float weight, float distance, String dispenserState, float dispensedAmount, float porcentajeLlenado, String type) {
  if (!mqttConnected) {
    Serial.println("[MQTT] ERROR: No conectado a MQTT, no se pueden enviar datos");
    return;
  }
  
  StaticJsonDocument<350> doc;
  doc["deviceId"] = device_id;
  doc["timestamp"] = millis();
  doc["weight"] = round(weight * 10) / 10.0;
  doc["distance"] = round(distance * 10) / 10.0;
  doc["dispenserState"] = dispenserState;
  doc["dispensedAmount"] = round(dispensedAmount * 10) / 10.0;
  doc["containerLevel"] = round(porcentajeLlenado);
  doc["batteryLevel"] = 100;
  doc["isOnline"] = true;
  if (type.length() > 0) doc["type"] = type;
  
  String message;
  serializeJson(doc, message);
  
  // Log detallado para debug
  Serial.println("========== ENVIO MQTT ==========");
  Serial.print("[MQTT] Topic: ");
  Serial.println(topic_data);
  Serial.print("[MQTT] DeviceID: ");
  Serial.println(device_id);
  Serial.print("[MQTT] ContainerLevel enviado: ");
  Serial.println(round(porcentajeLlenado));
  Serial.print("[MQTT] Mensaje JSON completo: ");
  Serial.println(message);
  Serial.println("================================");
  
  bool published = client.publish(topic_data.c_str(), message.c_str());
  if (published) {
    Serial.println("[MQTT] ✅ Mensaje enviado exitosamente");
  } else {
    Serial.println("[MQTT] ❌ ERROR: Fallo al enviar mensaje");
  }
}

// Función para publicar respuesta a comandos con campo 'type' opcional
void publishResponseWithType(const char* command, const char* result, const char* message, String type) {
  if (!mqttConnected) return;
  StaticJsonDocument<250> doc;
  doc["deviceId"] = device_id;
  doc["command"] = command;
  doc["result"] = result;
  doc["message"] = message;
  doc["timestamp"] = millis();
  if (type.length() > 0) doc["type"] = type;
  String response;
  serializeJson(doc, response);
  client.publish(topic_response.c_str(), response.c_str());
}
