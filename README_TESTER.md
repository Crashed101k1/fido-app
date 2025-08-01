# Guía de Pruebas para Tester - FIDO App

Este documento está dirigido al tester de la aplicación FIDO (Facilitador Inteligente de Dietas Organizadas). Aquí se describen las funcionalidades implementadas hasta ahora y los flujos que deben ser probados, junto con recomendaciones y casos de prueba sugeridos.

## Funcionalidades Principales a Probar

### 1. Registro y Autenticación de Usuario
- Registro de nuevos usuarios con validaciones (nombre, email, contraseña fuerte, confirmación de contraseña).
- Mensajes de error claros en caso de datos inválidos.
- Inicio de sesión con email y contraseña.
- Mensajes de error si el login falla.
- Cierre de sesión desde el menú lateral (drawer).

### 2. Navegación y Menú Drawer
- Acceso a las vistas principales desde el menú lateral:
  - Mi Cuenta
  - Inicio
  - Acerca De
  - Contáctanos
  - Cerrar Sesión
- Verificar que los labels del menú sean correctos y que la navegación funcione.

### 3. Gestión de Mascotas
- Visualización en tiempo real de la lista de mascotas en "Mi Cuenta".
- Botón "Gestionar" navega correctamente a la pantalla de gestión de mascotas.
- Edición de datos de mascota (nombre, especie, raza, edad, peso, sexo).
- Los cambios en raza y edad se reflejan en tiempo real en "Mi Cuenta".
- Agregar nueva mascota desde "Mi Cuenta" y visualizarla en la vista de "Mi cuenta" a si como los datos reales si se actualiza alguno.
- Eliminar mascota (solo si hay más de una registrada).

### 4. Contacto y Soporte
- Acceso a la vista "Contáctanos" desde el menú.
- Envío de formulario de contacto (nombre, email, mensaje) con validaciones.
- Confirmación visual (modal) tras enviar el mensaje.
- El mensaje se guarda en la colección `contactMessages` de Firebase.
- El mensaje se envía por correo electrónico al administrador (verificar recepción).
- Mensajes de error claros si falla el envío o el guardado.

### 5. Seguridad y Validaciones
- Validar que los datos personales no se puedan editar sin activar el modo edición.
- Validar que el email del usuario no sea editable.
- Validar que los datos de mascotas no se puedan editar sin activar el modo edición.
- Validar que los campos obligatorios muestren error si están vacíos.

## Casos de Prueba Sugeridos

- Registro con datos válidos e inválidos.
- Login con credenciales correctas e incorrectas.
- Navegación entre todas las vistas desde el menú.
- Edición y guardado de datos personales y de mascotas.
- Prueba de actualización en tiempo real de mascotas.
- Envío de mensaje de contacto y verificación en Firebase y correo.
- Prueba de cierre de sesión y acceso restringido.
- Prueba de validaciones en todos los formularios.

## Recomendaciones para el Tester

- Documentar cualquier error visual, de flujo o de validación.
- Probar en diferentes dispositivos y tamaños de pantalla.
- Verificar que los mensajes de error y éxito sean claros y útiles.
- Probar el flujo de contacto con diferentes correos y mensajes.
- Verificar que los datos en Firebase se actualicen correctamente.

---

**Nota:** Si encuentras algún error, por favor documenta el paso exacto y el mensaje recibido. Si alguna funcionalidad no responde como se describe, notifícalo para revisión.
