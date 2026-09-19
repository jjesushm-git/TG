# TableroGO v1.1.12

PWA escolar de notas, QR y mensajería privada con GitHub Pages + Supabase.

## Configuración de Supabase

1. Crea un proyecto gratuito en Supabase.
2. Abre **SQL Editor**, pega `supabase.sql` y ejecútalo.
3. En **Data API > Settings > Exposed tables**, activa `ponds`, `notes`, `profiles` y `messages`. En **Exposed functions**, activa `approve_users`, `revoke_user` y `clear_chat`.
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
- Códigos QR siempre abre mostrando de nuevo las opciones Texto, URL y TransferNow.
- Las notas del pizarrón usan tipografía Arial para facilitar la lectura.
- Mensajería recibe nuevos mensajes mediante Supabase Realtime y verifica novedades cada dos segundos como respaldo.
- Lápiz escolar ✏️ para editar los mensajes propios y bote 🗑️ para eliminarlos.
- Los mensajes propios se pueden editar o borrar aunque sean antiguos (se cargan hasta 1000 por conversación).
- **Borrar todo el chat** elimina ambos lados de una conversación privada. En **Recreo** solo elimina los mensajes propios, para proteger los mensajes del grupo.
- **Recreo** reúne a todas las cuentas autorizadas y admite mensajes y enlaces de archivos de TransferNow.
- Mensajería recuerda la última conversación seleccionada en ese dispositivo.
- Eliminación con animación escolar lenta a pantalla completa: hoja arrancada, hecha bola y lanzada al bote.
- En **Ajustes > Apodo** cada usuario puede mostrar su correo o un apodo personalizado de hasta 10 caracteres en Mensajería.
- En **Ajustes > Visualización** se puede elegir la vista adaptable para celular o una presentación panorámica de PC con proporción 16:9; la elección queda guardada en el dispositivo.
- La animación de borrado forma una bola de papel irregular con pliegues y sombras antes de lanzarla al bote.
- Al borrar, la hoja se arruga y sigue una trayectoria de básquet hacia el bote.
