# Configurar Supabase para TableroGO

## 1. Crear el proyecto

Entra en https://supabase.com, crea un proyecto gratuito y espera a que termine la preparación.

En la sección **Security** selecciona:

- **Enable Data API:** activado.
- **Automatically expose new tables:** desactivado.
- **Enable automatic RLS:** activado.

El archivo SQL concede manualmente a los usuarios autenticados solamente los permisos que TableroGO necesita.

## 2. Crear tablas y seguridad

Abre **SQL Editor > New query**, copia todo el contenido de `supabase.sql`, pulsa **Run** y confirma que aparezca “Success”.

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

Publica los archivos, crea dos cuentas diferentes y verifica que cada cuenta vea únicamente sus propios charcos y notas. Las políticas RLS incluidas en `supabase.sql` realizan esa separación.
