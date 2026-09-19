# Configurar Supabase para TableroGO

## 1. Crear el proyecto

Entra en https://supabase.com, crea un proyecto gratuito y espera a que termine la preparación.

En la sección **Security** selecciona:

- **Enable Data API:** activado.
- **Automatically expose new tables:** desactivado.
- **Enable automatic RLS:** activado.

El archivo SQL concede manualmente a los usuarios autenticados solamente los permisos que TableroGO necesita.

## 2. Crear tablas y seguridad

Abre **SQL Editor > New query**, copia todo el contenido de `supabase.sql`, pulsa **Run** y confirma que aparezca “Success”. El archivo crea perfiles, roles, autorización de cuentas, mensajes y la limpieza automática de solicitudes pendientes después de siete días.

Desde la versión 1.1.8 debes ejecutar nuevamente el archivo completo. Es seguro repetirlo y activará la tabla `messages` en Supabase Realtime para recibir mensajes sin salir de la pantalla.

Para la versión 1.1.10 vuelve a ejecutarlo una vez: agrega la edición y eliminación segura de mensajes propios. No borra las conversaciones existentes.

Para la versión 1.1.11 vuelve a ejecutarlo una vez. Añade el chat grupal `Recreo`, permite conservar los mensajes existentes y crea la función segura para borrar conversaciones.

Para la versión 1.1.12 vuelve a ejecutarlo una vez. Añade a `profiles` las preferencias de correo/apodo y permite que cada usuario autorizado cambie únicamente su propia identidad visible. Los datos anteriores se conservan.

Si aparece un error indicando que `pg_cron` no está disponible, entra en **Database > Extensions**, busca `pg_cron`, actívalo y vuelve a ejecutar el archivo.

## 3. Configurar las cuentas

Abre **Authentication > Providers > Email** y deja activado Email. Para las primeras pruebas puedes desactivar **Confirm email**; en producción es más seguro mantenerlo activo.

## 4. Copiar los datos públicos

Abre **Project Settings > API** y copia **Project URL** y **anon public key** (o **Publishable key**).

Abre `config.js` y completa:

```js
window.GOPI_CONFIG = {
  supabaseUrl: "https://TU-PROYECTO.supabase.co",
  supabaseAnonKey: "TU-CLAVE-PUBLICA"
};
```

No uses la clave `service_role`; esa clave nunca debe publicarse en GitHub.

## 5. Autorizar GitHub Pages

En **Authentication > URL Configuration** coloca como **Site URL** la dirección completa de tu aplicación, por ejemplo:

`https://TU-USUARIO.github.io/TU-REPOSITORIO/`

Agrega la misma dirección en **Redirect URLs**.

## 6. Comprobar

En **Data API > Settings > Exposed tables**, activa `ponds`, `notes`, `profiles` y `messages`. En **Exposed functions**, activa `approve_users`, `revoke_user` y `clear_chat`; no expongas `cleanup_expired_pending_users`. Publica los archivos. La primera cuenta existente queda como administradora; crea una segunda cuenta, entra con la administradora y abre **Ajustes > Autorizar cuentas nuevas**. Verifica que cada cuenta vea únicamente sus propias pizarras y notas.
