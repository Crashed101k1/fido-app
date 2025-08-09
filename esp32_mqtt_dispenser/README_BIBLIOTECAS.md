# FIDO Smart Dispenser - Bibliotecas Requeridas

Para compilar este proyecto en Arduino IDE, necesitas instalar las siguientes bibliotecas:

## Bibliotecas del Administrador de Bibliotecas de Arduino:

1. **LiquidCrystal I2C** por Frank de Brabander
   - Versión: 1.1.2 o superior
   - Para el control de la pantalla LCD I2C

2. **ESP32Servo** por Kevin Harrington, John K. Bennett
   - Versión: 0.13.0 o superior
   - Para el control del servo motor

3. **HX711 Arduino Library** por Bogdan Necula
   - Versión: 0.7.5 o superior
   - Para la celda de carga

4. **PubSubClient** por Nick O'Leary
   - Versión: 2.8.0 o superior
   - Para la conectividad MQTT

5. **ArduinoJson** por Benoit Blanchon
   - Versión: 6.21.3 o superior
   - Para el manejo de JSON en MQTT

## Bibliotecas incluidas con ESP32:
- WiFi (incluida con el core ESP32)
- Wire (incluida con Arduino Core)

## Instrucciones de instalación:

1. Abrir Arduino IDE
2. Ir a Herramientas > Administrar Bibliotecas
3. Buscar cada biblioteca por nombre
4. Instalar la versión más reciente de cada una

## Configuración de la placa:

1. Instalar el soporte para ESP32:
   - Ir a Archivo > Preferencias
   - Agregar URL: https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   - Ir a Herramientas > Placa > Administrador de placas
   - Buscar "ESP32" e instalar "ESP32 by Espressif Systems"

2. Seleccionar la placa correcta:
   - Herramientas > Placa > ESP32 Arduino > "LOLIN S3"

3. Configurar puerto:
   - Herramientas > Puerto > [Seleccionar puerto COM correspondiente]

## Notas importantes:

- Asegúrate de que tu ESP32-S3 LOLIN esté conectado vía USB
- El código está optimizado para ESP32-S3 LOLIN específicamente
- Todas las conexiones de pines están configuradas según el esquema original
- No modificar la distribución de pines sin ajustar las constantes correspondientes
