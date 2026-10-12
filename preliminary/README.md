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
