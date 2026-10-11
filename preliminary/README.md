# Expedition Idle — preliminar 0.6

Versión independiente de diseño y balance sobre el proyecto original. Servir esta carpeta mediante un servidor estático.

- 1025 especies nacionales y 540 familias evolutivas, generaciones 1–9. No incluye formas alternativas ni megas.
- Elección inicial entre los 27 iniciales de nueve generaciones. Un Pokémon inicial, sin colección gratuita adicional.
- PWB: suma de estadísticas base. PWT: PWB + IVs actuales; nivel y aura se aplican aparte.
- Once rutas por intervalo PWB, con rival de nivel 3 + 8×ruta (±1). Un rival por encuentro. Solo combate el primer compañero vivo; si cae, se releva automáticamente sin curar al rival. Tener reservas alarga la incursión.
- Tipos oficiales (PokéAPI type_efficacy.csv). Ataques de potencia 40 y STAB ×1,5. Inmunidades sustituidas por multiplicador mínimo total ×0,1. Doble tipo combina efectividades. Cada Pokémon elige su propio tipo más efectivo y ataque físico/especial según su atributo ofensivo más alto. Esta preliminar no usa movimientos individuales.
- Estadísticas al nivel e IVs actuales; velocidad ordena turnos. Sin curación entre combates. El equipo pierde miembros al caer y la expedición termina cuando todos caen. Recorrido dependiente de velocidad (12/(1+velocidad_media/25) segundos, mínimo 3 s), seguido de un duelo visual de 4 s, hasta 60 rondas internas (agotamiento implica derrota). Online y offline usan exactamente la misma simulación y RNG de expedición.
- Sobres: 20% por victoria; sin premios tras perder. Tres Pokémon por sobre. Apertura de 1, 10, 50 o todos (máximo 1000 por operación) y resumen agrupado. RNG del sobre independiente del RNG de las expediciones.
- Seis equipos de hasta seis familias únicas, desbloqueados con 0/2/4/5/7/8 medallas. Los gimnasios aún usan umbral de poder.
- IV automático por reciclaje (1/3/6 puntos por etapa), coste 1+mejoras gastadas, mejora el atributo más bajo, máximo 31 por atributo.
- Primera captura shiny 1/512: aura familiar permanente +5% de daño, sin apilar duplicados.
- Laboratorio: simular ocho horas, añadir colección de prueba, exportar/importar y reiniciar con confirmación en la interfaz.
- Partidas de preliminar 0.2/0.3/0.4/0.5 conservan colección, monedas, medallas y sobres. Se retiran expediciones antiguas para adoptar el nuevo combate. Guardado local, separado de Firebase.

## Verificación

`node preliminary/engine.test.mjs` y `node preliminary/ui.test.mjs` desde la raíz. Pruebas de catálogo, tipos, offline/online, límite de derrota, apertura por lote, IVs/PWT, migración y flujo UI programático.

## Fuentes

https://github.com/PokeAPI/pokeapi/tree/master/data/v2/csv y https://github.com/PokeAPI/sprites. Proyecto personal no oficial.

## Pasillos y estadísticas

Cada equipo tiene un pasillo CSS en pixel art, fases de recorrido/duelo, sprites pixelados, PS individuales y registro de ocho eventos (se muestran los cinco últimos). Se utiliza el sprite normal/shiny de PokéAPI en toda la interfaz, incluyendo la portada. La velocidad de supervivientes reduce el tiempo al siguiente rival. La ficha muestra seis estadísticas calculadas al nivel actual, bases e IVs. PS determina vida individual; ataque físico usa Defensa y especial usa Defensa especial. Los movimientos individuales aún no existen: ataque básico provisional de potencia 40. `attackCharge` prepara un tiempo de carga dependiente de velocidad para futuros ataques; ahora solo acompaña la animación de duelo. Los eventos de simulación y su reloj son idénticos online y offline.

## Progresión de especies y relevo

Las rutas comienzan con las cinco especies de menor PWB y desbloquean cinco más cada diez victorias acumuladas por ruta. Encuentros y sobres excluyen especies bloqueadas. Los combates concurrentes se resuelven cronológicamente para mantener igualdad online/offline al desbloquear especies. La EXP sigue la fórmula de primera generación y el reparto detallado abajo. Los debilitados no reciben EXP. Las estadísticas se actualizan al subir de nivel durante la expedición. El log se muestra del más reciente al más antiguo. Expedición rápida repite el último equipo y ruta, restaurando PS, sin permitir duplicar compañeros asignados a otro equipo. Las partidas anteriores conservan colección y recompensas, y se retiran expediciones para adoptar el nuevo motor.

## Experiencia (0.6)

Referencia solicitada: https://www.pokexperto.net/index2.php?seccion=mecanica/experience

EXP por rival salvaje = floor(EXP base de especie × nivel / 7), sin bonus de entrenador/intercambio/objeto. Principal superviviente que vence al rival recibe floor(EXP/2); el otro 50% se divide equitativamente entre compañeros no debilitados, redondeando hacia abajo. Si solo queda un superviviente, recibe toda la EXP. Nivel 100 consume su porción pero no acumula más EXP.

Todas las especies usan crecimiento normal, EXP total = nivel³. Nivel 5 empieza con 125 EXP y nivel 6 requiere 216 (91 adicionales). Máximo nivel 100 / 1.000.000 EXP. Barras azules bajo los PS muestran progreso dentro del nivel. Los niveles anteriores se conservan al convertir su progreso fraccional al nuevo intervalo cúbico.

Kanto utiliza los 151 valores de experiencia base de Rojo/Azul extraídos de las tablas de https://github.com/pret/pokered/tree/master/data/pokemon/base_stats y preservados como datos numéricos en data/gen1_experience.json. Especies de generaciones posteriores usan base_experience de PokéAPI, ya que no existían en primera generación; a todas se aplica la misma fórmula Gen1.

Al subir de nivel, las estadísticas del combatiente vivo se recalculan. Sus PS crecen en la diferencia de PS máximos, conservando heridas; ningún debilitado revive. Sprites aliados invertidos horizontalmente durante recorrido y ataques. Ataque básico todavía provisional, no hay movimientos individuales implementados.
