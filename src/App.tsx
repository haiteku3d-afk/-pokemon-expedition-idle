import { useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { missions, packs, pokemon, zones, type Zone } from './gameData';
import {
  firebaseConfigured,
  getFirebaseAuth,
  loginWithGoogle,
  saveCloudGame,
  watchCloudGame,
  type CloudGameState,
} from './firebase';

type View = 'home' | 'map' | 'packs' | 'pokedex' | 'more';

const icons: Record<View, string> = {
  home: '⌂',
  map: '⌖',
  packs: '◇',
  pokedex: '▣',
  more: '•••',
};

function App() {
  const [view, setView] = useState<View>('home');
  const [selectedZone, setSelectedZone] = useState<Zone>(zones[0]);
  const [coins, setCoins] = useState(630);
  const [stones] = useState(2);
  const [starterId, setStarterId] = useState(7);
  const [cards, setCards] = useState<CloudGameState['cards']>({ '7': { copies: 1, level: 8 } });
  const [openingPack, setOpeningPack] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [cloudStatus, setCloudStatus] = useState<'prototype' | 'loading' | 'saved' | 'error'>('prototype');
  const cloudReady = useRef(false);
  const production = zones.filter((zone) => zone.status !== 'locked').reduce((sum, zone) => sum + zone.production, 0);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) return;
    setCloudStatus('loading');
    let stopCloudWatch: () => void = () => {};
    const stopAuthWatch = onAuthStateChanged(auth, (nextUser) => {
      stopCloudWatch();
      setUser(nextUser);
      cloudReady.current = false;
      if (!nextUser) {
        setCloudStatus('prototype');
        return;
      }
      setCloudStatus('loading');
      stopCloudWatch = watchCloudGame(nextUser, (remote) => {
        if (remote) {
          setCoins(remote.coins);
          setStarterId(remote.starterId);
          setCards(remote.cards ?? {});
        }
        cloudReady.current = true;
        setCloudStatus('saved');
      });
    });
    return () => {
      stopCloudWatch();
      stopAuthWatch();
    };
  }, []);

  useEffect(() => {
    if (!user || !cloudReady.current) return;
    setCloudStatus('loading');
    const timer = window.setTimeout(() => {
      saveCloudGame(user, { coins, stones, starterId, cards })
        .then(() => setCloudStatus('saved'))
        .catch(() => setCloudStatus('error'));
    }, 650);
    return () => window.clearTimeout(timer);
  }, [cards, coins, starterId, stones, user]);

  const openGoogleLogin = () => {
    if (!firebaseConfigured) return;
    loginWithGoogle().catch(() => setCloudStatus('error'));
  };

  const acceptPack = () => {
    const pulled = pokemon.slice(0, 5);
    setCards((current) => {
      const next = { ...current };
      pulled.forEach((entry) => {
        const old = next[String(entry.id)] ?? { copies: 0, level: 1 };
        const copies = old.copies + 1;
        next[String(entry.id)] = { copies, level: Math.max(old.level, 1 + Math.floor(copies / 3)) };
      });
      return next;
    });
    setOpeningPack(null);
  };

  const content = useMemo(() => {
    if (view === 'map') return <MapView selected={selectedZone} onSelect={setSelectedZone} />;
    if (view === 'packs') return <PacksView coins={coins} onOpen={(packId, price) => {
      if (coins < price) return;
      setCoins((value) => value - price);
      setOpeningPack(packId);
    }} />;
    if (view === 'pokedex') return <PokedexView cards={cards} />;
    if (view === 'more') return <MoreView starterId={starterId} onStarterChange={setStarterId} cloudEnabled={firebaseConfigured} />;
    return <HomeView production={production} onNavigate={setView} starterId={starterId} />;
  }, [view, selectedZone, coins, production, cards, starterId]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-mark" aria-hidden="true">PK</div>
        <div className="brand-copy">
          <strong>Expedition Idle</strong>
          <span>PROYECTO PERSONAL</span>
        </div>
        <button className={`cloud-state ${cloudStatus}`} onClick={openGoogleLogin} title={firebaseConfigured ? 'Cuenta de Google' : 'Añade las variables de Firebase para activar el guardado'}>
          <span className="cloud-dot" />
          {cloudStatus === 'saved' ? 'Guardado' : cloudStatus === 'loading' ? 'Guardando…' : cloudStatus === 'error' ? 'Error de nube' : firebaseConfigured ? 'Entrar con Google' : 'Prototipo local'}
        </button>
        <div className="wallet"><span>◉ {coins.toLocaleString('es-CL')}</span><span>◆ 2</span></div>
        <button className="avatar" aria-label="Perfil de entrenador">C</button>
      </header>

      <main>{content}</main>

      <nav className="bottom-nav" aria-label="Navegación principal">
        {(['home', 'map', 'packs', 'pokedex', 'more'] as View[]).map((item) => (
          <button key={item} className={view === item ? 'active' : ''} onClick={() => setView(item)}>
            <span aria-hidden="true">{icons[item]}</span>
            {item === 'home' ? 'Inicio' : item === 'map' ? 'Mapa' : item === 'packs' ? 'Sobres' : item === 'pokedex' ? 'Pokédex' : 'Más'}
          </button>
        ))}
      </nav>

      {openingPack && <PackOpening packId={openingPack} onClose={() => setOpeningPack(null)} onAccept={acceptPack} cloudSaved={Boolean(user)} />}
    </div>
  );
}

