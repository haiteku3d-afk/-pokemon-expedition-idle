import { useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { missions, packs, pokemon, zones, type Mission, type Zone } from './gameData';
import {
  claimMission,
  createInitialGameState,
  formatCountdown,
  formatDuration,
  getAccountPower,
  getMissionState,
  getOfflineEarnings,
  getProduction,
  getTeamPower,
  startMission,
  type GameState,
  type MissionState,
} from './gameEngine';
import {
  firebaseConfigured,
  getFirebaseAuth,
  loadCloudGame,
  loginWithGoogle,
  logoutFromGoogle,
  saveCloudGame,
} from './firebase';

type View = 'home' | 'map' | 'packs' | 'pokedex' | 'more';
type CloudStatus = 'prototype' | 'loading' | 'saved' | 'error' | 'conflict';

const icons: Record<View, string> = { home: '⌂', map: '⌖', packs: '◇', pokedex: '▣', more: '•••' };

function App() {
  const [view, setView] = useState<View>('home');
  const [selectedZone, setSelectedZone] = useState<Zone>(zones[0]);
  const [game, setGame] = useState<GameState>(() => createInitialGameState());
  const [openingPack, setOpeningPack] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [cloudStatus, setCloudStatus] = useState<CloudStatus>('prototype');
  const [cloudReady, setCloudReady] = useState(false);
  const [lastSync, setLastSync] = useState<number | null>(null);
  const [offlineGain, setOfflineGain] = useState(0);
  const [rewardNotice, setRewardNotice] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const revision = useRef(0);
  const coinClock = useRef(Date.now());
  const saveQueue = useRef<Promise<void>>(Promise.resolve());

  const production = useMemo(() => getProduction(game), [game]);
  const accountPower = useMemo(() => getAccountPower(game), [game]);
  const teamPower = useMemo(() => getTeamPower(game), [game]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) return;
    setCloudStatus('loading');
    let cancelled = false;
    const stopAuthWatch = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setCloudReady(false);
      if (!nextUser) {
        setCloudStatus('prototype');
        return;
      }
      setCloudStatus('loading');
      try {
        const remote = await loadCloudGame(nextUser);
        if (cancelled) return;
        if (remote) {
          const earnedOffline = getOfflineEarnings(remote.state);
          setGame({ ...remote.state, coins: remote.state.coins + earnedOffline, lastActiveAt: Date.now() });
          revision.current = remote.revision;
          setLastSync(remote.updatedAtMs);
          setOfflineGain(earnedOffline);
        } else {
          setGame(createInitialGameState());
          revision.current = 0;
          setLastSync(null);
        }
        coinClock.current = Date.now();
        setCloudReady(true);
        setCloudStatus('saved');
      } catch {
        if (!cancelled) setCloudStatus('error');
      }
    });
    return () => {
      cancelled = true;
      stopAuthWatch();
    };
  }, []);

  useEffect(() => {
    if (!user || !cloudReady || production <= 0) return;
    coinClock.current = Date.now();
    const timer = window.setInterval(() => {
      const current = Date.now();
      const earned = Math.floor(((current - coinClock.current) / 60_000) * production);
      if (earned > 0) {
        coinClock.current += (earned / production) * 60_000;
        setGame((state) => ({ ...state, coins: state.coins + earned }));
      }
    }, 1_000);
    return () => window.clearInterval(timer);
  }, [cloudReady, production, user]);

  useEffect(() => {
    if (!user || !cloudReady) return;
    const snapshot = game;
    const timer = window.setTimeout(() => {
      queueCloudSave(snapshot);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [cloudReady, game, user]);

  const queueCloudSave = (snapshot: GameState) => {
    if (!user || !cloudReady) return;
    saveQueue.current = saveQueue.current.then(async () => {
      setCloudStatus('loading');
      try {
        const result = await saveCloudGame(user, snapshot, revision.current);
        revision.current = result.revision;
        setLastSync(result.savedAt);
        setCloudStatus('saved');
      } catch (error) {
        setCloudStatus(error instanceof Error && error.message === 'CLOUD_SAVE_CONFLICT' ? 'conflict' : 'error');
      }
    });
  };

  const openGoogleLogin = () => {
    if (!firebaseConfigured) return;
    if (user) {
      setView('more');
      return;
    }
    loginWithGoogle().catch(() => setCloudStatus('error'));
  };

  const changeStarter = (starterId: number) => setGame((state) => ({
    ...state,
    starterId,
    team: state.cards[String(starterId)] ? [starterId, ...state.team.filter((id) => id !== starterId)].slice(0, 6) : state.team,
  }));

  const beginMission = (missionId: number) => {
    setGame((state) => startMission(state, missionId));
    setRewardNotice(null);
  };

  const collectMission = () => {
    const mission = missions.find((item) => item.id === game.activeMission?.missionId);
    if (!mission) return;
    setGame((state) => claimMission(state));
    setRewardNotice(`Misión completada: ${mission.rewardLabel}`);
  };

  const handleMissionAction = (mission: Mission) => {
    const state = getMissionState(game, mission.id, now);
    if (state === 'ready') collectMission();
    else if (state === 'available') beginMission(mission.id);
  };

  const acceptPack = () => {
    const pack = packs.find((item) => item.id === openingPack);
    if (!pack || game.coins < pack.price) {
      setOpeningPack(null);
      return;
    }
    const pulled = pokemon.slice(0, 5);
    const cards = { ...game.cards };
    pulled.forEach((entry) => {
      const old = cards[String(entry.id)] ?? { copies: 0, level: 1 };
      const copies = old.copies + 1;
      cards[String(entry.id)] = { copies, level: Math.max(old.level, 1 + Math.floor(copies / 3)) };
    });
    const nextGame = { ...game, coins: game.coins - pack.price, cards, lastActiveAt: Date.now() };
    setGame(nextGame);
    queueCloudSave(nextGame);
    setOpeningPack(null);
  };

  const content = useMemo(() => {
    if (view === 'map') return <MapView game={game} now={now} teamPower={teamPower} selected={selectedZone} onSelect={setSelectedZone} onMissionAction={handleMissionAction} />;
    if (view === 'packs') return <PacksView coins={game.coins} onOpen={(packId, price) => {
      if (game.coins < price) return;
      setOpeningPack(packId);
    }} />;
    if (view === 'pokedex') return <PokedexView cards={game.cards} />;
    if (view === 'more') return <MoreView game={game} user={user} cloudStatus={cloudStatus} lastSync={lastSync} onStarterChange={changeStarter} onLogout={() => logoutFromGoogle()} />;
    return <HomeView game={game} now={now} production={production} accountPower={accountPower} teamPower={teamPower} onNavigate={setView} onMissionAction={handleMissionAction} />;
  }, [accountPower, cloudStatus, game, lastSync, now, production, selectedZone, teamPower, user, view]);

  const cloudLabel = cloudStatus === 'saved' ? 'Guardado' : cloudStatus === 'loading' ? 'Guardando…' : cloudStatus === 'conflict' ? 'Conflicto de nube' : cloudStatus === 'error' ? 'Error de nube' : firebaseConfigured ? 'Entrar con Google' : 'Prototipo local';

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-mark" aria-hidden="true">PK</div>
        <div className="brand-copy"><strong>Expedition Idle</strong><span>AVENTURA PERSONAL</span></div>
        <button className={`cloud-state ${cloudStatus}`} onClick={openGoogleLogin} title={user ? 'Ver cuenta y guardado' : 'Entrar con Google'}><span className="cloud-dot" />{cloudLabel}</button>
        <div className="wallet"><span>◉ {game.coins.toLocaleString('es-CL')}</span><span>◆ {game.stones}</span><span>▰ {game.packInventory.basic ?? 0}</span></div>
        <button className="avatar" aria-label="Perfil de entrenador" onClick={() => setView('more')}>{user?.displayName?.[0] ?? 'C'}</button>
      </header>

      {offlineGain > 0 && <button className="offline-reward" onClick={() => setOfflineGain(0)}>+{offlineGain.toLocaleString('es-CL')} monedas mientras estabas fuera <span>×</span></button>}
      {rewardNotice && <button className="reward-toast" onClick={() => setRewardNotice(null)}>{rewardNotice}<span>×</span></button>}

      <main>{content}</main>

      <nav className="bottom-nav" aria-label="Navegación principal">
        {(['home', 'map', 'packs', 'pokedex', 'more'] as View[]).map((item) => <button key={item} className={view === item ? 'active' : ''} onClick={() => setView(item)}><span aria-hidden="true">{icons[item]}</span>{item === 'home' ? 'Inicio' : item === 'map' ? 'Mapa' : item === 'packs' ? 'Sobres' : item === 'pokedex' ? 'Pokédex' : 'Más'}</button>)}
      </nav>

      {openingPack && <PackOpening packId={openingPack} onClose={() => setOpeningPack(null)} onAccept={acceptPack} cloudSaved={Boolean(user)} />}
    </div>
  );
}

function MissionButton({ mission, state, remaining, teamPower, onClick }: { mission: Mission; state: MissionState; remaining: number; teamPower: number; onClick: () => void }) {
  const insufficient = state === 'available' && teamPower < mission.power;
  const label = state === 'completed' ? 'Completada' : state === 'locked' ? 'Bloqueada' : state === 'active' ? `En curso ${formatCountdown(remaining)}` : state === 'ready' ? 'Reclamar' : insufficient ? `Faltan ${mission.power - teamPower} poder` : 'Comenzar';
  return <button className={state === 'ready' ? 'claim-button' : ''} disabled={state === 'completed' || state === 'locked' || state === 'active' || insufficient} onClick={onClick}>{label}</button>;
}

function HomeView({ game, now, production, accountPower, teamPower, onNavigate, onMissionAction }: { game: GameState; now: number; production: number; accountPower: number; teamPower: number; onNavigate: (view: View) => void; onMissionAction: (mission: Mission) => void }) {
  const starter = pokemon.find((entry) => entry.id === game.starterId) ?? pokemon[0];
  const nextMission = game.activeMission ? missions.find((mission) => mission.id === game.activeMission?.missionId) : missions.find((mission) => !game.completedMissionIds.includes(mission.id));
  const nextState = nextMission ? getMissionState(game, nextMission.id, now) : 'completed';
  const remaining = game.activeMission ? game.activeMission.endsAt - now : 0;
  const progress = game.zoneProgress['viridian-forest'] ?? 0;
  return (
    <div className="page home-page">
      <section className="hero-card">
        <div className="hero-landscape" aria-hidden="true"><span className="sun"/><span className="hill hill-back"/><span className="hill hill-front"/><span className="partner-orb" style={{ '--poke': starter.color } as React.CSSProperties}><img src={starter.image} alt={starter.name}/></span></div>
        <div className="hero-content">
          <div className="eyebrow-row"><span className="eyebrow">AVENTURA DE KANTO</span><span>Compañero: {starter.name}</span></div>
          <h1>{progress >= 100 ? 'Ciudad Plateada te espera' : 'Bosque Verde te espera'}</h1>
          <p>{nextMission ? nextMission.title : 'El camino al Gimnasio de Roca está abierto.'}</p>
          <div className="mission-progress"><span style={{ width: `${progress}%` }}/></div>
          <div className="hero-actions"><button className="primary" onClick={() => onNavigate('map')}>Continuar aventura</button><button className="secondary" onClick={() => onNavigate('packs')}>Abrir sobres</button></div>
        </div>
      </section>

      <section className="dashboard-grid">
        <article className="next-mission panel panel-wide">
          <div className="section-heading"><div><span className="kicker">{game.activeMission ? 'EXPEDICIÓN ACTIVA' : 'PRÓXIMA MISIÓN'}</span><h2>{nextMission?.title ?? 'Gimnasio de Roca'}</h2></div><span className="mission-icon">⌖</span></div>
          {nextMission ? <><div className="mission-meta"><span>◷ {formatDuration(nextMission.durationSeconds)}</span><span>⚡ Poder {nextMission.power}</span><span>▰ {nextMission.rewardLabel}</span></div><MissionButton mission={nextMission} state={nextState} remaining={remaining} teamPower={teamPower} onClick={() => onMissionAction(nextMission)}/></> : <button className="primary compact" disabled>Disponible en el siguiente bloque</button>}
        </article>

        <article className="stat-panel panel"><span className="kicker">PRODUCCIÓN DE RUTAS</span><strong className="big-number">+{production}<small>/min</small></strong><div className="stat-detail"><span>Misiones completadas</span><span>{game.completedMissionIds.length}/4</span></div></article>
        <article className="stat-panel panel"><span className="kicker">PODER DE CUENTA</span><strong className="big-number">{accountPower}</strong><div className="party-row">{game.team.map((id) => { const entry = pokemon.find((item) => item.id === id); return entry ? <span key={id} title={`${entry.name}: equipo`} style={{ '--poke': entry.color } as React.CSSProperties}><img src={entry.image} alt=""/></span> : null; })}</div><div className="stat-detail"><span>Poder del equipo</span><span>⚡ {teamPower}</span></div></article>
        <article className="badges-panel panel panel-wide"><div className="section-heading"><div><span className="kicker">MEDALLAS DE KANTO</span><h2>0 de 8</h2></div><span className="next-label">Próxima: Roca</span></div><div className="badge-row">{['R','A','T','P','V','Ψ','F','T'].map((badge,index)=><span className={index===0?'next':''} key={`${badge}-${index}`}>{badge}</span>)}</div></article>
      </section>
    </div>
  );
}

function MapView({ game, now, teamPower, selected, onSelect, onMissionAction }: { game: GameState; now: number; teamPower: number; selected: Zone; onSelect: (zone: Zone) => void; onMissionAction: (mission: Mission) => void }) {
  const selectedProgress = game.zoneProgress[selected.id] ?? 0;
  const selectedProduction = missions.filter((mission) => mission.zoneId === selected.id && game.completedMissionIds.includes(mission.id)).reduce((sum, mission) => sum + mission.production, 0);
  return (
    <div className="page map-page">
      <div className="page-title"><div><span className="kicker">REGIÓN DE KANTO</span><h1>El camino del entrenador</h1><p>Completa expediciones para dominar zonas y aumentar la producción.</p></div><div className="map-legend"><span><i className="legend-current"/>Actual</span><span><i className="legend-locked"/>Bloqueada</span></div></div>
      <section className="map-layout">
        <div className="kanto-map" aria-label="Mapa interactivo de Kanto">
          <svg className="map-art" viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="land" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#2e805d"/><stop offset="1" stopColor="#183f3e"/></linearGradient></defs><path className="island-shadow" d="M10 82 Q9 65 20 55 Q19 38 32 27 Q48 18 61 27 Q79 22 91 40 Q94 58 83 75 Q65 88 45 84 Q25 93 10 82Z"/><path className="island" d="M10 79 Q11 64 22 55 Q20 40 34 29 Q48 20 61 30 Q78 24 89 41 Q91 57 80 73 Q64 84 46 80 Q27 89 10 79Z" fill="url(#land)"/><path className="route-line" d="M18 78 C24 72 29 67 37 61 S52 69 59 78 S57 58 57 47 S48 32 45 25 S60 29 69 32 S77 43 84 53 S83 68 79 77"/><path className="route-line final-route" d="M18 78 C16 60 20 48 24 38"/><path className="river" d="M33 29 C42 37 32 49 43 58 S62 67 67 77"/></svg>
          {zones.map((zone,index) => { const unlocked=game.unlockedZoneIds.includes(zone.id); const progress=game.zoneProgress[zone.id]??0; const status=!unlocked?'locked':progress>=100?'dominated':progress>0?'in-progress':'available'; return <button key={zone.id} className={`zone-node ${status} ${selected.id===zone.id?'selected':''}`} style={{left:`${zone.x}%`,top:`${zone.y}%`}} onClick={()=>onSelect(zone)} aria-label={`${zone.name}, ${status==='locked'?'bloqueada':'disponible'}`}><span>{status==='locked'?'×':index+1}</span><small>{zone.shortName}</small></button>; })}
        </div>
        <aside className="zone-sheet panel"><div className="zone-visual"><span>{selected.type}</span></div><span className="kicker">ETAPA {zones.findIndex((zone)=>zone.id===selected.id)+1}</span><h2>{selected.name}</h2><p>{selected.subtitle}</p><div className="domain-line"><span>Dominio</span><strong>{selectedProgress}%</strong></div><div className="mission-progress"><span style={{width:`${selectedProgress}%`}}/></div><dl className="zone-stats"><div><dt>Producción obtenida</dt><dd>+{selectedProduction}/min</dd></div><div><dt>Poder de equipo</dt><dd>{teamPower}</dd></div><div><dt>Destino</dt><dd>{selected.gym}</dd></div></dl><button className="primary" disabled={!game.unlockedZoneIds.includes(selected.id)}>{game.unlockedZoneIds.includes(selected.id)?'Zona activa':'Zona bloqueada'}</button>{!game.unlockedZoneIds.includes(selected.id)&&<small className="requirement">Requiere completar la zona anterior.</small>}</aside>
      </section>

      <section className="mission-list">
        <div className="section-heading"><div><span className="kicker">BOSQUE VERDE</span><h2>Camino de misiones</h2></div><span>{game.completedMissionIds.length} / {missions.length} completadas</span></div>
        {missions.map((mission,index)=>{ const state=getMissionState(game,mission.id,now); const remaining=game.activeMission?.missionId===mission.id?game.activeMission.endsAt-now:0; return <article className={`mission-row ${state}`} key={mission.id}><span className="mission-step">{state==='completed'?'✓':index+1}</span><div><span className="kicker">{mission.kind}</span><h3>{mission.title}</h3><p>{formatDuration(mission.durationSeconds)} · Poder {mission.power} · +{mission.production}/min</p></div><strong>{mission.rewardLabel}</strong><MissionButton mission={mission} state={state} remaining={remaining} teamPower={teamPower} onClick={()=>onMissionAction(mission)}/></article>; })}
      </section>
    </div>
  );
}

function PacksView({ coins, onOpen }: { coins: number; onOpen: (id: string, price: number) => void }) {
  return <div className="page"><div className="page-title"><div><span className="kicker">CENTRO DE SUMINISTROS</span><h1>Sobres de expedición</h1><p>Cinco cartas por sobre. El sistema aleatorio completo llegará en el bloque 3.</p></div></div><div className="pack-grid">{packs.map((pack)=>{const featured=pokemon.find((entry)=>entry.id===pack.featuredPokemonId)!;return <article className="pack-card panel" key={pack.id}><div className={`pack-art ${pack.className}`}><span className="pack-shine"/><span className="pack-top">{pack.eyebrow}</span><img className="pack-pokemon" src={featured.image} alt=""/><span className="pack-emblem"><i/></span><strong>{pack.name.replace('Sobre ','')}</strong><small>5 CARTAS</small></div><div className="pack-info"><span className="kicker">{pack.eyebrow}</span><h2>{pack.name}</h2><p>{pack.description}</p><div className="guarantee">◆ {pack.guarantee}</div><div className="pack-actions"><button className="odds">Ver probabilidades</button><button className="primary" disabled={coins<pack.price} onClick={()=>onOpen(pack.id,pack.price)}>◉ {pack.price}</button></div></div></article>;})}</div></div>;
}

function PackOpening({ packId, onClose, onAccept, cloudSaved }: { packId: string; onClose: () => void; onAccept: () => void; cloudSaved: boolean }) {
  const pack=packs.find((item)=>item.id===packId)!; const featured=pokemon.find((entry)=>entry.id===pack.featuredPokemonId)!;
  return <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={`Apertura de ${pack.name}`}><div className="opening-modal"><button className="modal-close" onClick={onClose} aria-label="Cerrar">×</button><span className="kicker">{cloudSaved?'LISTO PARA GUARDAR EN LA NUBE':'RESULTADO LOCAL'}</span><h2>{pack.name}</h2><div className={`pack-art opening-pack ${pack.className}`}><span className="pack-shine"/><img className="pack-pokemon" src={featured.image} alt=""/><span className="pack-emblem"><i/></span><strong>{pack.name.replace('Sobre ','')}</strong></div><div className="revealed-cards">{pokemon.slice(0,5).map((entry,index)=><div className={`mini-card rarity-${index}`} key={entry.id}><span style={{'--poke':entry.color} as React.CSSProperties}><img src={entry.image} alt={entry.name}/></span><strong>{entry.name}</strong><small>{index===4?'RARA':index===0?'NUEVA':'+1 COPIA'}</small></div>)}</div><button className="primary" onClick={onAccept}>Añadir a la colección</button></div></div>;
}

function PokedexView({ cards }: { cards: GameState['cards'] }) {
  const found=Object.keys(cards).length;
  return <div className="page"><div className="page-title"><div><span className="kicker">COLECCIÓN</span><h1>Pokédex de Kanto</h1><p>{found} especies encontradas de {pokemon.length} disponibles.</p></div><input className="search" placeholder="Buscar Pokémon"/></div><div className="pokedex-grid">{pokemon.map((entry)=>{const owned=cards[String(entry.id)];return <article className={`pokemon-card panel ${owned?'':'unowned'}`} key={entry.id}><span className="pokemon-orb" style={{'--poke':entry.color} as React.CSSProperties}><img src={entry.image} alt={owned?entry.name:''}/></span><div><span className="kicker">N.º {String(entry.id).padStart(3,'0')} · {entry.rarity}</span><h3>{owned?entry.name:'No descubierto'}</h3><p>{owned?`${entry.type} · Nivel ${owned.level} · ${owned.copies} copias`:'Encuéntralo en sobres o expediciones'}</p></div><strong>{owned?`⚡ ${entry.power+Math.max(0,owned.level-1)*2}`:'—'}</strong></article>;})}</div></div>;
}

function MoreView({ game, user, cloudStatus, lastSync, onStarterChange, onLogout }: { game: GameState; user: User | null; cloudStatus: CloudStatus; lastSync: number | null; onStarterChange: (id: number) => void; onLogout: () => void }) {
  const starters=pokemon.filter((entry)=>[1,4,7].includes(entry.id));
  const syncLabel=cloudStatus==='saved'?'Sincronizado':cloudStatus==='loading'?'Guardando…':cloudStatus==='prototype'?'Guardado en la nube desactivado':cloudStatus==='conflict'?'Existe una partida más nueva en otro dispositivo':'Revisa tu conexión';
  return <div className="page"><div className="page-title"><div><span className="kicker">CAMPAMENTO</span><h1>Cuenta y opciones</h1><p>Administra tu compañero y comprueba el estado real de la partida.</p></div></div>
    <section className="account-panel panel"><div><span className="kicker">CUENTA Y GUARDADO</span><h2>{user?.displayName??'Entrenador local'}</h2><p>{user?.email??'Entra con Google para activar el guardado.'}</p></div><div className={`sync-status ${cloudStatus}`}><strong>{syncLabel}</strong><small>{lastSync?`Última sincronización: ${new Date(lastSync).toLocaleString('es-CL')}`:'Aún no existe una copia en la nube'}</small><small>Versión de partida: {game.schemaVersion}</small></div>{user&&<button className="secondary" onClick={onLogout}>Cerrar sesión</button>}</section>
    <section className="starter-panel panel"><span className="kicker">COMPAÑERO INICIAL</span><h2>Elige quién aparece en tu campamento</h2><div className="starter-grid">{starters.map((entry)=><button className={game.starterId===entry.id?'selected':''} onClick={()=>onStarterChange(entry.id)} key={entry.id}><span style={{'--poke':entry.color} as React.CSSProperties}><img src={entry.image} alt={entry.name}/></span><strong>{entry.name}</strong></button>)}</div></section>
    <div className="settings-grid">{[['Investigación','Mejoras de expediciones y equipos'],['Misiones permanentes',`${game.completedMissionIds.length} completadas`],['Estadísticas',`${getAccountPower(game)} de poder de cuenta`],['Inventario',`${game.packInventory.basic??0} sobres básicos`]].map(([title,description],index)=><button className="settings-card panel" key={title}><span>{['⌬','✓','↗','▰'][index]}</span><div><strong>{title}</strong><small>{description}</small></div><b>›</b></button>)}</div>
  </div>;
}

export default App;
