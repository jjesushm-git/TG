# Gopionline v1.1.2

PWA de notas con acuario animado. Funciona en modo local inmediatamente; para cuentas y sincronización usa GitHub Pages + Supabase.

## Configuración de Supabase

1. Crea un proyecto gratuito en Supabase.
2. Abre **SQL Editor**, pega `supabase.sql` y ejecútalo.
3. En **Authentication > Providers > Email**, deja activo Email. Puedes desactivar “Confirm email” durante las pruebas.
4. En **Project Settings > API**, copia `Project URL` y la clave pública `anon`.
5. Pega ambos valores en `config.js`. La clave `anon` es pública; nunca pongas la clave `service_role` en estos archivos.
6. En **Authentication > URL Configuration**, agrega la URL de GitHub Pages en Site URL y Redirect URLs.

## Publicar en GitHub Pages

Sube todos los archivos a la raíz del repositorio. En **Settings > Pages**, selecciona **Deploy from a branch**, rama `main`, carpeta `/root` y guarda. Abre la dirección HTTPS publicada e instala la app desde el navegador.

## Reglas incluidas

- Título de 1 a 18 caracteres; nota de 1 a 500.
- Máximo 15 notas por charco; se crea automáticamente Charco 02, 03, etc.
- Charcos manuales con prefijo “Charco”.
- Edición, movimiento, borrado con confirmación y fecha/hora.
- Cada usuario solo puede consultar y modificar sus propios registros mediante RLS.
- Desliza verticalmente o usa la rueda para girar la pecera cilíndrica.
- Los peces pueden atravesarse; al empalmarse aceleran horizontalmente.
- Fondos seleccionables: Océano claro y Barco embrujado.
