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

### v0.14.1 — niveles de encuentros y sobres

Rangos de diez niveles con pesos 1/3/8/18/30/22/11/5/1,5/0,5%. Primera ruta: 1–10 con centro 5. Las demás conservan sus centros anteriores (11, 19, …, 83), su catálogo y velocidad exigida. Cada centro usa cuatro niveles inferiores y cinco superiores. Solamente la primera ruta se suaviza: rivales con 20% menos estadísticas durante las primeras diez victorias acumuladas y velocidad exigida conservada en 9. El nivel visible y su recompensa EXP mantienen la fórmula original. Gimnasios conservan su combate y niveles originales.

Cada carta de un sobre sortea nivel según su ruta, o según el nivel base de su categoría de gimnasio. Familias nuevas comienzan con ese nivel y EXP n³. Duplicados de nivel superior elevan el progreso y pueden evolucionar por nivel, conservando IV, shiny y movimientos manuales; los inferiores nunca lo reducen. Evoluciones obtenidas de sobres conservan su evolución directa incluso por debajo del nivel requerido. Un Pokémon en expedición conserva heridas, estados y carga al aumentar por sobre; no se revive si ya estaba debilitado. La apertura muestra el nivel de cada carta y agrupa también por nivel.

### v0.14.2 — resumen ilustrado al terminar

Cada expedición finalizada deja un panel sobre el pasillo con una cabecera pixel art original y confeti de una sola reproducción. Se puede cerrar sin bloquear el menú, persistiendo el cierre en la cuenta, y abrir nuevamente con «Ver resumen». Las tarjetas terminadas no se reconstruyen con cada tick de otros equipos. La animación respeta movimiento reducido.

Se registra por compañero EXP de combate realmente aplicada, niveles inicial/final, evoluciones y nuevos movimientos. Cambios causados por sobres durante el recorrido se identifican por separado y no inflan la EXP de combate. El historial se copia al terminar/retirar/repetir para conservarlo aunque luego cambie la colección. Recorridos anteriores incluyen solo el detalle registrado desde la actualización.

Todas las 1.025 especies pueden aprender nuevos movimientos después del nivel 5. Se conservan sus repertorios originales; 57 especies sin progreso posterior o con repertorios muy pequeños reciben movimientos normales de entrenamiento en 10/20/35/50, adaptados a su mejor atributo ofensivo. Se mantienen el límite de cuatro equipados y la elección manual o automática.

### v0.14.3 — cierre visible

Todas las ventanas tienen el botón de cerrar en una barra superior, con el contenido desplazable por separado. El resumen sobre una expedición incluye también una barra superior que se mantiene visible al desplazarse por sus compañeros.

### v0.14.4 — ruta antes del equipo y recomendación automática

Preparar expedición abre primero la elección de ruta. Al confirmarla se muestra su presencia de tipos, el equipo editable y una recomendación automática. La salida requiere confirmar equipo y ruta; los cambios pendientes se envían junto al inicio. El servidor valida rutas, espacios, miembros y ocupación, y calcula la misma recomendación que el cliente.

El índice individual estima daño sostenido × supervivencia frente a cada especie desbloqueada, usando movimientos equipados, carga, precisión, estadísticas de nivel/IV, STAB, aura, efectividad/resistencia y curación acotada. Se promedia según la frecuencia real actual de encuentro (uniforme por especie desbloqueada), con un pequeño factor de rapidez del recorrido. El ajuste de tipos se muestra comparando contra el mismo cálculo con efectividades neutrales. Los porcentajes de presencia cuentan ambos tipos de especies dobles.

Se eligen los seis mejores índices individuales, sin imponer cuotas de tipos. Un Pokémon superior puede superar a otro más débil con ventaja de tipo. Los asignados a otros equipos se excluyen; se mantiene la edición manual y el orden de relevo. El índice es aproximado y no simula todos los estados ni cambios de atributos; el PWT general conserva su definición anterior.
