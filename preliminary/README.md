# Expedition Idle — preliminar 0.2

Versión independiente de diseño y balance. Conserva el proyecto original intacto. Servir esta carpeta con un servidor estático; abrir index.html directamente no permite cargar el catálogo JSON.

- 1025 especies nacionales, generaciones 1–9, estadísticas actuales de PokéAPI. Una forma predeterminada por especie; no incluye megas ni formas regionales alternativas.
- 540 familias evolutivas; evoluciones desbloqueadas mediante sobres. Cada familia conserva IVs, nivel y shiny al cambiar entre formas desbloqueadas.
- Once rutas disjuntas por BST; pesos decrecientes con el poder y reducción de legendarios/singulares.
- Seis equipos, desbloqueados con 0, 2, 4, 5, 7, 8 medallas. Máximo seis familias por equipo, sin compartir miembros.
- Combate simplificado de desgaste determinista, sin movimientos ni tabla de tipos. Mismo cálculo online/offline, sin premios después de la derrota. El poder y PS se fijan al partir; la experiencia de victorias se aplica al nivel para la siguiente salida.
- Sobres de tres encuentros, shiny 1/512. Primera captura shiny: aura permanente de +5% de poder familiar, sin apilamiento.
- Reciclaje automático 1/3/6 según etapa evolutiva. IV más bajo mejora automáticamente; coste 1+puntos_gastados, máximo 31 por atributo.
- Guardado local independiente, exportación/importación. No migra todavía la partida de Firebase del juego original.
- Gimnasios preliminares por umbral de poder del equipo 01, con recompensa de tres niveles por integrante.
- Herramientas de laboratorio permiten simular ocho horas y añadir una colección de prueba.

## Validación

`node preliminary/engine.test.mjs` desde la raíz del repositorio.

## Datos

Catálogo generado de https://github.com/PokeAPI/pokeapi/tree/master/data/v2/csv usando pokemon.csv, pokemon_stats.csv, pokemon_species.csv y pokemon_types.csv. Sprites y artwork de https://github.com/PokeAPI/sprites. Proyecto personal no oficial.
