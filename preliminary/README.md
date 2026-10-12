# Pokémon Expedition · v0.12.2

Juego estático con 1025 especies, movimientos por nivel, duelos 1 contra 1, IVs automáticos, evolución, reparto de EXP y simulación offline. Sprites pixel art de PokéAPI; escenarios raster originales inspirados en tercera generación. Colección completa paseando por un prado desplazable.

## Circuito de tipos

18 gimnasios adaptados, uno por tipo, con 18 medallas únicas. Grupos de seis disponibles a 0, 4 y 10 medallas. Cada gimnasio permite Bronce/Plata/Oro. Plata requiere medalla y 3 líderes vencidos en ese gimnasio; Oro requiere 10 y al menos una victoria en Plata. Equipos desbloqueados a 0, 2, 5, 9, 13 y 18 medallas.

Cada ciclo: tres entrenadores de un Pokémon y un líder de 2/3/4. El equipo conserva heridas y estados entre combates; la incursión repite ciclos hasta caer. Rivales +2 niveles y +12% de estadísticas por ciclo. Nivel del jugador limitado temporalmente a 12/28/46 según grupo, +20 en Plata y +40 en Oro. El nivel real, EXP y movimientos aprendidos permanecen. Sin EXP ni monedas de gimnasio.

Entrenadores: 15% de sobre. Derrotar al líder completo: 50%; primera medalla garantiza uno. Tres Pokémon por sobre, todos del tipo elegido (se permiten tipos dobles). Categorías con techo PWB 350/500/sin límite. Cada categoría hereda especies desbloqueadas de las inferiores y abre cinco de su nueva franja; +5 cada dos líderes vencidos en esa categoría. Peso = exp(-(PWB - mínimo)/120) × (1 + etapa/2), con ×0,15 legendarios y ×3 para la nueva franja de Plata/Oro.

Una especie exclusiva por gimnasio, sin línea evolutiva y excluida de todas las rutas y los otros gimnasios. Después de obtener la medalla: 8% por sobre de reemplazar la primera carta por el exclusivo; garantizado al sobre 20 sin exclusivo. Contador compartido entre categorías. Apertura múltiple idéntica a abrir individualmente. Los exclusivos están exentos del techo PWB.

## Velocidad por zona

Exigencia de zona = redondear(5 + 1,2 × nivel). Media de Velocidad de compañeros vivos, sin cambios temporales de atributos. Hasta igualar la exigencia: 15 s. Por encima: `max(3, 15 / (1 + 0.5 * (media / exigencia - 1)))` segundos. Doble: 10 s; triple: 7,5 s. Se calcula al preparar cada encuentro. Rutas mantienen su exigencia; gimnasios la incrementan con sus ciclos. La carga de ataques sigue usando velocidad individual y estados de combate.

## Partidas y progresión

Guardado versión 7 en la misma clave local. Convierte las ocho medallas antiguas a sus tipos; conserva colección, IVs, sobres y desbloqueos previos de rutas/equipos. Los desafíos antiguos de gimnasio regresan al campamento; las rutas activas continúan. No borra Pokémon exclusivos obtenidos antes de esta actualización.

Las rutas conservan 20% de sobre, EXP Gen1 (`floor(EXP base * nivel / 7)`), reparto 50% al activo y 50% entre reservas vivas, crecimiento n³. Rutas por PWB y desbloqueos de especies por victorias. Los sobres con una etapa evolutiva superior evolucionan al compañero sin requisito de nivel. Cadenas sin ramas evolucionan automáticamente por nivel; ramificaciones elegibles desde Pokédex. Condiciones especiales adaptadas a nivel 25/40 cuando no hay nivel original en PokéAPI.

## Validación

`node --test preliminary/*.test.mjs` desde la raíz. Incluye 54 combinaciones de gimnasio/categoría, equivalencia online/offline, ausencia de EXP de gimnasio, recompensas por tipo, exclusividad, garantía, apertura múltiple, migración, límites de velocidad y pruebas de interfaz con DOM simulado. La validación visual en navegador no está incluida. Los sprites requieren conexión a GitHub/PokéAPI.

Estados y cambios de estadísticas visibles encima del nombre de cada combatiente, dentro de la escena. Indicadores verdes/naranjas con etapas, estados principales y efectos temporales, clima, sustituto y contadores por acción. Reservas visibles en el desplegable. La vista lee al combatiente actual, por lo que curación, reinicio y relevo eliminan los indicadores correspondientes sin reproducir el log.
