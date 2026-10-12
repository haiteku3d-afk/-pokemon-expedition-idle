# Pokémon Expedition · servidor de cuentas

Vinext + Cloudflare D1. Usa la misma identidad de ChatGPT en PC y celular. El acceso lo gestiona Sites; no se guardan contraseñas en el juego.

Ejecutar la instalación y construcción con los helpers de Sites. `scripts/prepare-game.mjs` copia el catálogo y el cliente desde `../preliminary`; en el checkout hospedado usa `game-source`. `npm run db:generate` genera nuevas migraciones; no modificar las aplicadas.

Las acciones requieren identidad, encabezado de cliente, número de revisión y un identificador de operación. El servidor valida iniciales, equipos, rutas, gimnasios, sobres, movimientos y evoluciones, calcula las expediciones con su propio reloj y guarda con comparación de revisiones. Repetir el mismo identificador no duplica una recompensa. No hay importación de partidas, simulación de tiempo ni concesión de Pokémon de prueba.

El servidor crea una partida vacía por cuenta. Cada acción importante guarda inmediatamente; las incursiones activas sincronizan cada cinco minutos y al volver a la pestaña. Offline: el progreso se calcula desde la última referencia de tiempo hasta la derrota.

Las pruebas de almacenamiento y acciones viven en `../preliminary/cloud.test.mjs` y usan SQLite; las de interfaz usan la misma API con identidad simulada. La autenticación real en dos dispositivos debe comprobarse en la publicación.