function HomeView({ production, onNavigate, starterId }: { production: number; onNavigate: (view: View) => void; starterId: number }) {
  const starter = pokemon.find((entry) => entry.id === starterId) ?? pokemon[0];
  return (
    <div className="page home-page">
      <section className="hero-card">
        <div className="hero-landscape" aria-hidden="true">
          <span className="sun" />
          <span className="hill hill-back" />
          <span className="hill hill-front" />
          <span className="partner-orb" style={{ '--poke': starter.color } as React.CSSProperties}>{starter.name[0]}</span>
        </div>
        <div className="hero-content">
          <div className="eyebrow-row"><span className="eyebrow">AVENTURA DE KANTO</span><span>Compañero: {starter.name}</span></div>
          <h1>Bosque Verde te espera</h1>
          <p>Encuentra al Pokémon perdido para mejorar el dominio de la zona.</p>
          <div className="mission-progress"><span style={{ width: '42%' }} /></div>
          <div className="hero-actions">
            <button className="primary" onClick={() => onNavigate('map')}>Continuar aventura</button>
            <button className="secondary" onClick={() => onNavigate('packs')}>Abrir sobres</button>
          </div>
        </div>
      </section>

      <section className="dashboard-grid">
        <article className="next-mission panel panel-wide">
          <div className="section-heading"><div><span className="kicker">PRÓXIMA MISIÓN</span><h2>Encontrar al Pokémon perdido</h2></div><span className="mission-icon">⌖</span></div>
          <div className="mission-meta"><span>◷ 3 min</span><span>⚡ Poder 20</span><span>▰ Sobre básico</span></div>
          <button className="primary compact">Preparar equipo</button>
        </article>

        <article className="stat-panel panel">
          <span className="kicker">PRODUCCIÓN DE RUTAS</span>
          <strong className="big-number">+{production}<small>/min</small></strong>
          <div className="stat-detail"><span>Bosque Verde</span><span>+5/min</span></div>
        </article>

        <article className="stat-panel panel">
          <span className="kicker">PODER DE CUENTA</span>
          <strong className="big-number">176</strong>
          <div className="party-row">
            {pokemon.slice(0, 6).map((entry) => <span key={entry.id} title={`${entry.name}: ${entry.power}`} style={{ '--poke': entry.color } as React.CSSProperties}>{entry.name[0]}</span>)}
          </div>
        </article>

        <article className="badges-panel panel panel-wide">
          <div className="section-heading"><div><span className="kicker">MEDALLAS DE KANTO</span><h2>0 de 8</h2></div><span className="next-label">Próxima: Roca</span></div>
          <div className="badge-row">{['R', 'A', 'T', 'P', 'V', 'Ψ', 'F', 'T'].map((badge, index) => <span className={index === 0 ? 'next' : ''} key={`${badge}-${index}`}>{badge}</span>)}</div>
        </article>
      </section>
    </div>
  );
}

