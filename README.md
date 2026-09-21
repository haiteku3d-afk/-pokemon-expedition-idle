# Expedition Idle

Prototipo web de una aventura incremental de colección, expediciones, zonas y gimnasios inspirada en Kanto.

## Desarrollo

```bash
npm install
npm run dev
```

## Producción

```bash
npm run build
npm run preview
```

## Estado del MVP

- Interfaz responsive del campamento.
- Mapa vectorial interactivo de Kanto.
- Camino inicial de misiones.
- Diseños para tres categorías de sobres.
- Pokédex y navegación principal.
- Elección de compañero inicial.
- Duplicados que aumentan copias y nivel de las cartas.
- Integración preparada para Google Sign-In y Firestore.
- Flujo de GitHub Pages preparado.

## Guardado con Google

1. Crea un proyecto en Firebase.
2. Activa **Authentication > Google** y crea una base de datos de **Cloud Firestore**.
3. Copia `.env.example` como `.env.local` y completa las seis variables del proyecto web.
4. Publica las reglas incluidas en `firestore.rules`.

Sin esas variables la app entra explícitamente en modo prototipo y no escribe datos en el navegador. Con Firebase configurado, cada jugador guarda su progreso en `players/{uid}` y solo puede leer o modificar su propio documento.

Proyecto personal no oficial. No incluye recursos visuales oficiales ni está afiliado con Nintendo, Game Freak o The Pokémon Company.
