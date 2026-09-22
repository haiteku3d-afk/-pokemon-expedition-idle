import { missions, pokemon } from './gameData';

export const GAME_STATE_VERSION = 2;
export const MAX_OFFLINE_TIME = 8 * 60 * 60 * 1000;

export type CardProgress = { copies: number; level: number };
export type ActiveMission = { missionId: number; startedAt: number; endsAt: number };

export type GameState = {
  schemaVersion: number;
  coins: number;
  stones: number;
  starterId: number;
  cards: Record<string, CardProgress>;
  team: number[];
  completedMissionIds: number[];
  activeMission: ActiveMission | null;
  unlockedZoneIds: string[];
  zoneProgress: Record<string, number>;
  packInventory: Record<string, number>;
  lastActiveAt: number;
};

export type MissionState = 'completed' | 'active' | 'ready' | 'available' | 'locked';

const asNumber = (value: unknown, fallback: number) => typeof value === 'number' && Number.isFinite(value) ? value : fallback;
const asObject = (value: unknown): Record<string, unknown> => value && typeof value === 'object' ? value as Record<string, unknown> : {};

export function createInitialGameState(now = Date.now()): GameState {
  return {
    schemaVersion: GAME_STATE_VERSION,
    coins: 630,
    stones: 2,
    starterId: 7,
    cards: { '7': { copies: 1, level: 8 } },
    team: [7],
    completedMissionIds: [],
    activeMission: null,
    unlockedZoneIds: ['viridian-forest'],
    zoneProgress: { 'viridian-forest': 0 },
    packInventory: { basic: 0, advanced: 0, elite: 0 },
    lastActiveAt: now,
  };
}

export function migrateGameState(input: unknown, now = Date.now()): GameState {
  const raw = asObject(input);
  const initial = createInitialGameState(now);
  const starterId = asNumber(raw.starterId, initial.starterId);
  const cards = asObject(raw.cards) as GameState['cards'];
  const isLegacy = asNumber(raw.schemaVersion, 0) < GAME_STATE_VERSION;
  const completed = Array.isArray(raw.completedMissionIds)
    ? raw.completedMissionIds.filter((id): id is number => typeof id === 'number' && missions.some((mission) => mission.id === id))
    : isLegacy ? [1] : [];
  const activeRaw = asObject(raw.activeMission);
  const activeMissionId = asNumber(activeRaw.missionId, 0);
  const activeMission = missions.some((mission) => mission.id === activeMissionId)
    ? {
        missionId: activeMissionId,
        startedAt: asNumber(activeRaw.startedAt, now),
        endsAt: asNumber(activeRaw.endsAt, now),
      }
    : null;
  const progress = Math.min(100, completed.filter((id) => missions.some((mission) => mission.id === id && mission.zoneId === 'viridian-forest')).length * 25);

  return {
    schemaVersion: GAME_STATE_VERSION,
    coins: Math.max(0, asNumber(raw.coins, initial.coins)),
    stones: Math.max(0, asNumber(raw.stones, initial.stones)),
    starterId,
    cards: Object.keys(cards).length ? cards : { [String(starterId)]: { copies: 1, level: 1 } },
    team: Array.isArray(raw.team) && raw.team.length ? raw.team.filter((id): id is number => typeof id === 'number').slice(0, 6) : [starterId],
    completedMissionIds: [...new Set(completed)].sort((a, b) => a - b),
    activeMission,
    unlockedZoneIds: Array.isArray(raw.unlockedZoneIds) ? raw.unlockedZoneIds.filter((id): id is string => typeof id === 'string') : ['viridian-forest'],
    zoneProgress: { ...asObject(raw.zoneProgress), 'viridian-forest': progress } as Record<string, number>,
    packInventory: {
      basic: Math.max(0, asNumber(asObject(raw.packInventory).basic, 0)),
      advanced: Math.max(0, asNumber(asObject(raw.packInventory).advanced, 0)),
      elite: Math.max(0, asNumber(asObject(raw.packInventory).elite, 0)),
    },
    lastActiveAt: asNumber(raw.lastActiveAt, now),
  };
}

export function getProduction(state: GameState) {
  return missions
    .filter((mission) => state.completedMissionIds.includes(mission.id))
    .reduce((total, mission) => total + mission.production, 0);
}

export function getOfflineEarnings(state: GameState, now = Date.now()) {
  const elapsed = Math.min(Math.max(0, now - state.lastActiveAt), MAX_OFFLINE_TIME);
  return Math.floor((elapsed / 60_000) * getProduction(state));
}

export function getAccountPower(state: GameState) {
  return Object.entries(state.cards).reduce((total, [id, card]) => {
    const entry = pokemon.find((item) => item.id === Number(id));
    return total + (entry ? entry.power + Math.max(0, card.level - 1) * 2 : 0);
  }, 0);
}

export function getTeamPower(state: GameState) {
  return state.team.reduce((total, id) => {
    const entry = pokemon.find((item) => item.id === id);
    const card = state.cards[String(id)];
    return total + (entry && card ? entry.power + Math.max(0, card.level - 1) * 2 : 0);
  }, 0);
}

export function getMissionState(state: GameState, missionId: number, now = Date.now()): MissionState {
  if (state.completedMissionIds.includes(missionId)) return 'completed';
  if (state.activeMission?.missionId === missionId) return state.activeMission.endsAt <= now ? 'ready' : 'active';
  if (state.activeMission) return 'locked';
  const index = missions.findIndex((mission) => mission.id === missionId);
  if (index <= 0 || state.completedMissionIds.includes(missions[index - 1].id)) return 'available';
  return 'locked';
}

export function startMission(state: GameState, missionId: number, now = Date.now()): GameState {
  const mission = missions.find((item) => item.id === missionId);
  if (!mission || getMissionState(state, missionId, now) !== 'available' || getTeamPower(state) < mission.power) return state;
  return {
    ...state,
    activeMission: { missionId, startedAt: now, endsAt: now + mission.durationSeconds * 1000 },
    lastActiveAt: now,
  };
}

export function claimMission(state: GameState, now = Date.now()): GameState {
  const active = state.activeMission;
  if (!active || active.endsAt > now) return state;
  const mission = missions.find((item) => item.id === active.missionId);
  if (!mission || state.completedMissionIds.includes(mission.id)) return { ...state, activeMission: null };
  const completedMissionIds = [...state.completedMissionIds, mission.id].sort((a, b) => a - b);
  const zoneCompleted = completedMissionIds.filter((id) => missions.some((item) => item.id === id && item.zoneId === mission.zoneId)).length;
  return {
    ...state,
    coins: state.coins + mission.rewards.coins,
    stones: state.stones + (mission.rewards.stones ?? 0),
    packInventory: {
      ...state.packInventory,
      basic: (state.packInventory.basic ?? 0) + (mission.rewards.basicPacks ?? 0),
    },
    completedMissionIds,
    activeMission: null,
    zoneProgress: { ...state.zoneProgress, [mission.zoneId]: Math.min(100, zoneCompleted * 25) },
    lastActiveAt: now,
  };
}

export function formatDuration(seconds: number) {
  if (seconds < 60) return `${seconds} s`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return rest ? `${minutes} min ${rest} s` : `${minutes} min`;
}

export function formatCountdown(milliseconds: number) {
  const total = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(total / 60);
  return `${String(minutes).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}
