# Documentación de Estructura de Archivos FIDO App

A continuación se describe la funcionalidad de los archivos principales de la app:

## Raíz
- **App.js**: Punto de entrada principal de la app React Native. Configura navegación y contexto global.
- **index.js**: Inicializa la app y registra el componente principal.
- **firebaseConfig.js**: Configuración y conexión con Firebase (Firestore, Auth, etc).
- **package.json**: Lista dependencias, scripts y metadatos del proyecto.
- **metro.config.js**: Configuración del bundler Metro para React Native.

## src/components
- **DrawerHeader.js, SharedHeader.js**: Encabezados personalizados para la navegación tipo Drawer y pantallas.
- **NotificationBell.js**: Icono y lógica para mostrar notificaciones en la app.
- **Toast.js, SuccessModal.js, SimpleSuccessModal.js**: Componentes para mostrar mensajes de éxito, errores y notificaciones emergentes.

## src/context
- **AuthContext.js**: Provee y gestiona el estado de autenticación del usuario en toda la app.
- **DispenserDiscoveryContext.js**: Maneja el estado y descubrimiento de dispensadores conectados vía MQTT.
- **NotificationContext.js**: Gestiona las notificaciones globales de la app.

## src/hooks
- **useDispenserDiscovery.js**: Hook para lógica de descubrimiento, conexión y eventos MQTT de dispensadores.
- **useFeedingData.js**: Hook para obtener y procesar datos de alimentación, horarios y registros desde Firestore.
- **usePets.js**: Hook para gestionar datos de mascotas del usuario.
- **useUserData.js**: Hook para obtener y actualizar datos del usuario.

## src/Navigation
- **MainNavigator.js**: Configura la navegación principal de la app.
- **DrawerNavigation.js**: Define la navegación tipo Drawer (menú lateral).
- **BottomTabNavigator.js**: Define la navegación por pestañas inferiores.

## src/screens
- **HomeScreen.js**: Dashboard principal, muestra estado del dispensador, progreso de alimentación y acciones rápidas.
- **EatTime.js**: Pantalla para configurar y visualizar horarios de alimentación y porciones.
- **Estadistics.js**: Muestra estadísticas de alimentación y actividad.
- **AccountScreen.js, LoginScreen.js, RegisterScreen.js**: Pantallas de gestión de cuenta y autenticación.
- **Mypet.js**: Pantalla para ver y editar datos de la mascota.
- **AboutScreen.js, ContactScreen.js**: Información de la app y contacto.

## src/utils
- **dateUtils.js**: Funciones para manejo y formato de fechas.
- **petIcons.js**: Iconos y utilidades visuales para mascotas.
- **sampleData.js**: Datos de ejemplo para pruebas y desarrollo.
- **sendEmail.js**: Utilidad para enviar correos desde la app.
- **sendFeedingRecord.js**: Función para enviar registros de alimentación a Firestore.

## Otros
- **assets/**: Imágenes, íconos y recursos gráficos usados en la app.
- **firestore.rules**: Reglas de seguridad para Firestore.
- **README.md**: Documentación general del proyecto.
- **SISTEMA_IMPLEMENTADO.md, CONFIGURACION_DISPENSADOR_FISICO.md, GUIA_SISTEMA_ALIMENTACION_PROGRAMADA.md**: Documentos técnicos y guías de implementación.

---

Esta documentación cubre los archivos más relevantes para entender la arquitectura y el flujo principal de la app FIDO. Para detalles específicos de cada módulo, consulta los comentarios en el código fuente.
