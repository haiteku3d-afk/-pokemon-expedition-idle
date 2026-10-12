# Pokémon Expedition · v0.11

Mejoras visuales: daño flotante coloreado por efectividad, once paisajes según ruta, Wiki con las reglas y campamento con Pokémon paseando. Fondos raster originales inspirados en la tercera generación: once rutas y un prado. Toda la colección aparece en un mapa ampliable sin páginas, con desplazamiento por arrastre. Los escenarios se distribuyen desde un atlas de 4 × 3. No modifica el formato de la partida ni reinicia las expediciones.

Catálogo de 1025 especies, movimientos por nivel, duelos 1 vs 1, IVs automáticos, reparto de EXP y simulación offline.

Pruebas: `node --test preliminary/*.test.mjs` desde la raíz. Los sprites requieren conexión a GitHub/PokéAPI.

Corrección: fondos con proporción original y recorte centrado, sin estiramiento. Ataques en el orden equipado, reiniciando la secuencia por duelo y omitiendo movimientos bloqueados por estados.

Gimnasios: plantilla de 2–5 rivales por líder, duelos reales con cargas, sin curación entre rivales, sin EXP ni niveles gratuitos. Una medalla y 150–500 monedas por victoria completa.
Evolución: niveles de PokéAPI para evolución por nivel; condiciones especiales adaptadas a nivel 25/40 sin inventario. Cadenas automáticas, ramas elegibles, progreso conservado. Fuente: data/v2/csv/pokemon_evolution.csv de PokeAPI.

Los sobres que contienen una etapa evolutiva superior cambian automáticamente la forma del compañero, sin requisito de nivel. Nunca lo hacen retroceder. En expedición se actualizan estadísticas sin restaurar heridas, estados ni cargas.
