# Cattleya

Sitio web + administrador de productos para Cattleya (Palmira): catálogo de
plantas y orquídeas, carta de brunch, y panel de administración para que
Ángeles gestione todo (activar/desactivar, precios, imágenes, promos,
categorías) sin tocar código.

Stack: HTML/CSS/JS vanilla, Firebase Firestore + Auth, deploy a Hostinger
por FTP. Ver **`docs/ARCHITECTURE.md`** para el detalle completo de
estructura de carpetas, modelo de datos y estado del proyecto.

## Estado actual

- ✅ Estructura de carpetas, identidad visual (paleta muestreada del menú
  real), CSS base.
- ✅ Home, catálogo de plantas y carta de brunch maquetados y conectados a
  Firestore (falta crear el proyecto de Firebase real).
- ✅ Seed de datos: brunch con la info real del menú actual; plantas con
  datos placeholder (pendiente catálogo real de Ángeles).
- ✅ Panel de administración (login + CRUD de productos y categorías).
- ✅ Script de deploy a Hostinger (`deploy/`), independiente de Beer Garden.
- ⬜ Falta: crear el proyecto de Firebase, cargar el seed, crear el primer
  usuario admin, conseguir fotos reales de plantas, y conectar el hosting.

## Próximos pasos (en orden)

1. Crear el proyecto en [Firebase Console](https://console.firebase.google.com)
   (Firestore + Authentication con método Email/Password).
2. Pegar el `firebaseConfig` en `js/firebase-config.js`.
3. Desplegar las reglas: `firebase deploy --only firestore` desde la
   carpeta `firebase/` (requiere `firebase-tools` y estar logueado).
4. Crear el usuario de Ángeles en Firebase Auth y su documento en
   `admins/{uid}` (ver `docs/ARCHITECTURE.md`).
5. Cargar los datos iniciales: `cd seed && npm install && npm run seed`.
6. Completar `deploy/.env` con las credenciales de Hostinger de Cattleya y
   correr `npm run deploy:dry` para revisar, luego `npm run deploy`.

## Desarrollo local

No hay build step. Basta con servir la carpeta con cualquier servidor
estático, por ejemplo:

```bash
npx serve .
```