function MapView({ selected, onSelect }: { selected: Zone; onSelect: (zone: Zone) => void }) {
  return (
    <div className="page map-page">
      <div className="page-title"><div><span className="kicker">REGIÓN DE KANTO</span><h1>El camino del entrenador</h1><p>Domina zonas, derrota gimnasios y alcanza la Liga.</p></div><div className="map-legend"><span><i className="legend-current" />Actual</span><span><i className="legend-locked" />Bloqueada</span></div></div>
      <section className="map-layout">
        <div className="kanto-map" aria-label="Mapa interactivo de Kanto">
          <svg className="map-art" viewBox="0 0 100 100" aria-hidden="true">
            <defs><linearGradient id="land" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#2e805d"/><stop offset="1" stopColor="#183f3e"/></linearGradient></defs>
            <path className="island-shadow" d="M10 82 Q9 65 20 55 Q19 38 32 27 Q48 18 61 27 Q79 22 91 40 Q94 58 83 75 Q65 88 45 84 Q25 93 10 82Z" />
            <path className="island" d="M10 79 Q11 64 22 55 Q20 40 34 29 Q48 20 61 30 Q78 24 89 41 Q91 57 80 73 Q64 84 46 80 Q27 89 10 79Z" fill="url(#land)" />
            <path className="route-line" d="M18 78 C24 72 29 67 37 61 S52 69 59 78 S57 58 57 47 S48 32 45 25 S60 29 69 32 S77 43 84 53 S83 68 79 77" />
            <path className="route-line final-route" d="M18 78 C16 60 20 48 24 38" />
            <path className="river" d="M33 29 C42 37 32 49 43 58 S62 67 67 77" />
          </svg>
          {zones.map((zone, index) => (
            <button
              key={zone.id}
              className={`zone-node ${zone.status} ${selected.id === zone.id ? 'selected' : ''}`}
              style={{ left: `${zone.x}%`, top: `${zone.y}%` }}
              onClick={() => onSelect(zone)}
              aria-label={`${zone.name}, ${zone.status === 'locked' ? 'bloqueada' : 'en progreso'}`}
            >
              <span>{zone.status === 'locked' ? '×' : index + 1}</span>
              <small>{zone.shortName}</small>
            </button>
          ))}
        </div>

        <aside className="zone-sheet panel">
          <div className="zone-visual"><span>{selected.type}</span></div>
          <span className="kicker">ETAPA {zones.findIndex((zone) => zone.id === selected.id) + 1}</span>
          <h2>{selected.name}</h2>
          <p>{selected.subtitle}</p>
          <div className="domain-line"><span>Dominio</span><strong>{selected.progress}%</strong></div>
          <div className="mission-progress"><span style={{ width: `${selected.progress}%` }} /></div>
          <dl className="zone-stats"><div><dt>Producción</dt><dd>+{selected.production}/min</dd></div><div><dt>Poder requerido</dt><dd>{selected.requiredPower}</dd></div><div><dt>Destino</dt><dd>{selected.gym}</dd></div></dl>
          <button className="primary" disabled={selected.status === 'locked'}>{selected.status === 'locked' ? 'Zona bloqueada' : 'Entrar a la zona'}</button>
          {selected.status === 'locked' && <small className="requirement">Requiere la medalla anterior y {selected.requiredPower} de poder.</small>}
        </aside>
      </section>

      <section className="mission-list">
        <div className="section-heading"><div><span className="kicker">BOSQUE VERDE</span><h2>Camino de misiones</h2></div><span>1 / 4 completadas</span></div>
        {missions.map((mission, index) => <article className={`mission-row ${mission.state}`} key={mission.id}><span className="mission-step">{mission.state === 'completed' ? '✓' : index + 1}</span><div><span className="kicker">{mission.kind}</span><h3>{mission.title}</h3><p>{mission.duration} · Poder {mission.power}</p></div><strong>{mission.reward}</strong><button disabled={mission.state === 'locked'}>{mission.state === 'completed' ? 'Completada' : mission.state === 'locked' ? 'Bloqueada' : 'Preparar'}</button></article>)}
      </section>
    </div>
  );
}

function PacksView({ coins, onOpen }: { coins: number; onOpen: (id: string, price: number) => void }) {
  return <div className="page"><div className="page-title"><div><span className="kicker">CENTRO DE SUMINISTROS</span><h1>Sobres de expedición</h1><p>Cinco cartas por sobre. Consulta siempre las probabilidades.</p></div></div><div className="pack-grid">{packs.map((pack) => <article className="pack-card panel" key={pack.id}><div className={`pack-art ${pack.className}`}><span className="pack-shine"/><span className="pack-top">{pack.eyebrow}</span><span className="pack-emblem"><i /></span><strong>{pack.name.replace('Sobre ', '')}</strong><small>5 CARTAS</small></div><div className="pack-info"><span className="kicker">{pack.eyebrow}</span><h2>{pack.name}</h2><p>{pack.description}</p><div className="guarantee">◆ {pack.guarantee}</div><div className="pack-actions"><button className="odds">Ver probabilidades</button><button className="primary" disabled={coins < pack.price} onClick={() => onOpen(pack.id, pack.price)}>◉ {pack.price}</button></div></div></article>)}</div></div>;
}

