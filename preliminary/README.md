# Expedition Idle — preliminar 0.7

Juego personal independiente del prototipo original. Servir esta carpeta con un servidor estático. Guardado local/exportación/importación; no sincroniza con Firebase. Mantiene la partida anterior y retira expediciones antiguas al adoptar cambios del motor.

## Colección y progreso

- 1025 especies, 540 familias, nueve generaciones. Una forma predeterminada por especie; sin megas ni formas alternativas regionales.
- Inicial entre los 27 iniciales. PWB = estadísticas base; PWT = PWB + IVs.
- Once rutas por PWB, desde nivel 3 ±1, subiendo ocho niveles por ruta. Cinco especies iniciales y cinco desbloqueos más cada diez victorias de la ruta. Los sobres y enemigos solo contienen especies desbloqueadas.
- Sobres con 20% por victoria, tres encuentros por sobre. Abrir 1/10/50/todos (hasta 1000).
- Una familia por colección; duplicados generan 1/3/6 puntos por etapa. IV automático al atributo más bajo, coste 1 + mejoras gastadas, máximo 31 por atributo.
- Shiny 1/512: primera captura desbloquea aura permanente +5% al daño familiar.
- Hasta seis equipos de seis familias, espacios con 0/2/4/5/7/8 medallas. Gimnasios aún por umbral de poder. Nadie puede estar en dos equipos.
- Formar equipo: ordenar por PWT, nivel, velocidad o nombre; buscar y filtrar tipo. Flechas determinan orden del relevo.

## Movimientos y carga

- 937 movimientos en el catálogo y aprendizajes por nivel para todas las especies. Se usa el grupo de versión más reciente disponible por especie en PokéAPI. Aprendizajes previos se conservan al evolucionar.
- Cuatro movimientos equipados como máximo. Recomendación automática por poder, afinidad y cobertura de tipos; puede actualizarse al aprender. Selección manual evita cambios automáticos de espacios.
- Físico usa Ataque / Defensa; especial usa At. Especial / Def. Especial. Los movimientos de apoyo se adaptan a potencia 10 y una categoría física o especial, conservando metadatos de estados, cambios de atributos, curación y otros efectos.
- Recorrido = 15000 / (1 + max(0,velocidad_media_viva − 5)/50) ms, mínimo 3000 ms. Máximo 15 segundos.
- Carga de movimiento = max(700, (1800 + potencia×30 + 1000 si cura) / (1 + velocidad_individual_efectiva/50)) ms.
- El aliado activo y el único rival cargan por separado. Se simula cada acción cronológicamente online y offline, incluyendo los equipos concurrentes. Al debilitarse el aliado, entra el siguiente; el rival mantiene PS y su carga en curso.
- Tipos oficiales combinados, inmunidades adaptadas a daño mínimo ×0,1. STAB ×1,5. Precisión, crítico adaptado, golpes múltiples, absorción y retroceso.
- Estados: parálisis, sueño, congelación, quemadura, veneno/tóxico, confusión, enamoramiento, atrapamiento, pesadilla, tormento, anulación, bostezo, bloqueo de cura, drenadoras y canto mortal adaptados. Atributos −6 a +6, precisión/evasión, curación, sustituto, protección, barreras, climas y niebla.
- Daño residual se aplica después de la acción afectada. Buffs y efectos volátiles se reinician al siguiente encuentro, mientras estados principales persisten. Algunos efectos especiales únicos se simplifican; no es una reproducción exacta de todos los movimientos oficiales. Movimiento de potencia variable sin valor numérico usa potencia 50.
- Para impedir bloqueos infinitos por curación/protección, a los 120 s de duelo el aliado activo cae por agotamiento y se releva. No hay PP ni objetos de combate en esta versión.
- Pasillo pixel art individual, sprites aliados orientados hacia el avance, PS, EXP azul y carga amarilla. Registro breve del más reciente al más antiguo. EXP aparece en un solo resumen por victoria.

## Experiencia

Referencia: https://www.pokexperto.net/index2.php?seccion=mecanica/experience

EXP por rival salvaje = floor(EXP_base×nivel/7). Principal superviviente recibe el 50%; otro 50% dividido entre reservas vivas, redondeando hacia abajo. Solo un superviviente: 100%. Debilitados no reciben EXP; nivel 100 consume su porción sin acumular más.

Crecimiento normal para todos: acumulada = nivel³, máximo 100 / 1.000.000 EXP. Nivel 5: 125; nivel 6: 216. Al subir, las estadísticas y aprendizajes se actualizan durante la expedición. Los PS aumentan en la diferencia de PS máximos, conservando heridas; no reviven debilitados.

Kanto: valores de EXP base de Rojo/Azul extraídos de https://github.com/pret/pokered/tree/master/data/pokemon/base_stats. Especies posteriores: base_experience de PokéAPI con la misma fórmula Gen1.

## Laboratorio y comprobaciones

Simulación de ocho horas, colección de prueba, exportación/importación y reinicio con confirmación. Expedición rápida repite último equipo y ruta, con PS recuperados.

Desde la raíz:

- `node preliminary/engine.test.mjs`
- `node preliminary/combat.test.mjs`
- `node preliminary/ui.test.mjs`

Cobertura: catálogo, exclusión de especies bloqueadas, EXP y reparto, tipos, daño físico/especial, estados/atributos, cuatro movimientos, carga y recorrido, duelos y relevos, equivalencia online/offline entre equipos, ordenación UI, equipo manual, aperturas, IVs y migración.

Datos: https://github.com/PokeAPI/pokeapi/tree/master/data/v2/csv. `python preliminary/scripts/build_moves.py` regenera catálogo de movimientos y aprendizajes (descarga CSV faltantes). Sprites de https://github.com/PokeAPI/sprites. Proyecto personal no oficial.
