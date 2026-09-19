# TableroGO v1.1.7

PWA escolar de notas, QR y mensajería privada con GitHub Pages + Supabase.

## Configuración de Supabase

1. Crea un proyecto gratuito en Supabase.
2. Abre **SQL Editor**, pega `supabase.sql` y ejecútalo.
3. En **Data API > Settings > Exposed tables**, activa `ponds`, `notes`, `profiles` y `messages`. En **Exposed functions**, activa `approve_users` y `revoke_user`.
4. En **Authentication > Providers > Email**, deja activo Email. Puedes desactivar “Confirm email” durante las pruebas.
5. En **Project Settings > API**, copia `Project URL` y la clave pública `anon`.
6. Pega ambos valores en `config.js`. La clave `anon` es pública; nunca pongas la clave `service_role` en estos archivos.
7. En **Authentication > URL Configuration**, agrega la URL de GitHub Pages en Site URL y Redirect URLs.

## Publicar en GitHub Pages

Sube todos los archivos a la raíz del repositorio. En **Settings > Pages**, selecciona **Deploy from a branch**, rama `main`, carpeta `/root` y guarda. Abre la dirección HTTPS publicada e instala la app desde el navegador.

## Reglas incluidas

- Título de 1 a 18 caracteres; nota de 1 a 500.
- Máximo 15 notas por pizarra; se crea automáticamente Pizarra 02, 03, etc.
- Pizarras manuales con prefijo “Pizarra”.
- Edición, movimiento, borrado con confirmación y fecha/hora.
- Cada usuario solo puede consultar y modificar sus propios registros mediante RLS.
- Atrás en Android cierra primero modales, después vuelve al menú y desde el menú cierra la sesión.
- Mi pizarra usa un tablero escolar sin animaciones ni físicas.
- Las notas aparecen ordenadas de la más reciente a la más antigua.
- Las notas cambian de tamaño según su contenido y usan tonos opacos.
- Si el contenido completo de una nota es una URL segura, al tocarla abre la página.
- QR de texto o URL, exportación JPEG/PDF, Mis QR y acceso manual a TransferNow.
- Mensajería privada entre usuarios autorizados, con tarjetas para enlaces de TransferNow.
- La primera cuenta existente queda como administradora; las cuentas nuevas requieren autorización desde Ajustes.
- Las cuentas pendientes se eliminan automáticamente al cumplir siete días mediante `pg_cron`.
