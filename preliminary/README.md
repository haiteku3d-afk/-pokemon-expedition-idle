# Pokémon Expedition · v0.13

Juego de navegador con 1025 especies, IVs automáticos, duelos 1 contra 1, movimientos, evoluciones, 18 gimnasios por tipo y expediciones offline hasta la derrota.

## Cuenta y guardado

Login con ChatGPT, con la misma cuenta en PC y celular. Cada cuenta empieza una partida nueva; no se cargan partidas locales anteriores. El servidor de `../cloud` usa D1 para guardar progreso por usuario.

Se guarda al elegir inicial, iniciar/retirar/repetir expediciones, abrir sobres, formar/ordenar equipos, equipar ataques y elegir evoluciones. Las incursiones activas sincronizan cada cinco minutos y al regresar a la pestaña. El servidor calcula el tiempo transcurrido desde sus propios registros, aunque el navegador se cierre. Se requiere conexión para ejecutar acciones. Cuenta → Sincronizar permite recuperar conexión y actualizar otro dispositivo.

Laboratorio, colección de prueba, simulación, reinicio e importación eliminados. El cliente manda acciones, nunca una partida: el servidor valida y calcula recompensas. Comparación atómica de revisiones evita sobrescribir otra sesión; identificadores idempotentes evitan duplicar aperturas al reintentar una solicitud.

## Combate y colección

EXP de primera generación y crecimiento n³; 50% al activo y 50% entre reservas vivas. PWB = estadísticas base; PWT = base + IVs. Evolución inmediata si el sobre trae una etapa superior; cadenas sin ramas por nivel, ramas elegibles en Pokédex. Ataques en orden 1–4; categorías físicas/especiales, estados y modificadores de estadísticas visibles sobre los nombres. Shiny: aura de +5% por familia.

Drenadoras absorbe los PS realmente quitados (hasta 1/8 de PS máximos del rival); Acua Aro y Arraigo regeneran 1/16 por acción sin acumular al repetir. Curaciones verdes separadas de los golpes, respetando PS máximos, bloqueo de curación y debilitados. Carga adicional para movimientos de curación.

Gimnasios: 18 medallas, Bronce/Plata/Oro, sobres por tipo, una especie exclusiva y garantía tras 20 sobres sin exclusivo. Equipos: 0, 2, 5, 9, 13, 18 medallas. Rutas: 20% de sobre y especies progresivas por victorias. Velocidad relativa a la zona, entre 15 y 3 segundos por encuentro. Reglas detalladas dentro de la Wiki.

## Validación

`node --test preliminary/*.test.mjs`. Pruebas de motor, 54 combinaciones de gimnasio/categoría, curación, evoluciones, cuentas aisladas, idempotencia, conflictos entre dispositivos y la interfaz con API y SQLite simulados. Build Vinext verificado en `cloud/`. Autenticación real en móvil y revisión visual pendientes de comprobar con una sesión de usuario.

### v0.13.1 — guardado sin pausas de preparación

Equipo, orden y movimientos se actualizan al instante y agrupan sus comandos tras 2 segundos sin cambios. Iniciar una expedición envía también la preparación pendiente en una sola operación atómica. El servidor valida los movimientos aprendidos, disponibilidad y equipos; no acepta partidas del cliente. Abrir sobres y demás acciones con recompensas siguen siendo autoritativas. Navegación y animación continúan durante el guardado.

Se consulta el resultado al caer un equipo, al regresar a la pestaña y cada 5 minutos si hay expediciones activas. Al ocultar la pestaña se intenta vaciar la preparación pendiente; solo el indicador «Guardado en tu cuenta» confirma su persistencia. Cerrar bruscamente antes de completar el envío puede perder los últimos cambios de preparación. Las expediciones ya confirmadas siguen calculándose offline.

Reintentos usan el mismo identificador y contenido, incluso tras una respuesta perdida. Ante conflicto con otro dispositivo se carga su estado y se descarta la preparación pendiente, con aviso, para no aplicar selecciones antiguas. Las recompensas siguen siendo automáticas, sin botón de reclamar.

### v0.13.2 — navegación durante expediciones

Los ticks de combate conservan los botones del menú para no interrumpir los toques. Una confirmación tardía de inicio respeta la pantalla elegida mientras esperaba el servidor.

### v0.13.3 — controles estables en móvil

El reloj de combate actualiza solamente el contenedor de equipos, sin reconstruir la pantalla ni el menú. Se pausan las actualizaciones visuales durante un toque. La navegación queda en una capa independiente con espacio para el indicador de inicio de iPhone. Los enlaces a JS y CSS llevan la versión real para evitar reutilizar la edición anterior.

### v0.14 — Segunda oportunidad y misiones diarias

Tres recuperaciones permanentes, con probabilidades de 10% a 100% en pasos de 10. Requieren 3/9/18 medallas y completar la anterior al 100%. Coste por compra: 200 × 3^índice × siguiente nivel (1–10); totales 11.000 / 33.000 / 99.000 monedas. Cada equipo puede desactivarlas antes de salir. La partida fija probabilidades al iniciar; cada derrota intenta el siguiente revivir una vez, y si falla termina. Cada éxito recupera al equipo completo sin reducir la dificultad ni reiniciar el gimnasio. Los sorteos offline usan el mismo RNG y orden de eventos que el juego abierto.

Tres misiones por día Chile (America/Santiago): 20 victorias de ruta; 3 sobres encontrados; un líder derrotado, o 30 victorias si empieza el día sin medallas. Recompensas de un sobre por misión, más un bonus de ruta a elección al reclamar las tres. Los objetivos usan los horarios de cada combate offline, las recompensas no reclamadas expiran al renovar y abrir/cobrar sobres no incrementa el objetivo de sobres encontrados. Validación, compra y cobro son autoritativos e idempotentes.

Cada equipo ofrece un resumen del recorrido actual o el último retirado/repetido: duración, victorias, EXP realmente aplicada, monedas, sobres y recuperaciones. Las recompensas de combate permanecen automáticas. Partidas existentes conservan su progreso; las mejoras se aplican a nuevos recorridos.
