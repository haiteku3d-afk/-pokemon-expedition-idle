# Expedition Idle — preliminar 0.3

Versión independiente de diseño y balance sobre el proyecto original. Servir esta carpeta mediante un servidor estático.

- 1025 especies nacionales y 540 familias evolutivas, generaciones 1–9. No incluye formas alternativas ni megas.
- Elección inicial entre los 27 iniciales de nueve generaciones. Un Pokémon inicial, sin colección gratuita adicional.
- PWB: suma de estadísticas base. PWT: PWB + IVs actuales; nivel y aura se aplican aparte.
- Once rutas por intervalo PWB, con rival de nivel 5 + 8×ruta (±1). Equipos enemigos de igual tamaño al equipo que sale.
- Tipos oficiales (PokéAPI type_efficacy.csv). Ataques de potencia 40 y STAB ×1,5. Inmunidades sustituidas por multiplicador mínimo total ×0,1. Doble tipo combina efectividades. Cada Pokémon elige su propio tipo más efectivo y ataque físico/especial según su atributo ofensivo más alto. Esta preliminar no usa movimientos individuales.
- Estadísticas al nivel e IVs actuales; velocidad ordena turnos. Sin curación entre combates. El equipo pierde miembros al caer y la expedición termina cuando todos caen. Un combate cada 15 s, hasta 60 rondas internas (agotamiento implica derrota). Online y offline usan exactamente la misma simulación y RNG de expedición.
- Sobres: 20% por victoria; sin premios tras perder. Tres Pokémon por sobre. Apertura de 1, 10, 50 o todos (máximo 1000 por operación) y resumen agrupado. RNG del sobre independiente del RNG de las expediciones.
- Seis equipos de hasta seis familias únicas, desbloqueados con 0/2/4/5/7/8 medallas. Los gimnasios aún usan umbral de poder.
- IV automático por reciclaje (1/3/6 puntos por etapa), coste 1+mejoras gastadas, mejora el atributo más bajo, máximo 31 por atributo.
- Primera captura shiny 1/512: aura familiar permanente +5% de daño, sin apilar duplicados.
- Laboratorio: simular ocho horas, añadir colección de prueba, exportar/importar y reiniciar con confirmación en la interfaz.
- Partidas de preliminar 0.2 conservan colección, monedas, medallas y sobres. Se retiran expediciones antiguas para adoptar el nuevo combate. Guardado local, separado de Firebase.

## Verificación

`node preliminary/engine.test.mjs` y `node preliminary/ui.test.mjs` desde la raíz. Pruebas de catálogo, tipos, offline/online, límite de derrota, apertura por lote, IVs/PWT, migración y flujo UI programático.

## Fuentes

https://github.com/PokeAPI/pokeapi/tree/master/data/v2/csv y https://github.com/PokeAPI/sprites. Proyecto personal no oficial.