function PackOpening({ packId, onClose, onAccept, cloudSaved }: { packId: string; onClose: () => void; onAccept: () => void; cloudSaved: boolean }) {
  const pack = packs.find((item) => item.id === packId)!;
  return <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={`Apertura de ${pack.name}`}><div className="opening-modal"><button className="modal-close" onClick={onClose} aria-label="Cerrar">×</button><span className="kicker">{cloudSaved ? 'LISTO PARA GUARDAR EN LA NUBE' : 'RESULTADO DEL PROTOTIPO'}</span><h2>{pack.name}</h2><div className={`pack-art opening-pack ${pack.className}`}><span className="pack-shine"/><span className="pack-emblem"><i /></span><strong>{pack.name.replace('Sobre ', '')}</strong></div><div className="revealed-cards">{pokemon.slice(0,5).map((entry, index) => <div className={`mini-card rarity-${index}`} key={entry.id}><span style={{ '--poke': entry.color } as React.CSSProperties}>{entry.name[0]}</span><strong>{entry.name}</strong><small>{index === 4 ? 'RARA' : index === 0 ? 'NUEVA' : '+1 COPIA'}</small></div>)}</div><button className="primary" onClick={onAccept}>Añadir a la colección</button></div></div>;
}

function PokedexView({ cards }: { cards: CloudGameState['cards'] }) {
  const found = Object.keys(cards).length;
  return <div className="page"><div className="page-title"><div><span className="kicker">COLECCIÓN</span><h1>Pokédex de Kanto</h1><p>{found} especies encontradas de {pokemon.length} disponibles en el prototipo.</p></div><input className="search" placeholder="Buscar Pokémon" /></div><div className="pokedex-grid">{pokemon.map((entry) => { const owned = cards[String(entry.id)]; return <article className={`pokemon-card panel ${owned ? '' : 'unowned'}`} key={entry.id}><span className="pokemon-orb" style={{ '--poke': entry.color } as React.CSSProperties}>{owned ? entry.name[0] : '?'}</span><div><span className="kicker">N.º {String(entry.id).padStart(3, '0')} · {entry.rarity}</span><h3>{owned ? entry.name : 'No descubierto'}</h3><p>{owned ? `${entry.type} · Nivel ${owned.level} · ${owned.copies} copias` : 'Encuéntralo en sobres o expediciones'}</p></div><strong>{owned ? `⚡ ${entry.power + owned.level * 2}` : '—'}</strong></article>; })}</div></div>;
}

function MoreView({ starterId, onStarterChange, cloudEnabled }: { starterId: number; onStarterChange: (id: number) => void; cloudEnabled: boolean }) {
  const starters = pokemon.filter((entry) => [1, 4, 7].includes(entry.id));
  return <div className="page"><div className="page-title"><div><span className="kicker">CAMPAMENTO</span><h1>Más opciones</h1><p>Investigación, estadísticas y configuración del entrenador.</p></div></div><section className="starter-panel panel"><span className="kicker">COMPAÑERO INICIAL</span><h2>Elige quién aparece en tu campamento</h2><div className="starter-grid">{starters.map((entry) => <button className={starterId === entry.id ? 'selected' : ''} onClick={() => onStarterChange(entry.id)} key={entry.id}><span style={{ '--poke': entry.color } as React.CSSProperties}>{entry.name[0]}</span><strong>{entry.name}</strong></button>)}</div></section><div className="settings-grid">{['Investigación', 'Misiones permanentes', 'Estadísticas', 'Cuenta y guardado'].map((title, index) => <button className="settings-card panel" key={title}><span>{['⌬','✓','↗','☁'][index]}</span><div><strong>{title}</strong><small>{index === 0 ? 'Mejora expediciones y equipos' : index === 3 ? cloudEnabled ? 'Google y Firestore listos para configurar' : 'Requiere las variables de Firebase' : 'Ver progreso'}</small></div><b>›</b></button>)}</div></div>;
}

export default App;
