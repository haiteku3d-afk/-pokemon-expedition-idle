export type ZoneStatus = 'available' | 'locked' | 'in-progress' | 'dominated' | 'perfect';

export type Zone = {
  id: string;
  shortName: string;
  name: string;
  subtitle: string;
  gym: string;
  badge: string;
  type: string;
  production: number;
  requiredPower: number;
  progress: number;
  status: ZoneStatus;
  x: number;
  y: number;
};

export const zones: Zone[] = [
  { id: 'viridian-forest', shortName: 'Bosque', name: 'Bosque Verde', subtitle: 'Ruta 1 · Ciudad Plateada', gym: 'Gimnasio Roca', badge: 'Roca', type: 'ROCA', production: 5, requiredPower: 0, progress: 42, status: 'in-progress', x: 18, y: 78 },
  { id: 'mt-moon', shortName: 'Monte Moon', name: 'Monte Moon', subtitle: 'Ciudad Celeste', gym: 'Gimnasio Agua', badge: 'Agua', type: 'AGUA', production: 12, requiredPower: 120, progress: 0, status: 'locked', x: 37, y: 61 },
  { id: 'vermilion', shortName: 'Carmín', name: 'Ciudad Carmín', subtitle: 'Rutas del Puerto', gym: 'Gimnasio Eléctrico', badge: 'Trueno', type: 'ELÉCTRICO', production: 25, requiredPower: 250, progress: 0, status: 'locked', x: 59, y: 78 },
  { id: 'celadon', shortName: 'Azulona', name: 'Ciudad Azulona', subtitle: 'Túnel Roca', gym: 'Gimnasio Planta', badge: 'Arcoíris', type: 'PLANTA', production: 45, requiredPower: 450, progress: 0, status: 'locked', x: 57, y: 47 },
  { id: 'fuchsia', shortName: 'Fucsia', name: 'Ciudad Fucsia', subtitle: 'Zona Safari', gym: 'Gimnasio Veneno', badge: 'Alma', type: 'VENENO', production: 75, requiredPower: 700, progress: 0, status: 'locked', x: 45, y: 25 },
  { id: 'saffron', shortName: 'Azafrán', name: 'Ciudad Azafrán', subtitle: 'Pueblo Lavanda', gym: 'Gimnasio Psíquico', badge: 'Pantano', type: 'PSÍQUICO', production: 120, requiredPower: 1000, progress: 0, status: 'locked', x: 69, y: 32 },
  { id: 'cinnabar', shortName: 'Canela', name: 'Isla Canela', subtitle: 'Islas Espuma', gym: 'Gimnasio Fuego', badge: 'Volcán', type: 'FUEGO', production: 190, requiredPower: 1400, progress: 0, status: 'locked', x: 84, y: 53 },
  { id: 'viridian-city', shortName: 'Verde', name: 'Ciudad Verde', subtitle: 'Regreso del entrenador', gym: 'Gimnasio Tierra', badge: 'Tierra', type: 'TIERRA', production: 300, requiredPower: 1900, progress: 0, status: 'locked', x: 79, y: 77 },
  { id: 'league', shortName: 'Liga', name: 'Liga Pokémon', subtitle: 'Calle Victoria', gym: 'Alto Mando', badge: 'Campeón', type: 'FINAL', production: 0, requiredPower: 2500, progress: 0, status: 'locked', x: 24, y: 38 },
];

export const missions = [
  { id: 1, title: 'Explorar la Ruta 1', kind: 'EXPLORACIÓN', duration: '1 min', power: 10, reward: '50 monedas', state: 'completed' },
  { id: 2, title: 'Encontrar al Pokémon perdido', kind: 'CAPTURA', duration: '3 min', power: 20, reward: 'Sobre básico', state: 'available' },
  { id: 3, title: 'Entrenadores del bosque', kind: 'COMBATE', duration: '5 min', power: 35, reward: '200 monedas + piedra', state: 'locked' },
  { id: 4, title: 'Llegar a Ciudad Plateada', kind: 'HISTORIA', duration: '10 min', power: 50, reward: 'Acceso al gimnasio', state: 'locked' },
];

export const pokemon = [
  { id: 7, name: 'Squirtle', type: 'Agua', level: 8, power: 42, rarity: 'Poco común', color: '#38bdf8', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/7.png' },
  { id: 25, name: 'Pikachu', type: 'Eléctrico', level: 6, power: 34, rarity: 'Poco común', color: '#facc15', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png' },
  { id: 1, name: 'Bulbasaur', type: 'Planta', level: 5, power: 29, rarity: 'Poco común', color: '#4ade80', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png' },
  { id: 4, name: 'Charmander', type: 'Fuego', level: 4, power: 27, rarity: 'Poco común', color: '#fb923c', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/4.png' },
  { id: 133, name: 'Eevee', type: 'Normal', level: 5, power: 24, rarity: 'Poco común', color: '#d6a56f', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/133.png' },
  { id: 16, name: 'Pidgey', type: 'Volador', level: 3, power: 20, rarity: 'Común', color: '#cbd5e1', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/16.png' },
  { id: 10, name: 'Caterpie', type: 'Bicho', level: 2, power: 14, rarity: 'Común', color: '#86efac', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10.png' },
  { id: 129, name: 'Magikarp', type: 'Agua', level: 1, power: 10, rarity: 'Común', color: '#f87171', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/129.png' },
];

export const packs = [
  { id: 'basic', name: 'Sobre Básico', eyebrow: 'EXPEDICIÓN', price: 100, className: 'pack-basic', featuredPokemonId: 1, guarantee: '60% carta común', description: 'El comienzo de toda aventura.' },
  { id: 'advanced', name: 'Sobre Avanzado', eyebrow: 'DESCUBRIMIENTO', price: 500, className: 'pack-advanced', featuredPokemonId: 25, guarantee: '1 rara o superior', description: 'Encuentros para equipos en crecimiento.' },
  { id: 'elite', name: 'Sobre Élite', eyebrow: 'LEGENDARIO', price: 1500, className: 'pack-elite', featuredPokemonId: 133, guarantee: '1 épica o superior', description: 'Las cartas más difíciles de encontrar.' },
];
