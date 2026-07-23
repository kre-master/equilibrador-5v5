const STORAGE_KEY = "five-a-side-balancer-state-v1";
const PAYMENT_RULES = {
  playerFeePerGame: 4,
  monthlyCap: 15,
  fieldCostPerGame: 38,
};
const DEBT_NOTE_PREFIX = "[DIVIDA]";

const FORM_LEVELS = {
  hot: { label: "Em grande forma", className: "form-hot" },
  good: { label: "Boa forma", className: "form-good" },
  normal: { label: "Normal", className: "form-normal" },
  bad: { label: "Ma fase", className: "form-bad" },
  recovery: { label: "A recuperar", className: "form-recovery" },
};

const PLAYER_CARD_VARIANTS = {
  rookie: { key: "rookie", asset: "assets/new cards template/card_rookie.png", label: "Rookie", description: "Jogador ainda sem jogos registados pela equipa." },
  base: { key: "base", asset: "assets/new cards template/card_base.png", label: "Base", description: "Carta normal quando nao existe outro destaque ativo." },
  win_1x: { key: "win_1x", asset: "assets/new cards template/card_win_1x.png", label: "Primeira vitoria", description: "Jogador venceu o primeiro jogo desde que ha historico registado." },
  win_2x: { key: "win_2x", asset: "assets/new cards template/card_win_2x.png", label: "2 vitorias seguidas", description: "Jogador venceu dois jogos consecutivos da equipa, sem ausencia pelo meio." },
  win_3x: { key: "win_3x", asset: "assets/new cards template/card_win_3x.png", label: "3 vitorias seguidas", description: "Jogador venceu tres jogos consecutivos da equipa, sem ausencia pelo meio." },
  win_4x: { key: "win_4x", asset: "assets/new cards template/card_win_4x.png", label: "4 vitorias seguidas", description: "Jogador venceu quatro jogos consecutivos da equipa, sem ausencia pelo meio." },
  win_5x: { key: "win_5x", asset: "assets/new cards template/card_win_5x.png", label: "5+ vitorias seguidas", description: "Jogador venceu cinco ou mais jogos consecutivos da equipa, sem ausencia pelo meio." },
  form_3w_5: { key: "form_3w_5", asset: "assets/new cards template/card_form_3w_5.png", label: "3 em 5", description: "Jogador venceu 3 dos ultimos 5 jogos em que participou." },
  form_4w_5: { key: "form_4w_5", asset: "assets/new cards template/card_form_4w_5.png", label: "4 em 5", description: "Jogador venceu 4 dos ultimos 5 jogos em que participou." },
  form_5w_5: { key: "form_5w_5", asset: "assets/new cards template/card_form_5w_5.png", label: "5 em 5", description: "Jogador venceu os ultimos 5 jogos em que participou." },
  mvp: { key: "mvp", asset: "assets/new cards template/card_mvp.png", label: "MVP", description: "Jogador foi MVP oficial do jogo anterior e joga o jogo seguinte." },
  mvp_2x: { key: "mvp_2x", asset: "assets/new cards template/card_mvp_2x.png", label: "MVP 2x", description: "Jogador foi MVP oficial em dois jogos consecutivos." },
  mvp_3x: { key: "mvp_3x", asset: "assets/new cards template/card_mvp_3x.png", label: "MVP 3x", description: "Jogador foi MVP oficial em tres ou mais jogos consecutivos." },
  mvp_month: { key: "mvp_month", asset: "assets/new cards template/card_mvp_month.png", label: "MVP do mes", description: "Jogador foi MVP do mes anterior e joga o primeiro jogo elegivel do mes seguinte." },
  champion_spring: { key: "champion_spring", asset: "assets/new cards template/card_champion_spring.png", label: "Campeao primavera", description: "Jogador foi campeao da primavera por vitorias, com win rate como desempate." },
  champion_summer: { key: "champion_summer", asset: "assets/new cards template/card_champion_summer.png", label: "Campeao verao", description: "Jogador foi campeao do verao por vitorias, com win rate como desempate." },
  champion_autumn: { key: "champion_autumn", asset: "assets/new cards template/card_champion_autumn.png", label: "Campeao outono", description: "Jogador foi campeao do outono por vitorias, com win rate como desempate." },
  champion_winter: { key: "champion_winter", asset: "assets/new cards template/card_champion_winter.png", label: "Campeao inverno", description: "Jogador foi campeao do inverno por vitorias, com win rate como desempate." },
  ironman_month: { key: "ironman_month", asset: "assets/new cards template/card_ironman_month.png", label: "Ironman do mes", description: "Jogador participou em todos os jogos finalizados do mes." },
  regular: { key: "regular", asset: "assets/new cards template/card_regular.png", label: "Regular", description: "Jogador teve presenca elevada nos jogos recentes da equipa." },
  return: { key: "return", asset: "assets/new cards template/card_return.png", label: "Regresso", description: "Jogador voltou a jogar depois de uma ausencia longa." },
  rising: { key: "rising", asset: "assets/new cards template/card_rising.png", label: "A subir", description: "Jogador esta com subida forte de forma/rating recente." },
  hot: { key: "hot", asset: "assets/new cards template/card_hot.png", label: "Em alta", description: "Jogador esta em grande forma recente." },
  recovery: { key: "recovery", asset: "assets/new cards template/card_recovery.png", label: "Recuperacao", description: "Jogador esta em fase negativa ou de recuperacao." },
};
const CARD_AWARD_PRIORITY = [
  "mvp_3x", "mvp_2x", "mvp", "mvp_month",
  "champion_spring", "champion_summer", "champion_autumn", "champion_winter",
  "win_5x", "win_4x", "win_3x", "win_2x", "win_1x",
  "form_5w_5", "form_4w_5", "form_3w_5",
  "ironman_month", "rising", "hot", "regular", "return", "recovery", "rookie", "base",
];
const FIELD_ONLY_CARD_KEYS = new Set(["champion_spring", "champion_summer", "champion_autumn", "champion_winter"]);

const FORM_LOOKBACK_GAMES = 5;
const PROFILE_HISTORY_LIMIT = 20;
const AWARD_REVEAL_STORAGE_KEY = "footer-award-reveals-v1";
const FORM_RATING_CAP = 7;
const TEAM_RADAR_MIN = 55;
const TEAM_RADAR_MAX = 75;
const TEAM_RADAR_DYNAMIC_MAX = true;
const TEAM_RADAR_AGGREGATION = "power";
const TEAM_RADAR_POWER = 1.35;
const MVP_MIN_VOTES = 5;
const MVP_LOCK_HOURS = 24;
const SEASON_DEFINITIONS = {
  spring: { label: "primavera", startMonth: 2, startDay: 20, endMonth: 5, endDay: 21 },
  summer: { label: "verao", startMonth: 5, startDay: 21, endMonth: 8, endDay: 22 },
  autumn: { label: "outono", startMonth: 8, startDay: 22, endMonth: 11, endDay: 21 },
  winter: { label: "inverno", startMonth: 11, startDay: 21, endMonth: 2, endDay: 20 },
};
const TEAM_RADAR_STATS = [
  { key: "pace", label: "PAC" },
  { key: "shooting", label: "SHO" },
  { key: "passing", label: "PAS" },
  { key: "dribbling", label: "DRI" },
  { key: "defending", label: "DEF" },
  { key: "physical", label: "PHY" },
];

const INITIAL_FINANCE_BALANCES = {};

const defaultFinanceSettings = {
  startMonth: "2026-05",
  cashBalance: 0,
  playerBalances: { ...INITIAL_FINANCE_BALANCES },
};

const samplePlayers = [
  player("p-demo-01", "Jogador 1", 49, 46, 47, 39, 52, 45, 46),
  player("p-demo-02", "Jogador 2", 76, 81, 78, 83, 77, 78, 79),
  player("p-demo-03", "Jogador 3", 74, 81, 73, 78, 74, 80, 77),
  player("p-demo-04", "Jogador 4", 60, 69, 67, 71, 52, 56, 62),
  player("p-demo-05", "Jogador 5", 58, 58, 62, 53, 67, 61, 60),
  player("p-demo-06", "Jogador 6", 63, 59, 60, 57, 65, 66, 62),
  player("p-demo-07", "Jogador 7", 66, 71, 73, 72, 75, 74, 72),
  player("p-demo-08", "Jogador 8", 59, 58, 60, 51, 63, 46, 56),
  player("p-demo-09", "Jogador 9", 58, 58, 58, 51, 64, 64, 59),
  player("p-demo-10", "Jogador 10", 50, 73, 69, 75, 52, 56, 62),
  player("p-demo-11", "Jogador 11", 48, 52, 53, 46, 52, 43, 49),
  player("p-demo-12", "Jogador 12", 74, 62, 60, 63, 70, 79, 68),
  player("p-demo-13", "Jogador 13", 72, 88, 83, 82, 70, 70, 77),
  player("p-demo-14", "Jogador 14", 85, 78, 73, 70, 78, 70, 76),
  player("p-demo-15", "Jogador 15", 68, 82, 83, 91, 70, 68, 77),
];

const config = window.FIVE5_CONFIG || {};
let state = loadState();
let supabaseClient = null;
let remoteEnabled = false;
let isAdmin = false;
let currentSession = null;
let currentProfile = null;
let knownProfiles = [];
let playerClaims = [];
let eventResponses = [];
let gameMvpVotes = state.gameMvpVotes || [];
let mvpVoteCounts = [];
let payments = state.payments || [];
let attendanceOverrides = state.attendanceOverrides || [];
let gameFinanceOverrides = state.gameFinanceOverrides || [];
let financeSettings = state.financeSettings || { ...defaultFinanceSettings, playerBalances: { ...defaultFinanceSettings.playerBalances } };
let currentEventId = null;
let currentPaymentsMonth = monthKey(new Date());
let selectedIds = new Set();
let currentSuggestions = [];
let currentGameId = null;
let currentHistoryGameId = null;
let currentGenerationDateIso = new Date().toISOString();
let previewGame = null;
let authActionBusy = false;
let currentPlayerProfileId = null;
let currentViewName = "events";
let navigationHistoryReady = false;
let awardRevealSessionSeenKeys = new Set();

const els = {
  tabs: document.querySelectorAll(".tab"),
  views: document.querySelectorAll(".view"),
  playerList: document.querySelector("#player-list"),
  playerSearch: document.querySelector("#player-search"),
  selectedCount: document.querySelector("#selected-count"),
  selectionHint: document.querySelector("#selection-hint"),
  clearSelection: document.querySelector("#clear-selection"),
  guestName: document.querySelector("#guest-name"),
  guestScore: document.querySelector("#guest-score"),
  addGuest: document.querySelector("#add-guest"),
  gameDate: document.querySelector("#game-date"),
  generateTeams: document.querySelector("#generate-teams"),
  suggestions: document.querySelector("#suggestions"),
  currentGameEmpty: document.querySelector("#current-game-empty"),
  currentGame: document.querySelector("#current-game"),
  fieldCard: document.querySelector("#field-card"),
  confirmGame: document.querySelector("#confirm-game"),
  exportImage: document.querySelector("#export-image"),
  scoreA: document.querySelector("#score-a"),
  scoreB: document.querySelector("#score-b"),
  saveScore: document.querySelector("#save-score"),
  rosterEditor: document.querySelector("#roster-editor"),
  addPlayerToGame: document.querySelector("#add-player-to-game"),
  addPlayerGameBtn: document.querySelector("#add-player-game-btn"),
  playersTable: document.querySelector("#players-table"),
  playerForm: document.querySelector("#player-form"),
  playerId: document.querySelector("#player-id"),
  formName: document.querySelector("#form-name"),
  formPace: document.querySelector("#form-pace"),
  formShooting: document.querySelector("#form-shooting"),
  formPassing: document.querySelector("#form-passing"),
  formDribbling: document.querySelector("#form-dribbling"),
  formDefending: document.querySelector("#form-defending"),
  formPhysical: document.querySelector("#form-physical"),
  formOverall: document.querySelector("#form-overall"),
  formPhoto: document.querySelector("#form-photo"),
  clearPlayerPhoto: document.querySelector("#clear-player-photo"),
  cancelPlayerEdit: document.querySelector("#cancel-player-edit"),
  exportData: document.querySelector("#export-data"),
  importData: document.querySelector("#import-data"),
  resetData: document.querySelector("#reset-data"),
  gamesList: document.querySelector("#games-list"),
  historyGameDetail: document.querySelector("#history-game-detail"),
  playerProfile: document.querySelector("#player-profile"),
  exportCanvas: document.querySelector("#export-canvas"),
  dataStatus: document.querySelector("#data-status"),
  adminLogin: document.querySelector("#admin-login"),
  accountSignup: document.querySelector("#account-signup"),
  adminLogout: document.querySelector("#admin-logout"),
  mvpGate: document.querySelector("#mvp-gate"),
  accountPanel: document.querySelector("#account-panel"),
  claimsList: document.querySelector("#claims-list"),
  accountsList: document.querySelector("#accounts-list"),
  paymentsPanel: document.querySelector("#payments-panel"),
  statsPanel: document.querySelector("#stats-panel"),
  eventForm: document.querySelector("#event-form"),
  eventTitle: document.querySelector("#event-title"),
  eventDate: document.querySelector("#event-date"),
  eventLocation: document.querySelector("#event-location"),
  eventMaxPlayers: document.querySelector("#event-max-players"),
  eventsList: document.querySelector("#events-list"),
  loadEventGoing: document.querySelector("#load-event-going"),
};

let pendingPhotoDataUrl = null;
const photoCache = new Map();
const cardAssetCache = new Map();

window.addEventListener("error", (event) => {
  if (els.playerList) {
    els.playerList.innerHTML = `
      <div class="hint warn">
        A app encontrou um erro ao carregar. Faz Ctrl + F5. Se continuar, usa "Repor exemplo" na aba Jogadores.
      </div>
    `;
  }
  console.error(event.error || event.message);
});

bindEvents();
initApp();

function player(id, name, pace, shooting, passing, dribbling, defending, physical, overall) {
  return {
    id,
    name,
    pace,
    shooting,
    passing,
    dribbling,
    defending,
    physical,
    overall,
    photoDataUrl: "",
    linkedUserId: null,
    isGuest: false,
    guestScore0To10: null,
  };
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (saved && Array.isArray(saved.players) && Array.isArray(saved.games)) {
      return migrateState(saved);
    }
  } catch (error) {
    console.warn("Could not load saved state", error);
  }
  return migrateState({
    players: samplePlayers,
    games: [],
    events: [],
    gameMvpVotes: [],
    payments: [],
    attendanceOverrides: [],
    gameFinanceOverrides: [],
    financeSettings: { ...defaultFinanceSettings, playerBalances: { ...defaultFinanceSettings.playerBalances } },
  });
}

function getSeenAwardReveals() {
  try {
    const parsed = JSON.parse(localStorage.getItem(AWARD_REVEAL_STORAGE_KEY) || "[]");
    const storedKeys = Array.isArray(parsed) ? parsed.map(String) : [];
    return new Set([...storedKeys, ...awardRevealSessionSeenKeys]);
  } catch {
    return new Set(awardRevealSessionSeenKeys);
  }
}

function saveSeenAwardReveals(keys) {
  awardRevealSessionSeenKeys = new Set([...keys].map(String));
  try {
    localStorage.setItem(AWARD_REVEAL_STORAGE_KEY, JSON.stringify([...awardRevealSessionSeenKeys]));
    return true;
  } catch (error) {
    console.warn("Could not save seen award reveals", error);
    return false;
  }
}

function getAwardRevealKey(playerId, gameId, awardKey) {
  return `${playerId}:${gameId}:${awardKey}`;
}

function migrateState(saved) {
  saved.players = saved.players
    .map((p, index) => normalizePlayerRecord(p, index))
    .filter(Boolean);
  if (!saved.players.length) {
    saved.players = samplePlayers.map((p) => ({ ...p }));
  }
  saved.games = saved.games.map((game) => ensureGameShape({ ...game }));
  saved.events = Array.isArray(saved.events) ? saved.events.map(normalizeEventRecord).filter(Boolean) : [];
  saved.gameMvpVotes = Array.isArray(saved.gameMvpVotes) ? saved.gameMvpVotes.map(normalizeMvpVoteRecord).filter(Boolean) : [];
  saved.payments = Array.isArray(saved.payments) ? saved.payments.map(normalizePaymentRecord).filter(Boolean) : [];
  saved.attendanceOverrides = Array.isArray(saved.attendanceOverrides) ? saved.attendanceOverrides.map(normalizeAttendanceOverrideRecord).filter(Boolean) : [];
  saved.gameFinanceOverrides = Array.isArray(saved.gameFinanceOverrides) ? saved.gameFinanceOverrides.map(normalizeGameFinanceOverrideRecord).filter(Boolean) : [];
  saved.financeSettings = normalizeFinanceSettings(saved.financeSettings);
  return saved;
}

function normalizePlayerRecord(record, index) {
  if (!record || typeof record !== "object") return null;
  const quickRating = Number(record.guestScore0To10);
  const fallbackRating = clampRating(record.overall ?? (Number.isNaN(quickRating) ? 50 : quickRating * 10));
  return {
    id: String(record.id || `p-imported-${index}-${Date.now()}`),
    name: String(record.name || `Jogador ${index + 1}`).trim() || `Jogador ${index + 1}`,
    pace: clampRating(record.pace ?? fallbackRating),
    shooting: clampRating(record.shooting ?? fallbackRating),
    passing: clampRating(record.passing ?? fallbackRating),
    dribbling: clampRating(record.dribbling ?? fallbackRating),
    defending: clampRating(record.defending ?? fallbackRating),
    physical: clampRating(record.physical ?? fallbackRating),
    overall: fallbackRating,
    photoDataUrl: String(record.photoDataUrl || ""),
    linkedUserId: record.linkedUserId || null,
    isGuest: Boolean(record.isGuest),
    guestScore0To10: record.guestScore0To10,
  };
}

function playerFromRow(row) {
  return normalizePlayerRecord({
    id: row.id,
    name: row.name,
    pace: row.pace,
    shooting: row.shooting,
    passing: row.passing,
    dribbling: row.dribbling,
    defending: row.defending,
    physical: row.physical,
    overall: row.overall,
    photoDataUrl: row.photo_data_url,
    linkedUserId: row.linked_user_id,
    isGuest: Boolean(row.is_guest),
    guestScore0To10: row.guest_score_0_to_10,
  }, 0);
}

function playerToRow(playerData) {
  return {
    id: playerData.id,
    name: playerData.name,
    pace: playerData.pace,
    shooting: playerData.shooting,
    passing: playerData.passing,
    dribbling: playerData.dribbling,
    defending: playerData.defending,
    physical: playerData.physical,
    overall: playerData.overall,
    photo_data_url: playerData.photoDataUrl || "",
    linked_user_id: playerData.linkedUserId || null,
    is_guest: Boolean(playerData.isGuest),
    guest_score_0_to_10: playerData.guestScore0To10 ?? null,
    updated_at: new Date().toISOString(),
  };
}

function gameFromRow(row) {
  return ensureGameShape({
    id: row.id,
    date: row.date,
    status: row.status,
    teamA: row.team_a || [],
    teamB: row.team_b || [],
    benchA: row.bench_a || [],
    benchB: row.bench_b || [],
    scoreA: row.score_a,
    scoreB: row.score_b,
    scoreSavedAt: row.score_saved_at || null,
    notes: row.notes || "",
  });
}

function gameToRow(game) {
  const clean = ensureGameShape({ ...game });
  return {
    id: clean.id,
    date: clean.date,
    status: clean.status,
    team_a: clean.teamA,
    team_b: clean.teamB,
    bench_a: clean.benchA,
    bench_b: clean.benchB,
    score_a: clean.scoreA,
    score_b: clean.scoreB,
    score_saved_at: clean.scoreSavedAt || null,
    notes: clean.notes || "",
    updated_at: new Date().toISOString(),
  };
}

function normalizeEventRecord(record) {
  if (!record || typeof record !== "object") return null;
  const startsAt = record.startsAt || record.starts_at || new Date().toISOString();
  return {
    id: String(record.id || `e-${Date.now()}`),
    title: String(record.title || "Jogo 5v5").trim() || "Jogo 5v5",
    sport: String(record.sport || "futsal"),
    startsAt,
    location: String(record.location || ""),
    minPlayers: Number(record.minPlayers ?? record.min_players ?? 10),
    maxPlayers: Number(record.maxPlayers ?? record.max_players ?? 12),
    status: String(record.status || "open"),
    createdBy: record.createdBy || record.created_by || null,
  };
}

function eventFromRow(row) {
  return normalizeEventRecord({
    id: row.id,
    title: row.title,
    sport: row.sport,
    startsAt: row.starts_at,
    location: row.location,
    minPlayers: row.min_players,
    maxPlayers: row.max_players,
    status: row.status,
    createdBy: row.created_by,
  });
}

function eventToRow(eventData) {
  const clean = normalizeEventRecord(eventData);
  return {
    id: clean.id,
    title: clean.title,
    sport: clean.sport,
    starts_at: clean.startsAt,
    location: clean.location,
    min_players: clean.minPlayers,
    max_players: clean.maxPlayers,
    status: clean.status,
    created_by: clean.createdBy,
    updated_at: new Date().toISOString(),
  };
}

function responseFromRow(row) {
  return {
    id: row.id,
    eventId: row.event_id,
    playerId: row.player_id,
    userId: row.user_id,
    status: row.status,
    updatedAt: row.updated_at,
  };
}

function normalizeMvpVoteRecord(record) {
  if (!record || typeof record !== "object") return null;
  const gameId = record.gameId || record.game_id;
  const voterPlayerId = record.voterPlayerId || record.voter_player_id;
  const candidatePlayerId = record.candidatePlayerId || record.candidate_player_id;
  if (!gameId || !voterPlayerId || !candidatePlayerId || voterPlayerId === candidatePlayerId) return null;
  return {
    id: String(record.id || createUuid()),
    gameId: String(gameId),
    voterPlayerId: String(voterPlayerId),
    candidatePlayerId: String(candidatePlayerId),
    userId: record.userId || record.user_id || null,
    createdAt: record.createdAt || record.created_at || new Date().toISOString(),
    updatedAt: record.updatedAt || record.updated_at || new Date().toISOString(),
  };
}

function mvpVoteFromRow(row) {
  return normalizeMvpVoteRecord({
    id: row.id,
    gameId: row.game_id,
    voterPlayerId: row.voter_player_id,
    candidatePlayerId: row.candidate_player_id,
    userId: row.user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

function mvpVoteToRow(vote) {
  const clean = normalizeMvpVoteRecord(vote);
  return {
    id: clean.id,
    game_id: clean.gameId,
    voter_player_id: clean.voterPlayerId,
    candidate_player_id: clean.candidatePlayerId,
    user_id: clean.userId || currentSession?.user?.id || null,
    updated_at: new Date().toISOString(),
  };
}

function mvpVoteCountFromRow(row) {
  return {
    gameId: String(row.game_id),
    candidatePlayerId: String(row.candidate_player_id),
    voteCount: Number(row.vote_count || 0),
  };
}

function normalizePaymentRecord(record) {
  if (!record || typeof record !== "object") return null;
  const amount = Number(record.amount);
  if (!record.playerId && !record.player_id) return null;
  if (Number.isNaN(amount) || amount < 0) return null;
  return {
    id: String(record.id || `pay-${Date.now()}-${Math.random().toString(16).slice(2)}`),
    playerId: String(record.playerId || record.player_id),
    amount,
    paidAt: record.paidAt || record.paid_at || new Date().toISOString(),
    note: String(record.note || ""),
    createdBy: record.createdBy || record.created_by || null,
    createdAt: record.createdAt || record.created_at || new Date().toISOString(),
  };
}

function paymentFromRow(row) {
  return normalizePaymentRecord({
    id: row.id,
    playerId: row.player_id,
    amount: row.amount,
    paidAt: row.paid_at,
    note: row.note,
    createdBy: row.created_by,
    createdAt: row.created_at,
  });
}

function paymentToRow(payment) {
  const clean = normalizePaymentRecord(payment);
  return {
    id: clean.id,
    player_id: clean.playerId,
    amount: clean.amount,
    paid_at: clean.paidAt,
    note: clean.note || "",
    created_by: clean.createdBy || currentSession?.user?.id || null,
    updated_at: new Date().toISOString(),
  };
}

function normalizeAttendanceOverrideRecord(record) {
  if (!record || typeof record !== "object") return null;
  const gameId = record.gameId || record.game_id;
  const playerId = record.playerId || record.player_id;
  if (!gameId || !playerId) return null;
  return {
    id: String(record.id || attendanceOverrideId(gameId, playerId)),
    gameId: String(gameId),
    playerId: String(playerId),
    attended: Boolean(record.attended),
    updatedBy: record.updatedBy || record.updated_by || null,
    updatedAt: record.updatedAt || record.updated_at || new Date().toISOString(),
  };
}

function attendanceOverrideFromRow(row) {
  return normalizeAttendanceOverrideRecord({
    id: row.id,
    gameId: row.game_id,
    playerId: row.player_id,
    attended: row.attended,
    updatedBy: row.updated_by,
    updatedAt: row.updated_at,
  });
}

function attendanceOverrideToRow(override) {
  const clean = normalizeAttendanceOverrideRecord(override);
  return {
    id: clean.id,
    game_id: clean.gameId,
    player_id: clean.playerId,
    attended: clean.attended,
    updated_by: currentSession?.user?.id || clean.updatedBy || null,
    updated_at: new Date().toISOString(),
  };
}

function normalizeGameFinanceOverrideRecord(record) {
  if (!record || typeof record !== "object") return null;
  const gameId = record.gameId || record.game_id;
  if (!gameId) return null;
  const fieldCost = Number(record.fieldCost ?? record.field_cost ?? PAYMENT_RULES.fieldCostPerGame);
  return {
    id: String(record.id || gameFinanceOverrideId(gameId)),
    gameId: String(gameId),
    fieldPaid: record.fieldPaid ?? record.field_paid ?? true,
    chargePlayers: record.chargePlayers ?? record.charge_players ?? true,
    fieldCost: Number.isNaN(fieldCost) || fieldCost < 0 ? PAYMENT_RULES.fieldCostPerGame : fieldCost,
    updatedBy: record.updatedBy || record.updated_by || null,
    updatedAt: record.updatedAt || record.updated_at || new Date().toISOString(),
  };
}

function gameFinanceOverrideFromRow(row) {
  return normalizeGameFinanceOverrideRecord({
    id: row.id,
    gameId: row.game_id,
    fieldPaid: row.field_paid,
    chargePlayers: row.charge_players,
    fieldCost: row.field_cost,
    updatedBy: row.updated_by,
    updatedAt: row.updated_at,
  });
}

function gameFinanceOverrideToRow(override) {
  const clean = normalizeGameFinanceOverrideRecord(override);
  return {
    id: clean.id,
    game_id: clean.gameId,
    field_paid: clean.fieldPaid,
    charge_players: clean.chargePlayers,
    field_cost: clean.fieldCost,
    updated_by: currentSession?.user?.id || clean.updatedBy || null,
    updated_at: new Date().toISOString(),
  };
}

function normalizeFinanceSettings(record) {
  const base = {
    ...defaultFinanceSettings,
    playerBalances: { ...defaultFinanceSettings.playerBalances },
  };
  if (!record || typeof record !== "object") return base;
  const rawBalances = record.playerBalances || record.player_balances || {};
  const playerBalances = { ...base.playerBalances };
  Object.entries(rawBalances).forEach(([playerId, value]) => {
    const amount = Number(value);
    if (!Number.isNaN(amount)) playerBalances[playerId] = amount;
  });
  return {
    startMonth: String(record.startMonth || record.start_month || base.startMonth),
    cashBalance: Number(record.cashBalance ?? record.cash_balance ?? base.cashBalance) || 0,
    playerBalances,
  };
}

function financeSettingsFromRow(row) {
  return normalizeFinanceSettings({
    startMonth: row.start_month,
    cashBalance: row.cash_balance,
    playerBalances: row.player_balances,
  });
}

function financeSettingsToRow(settings) {
  const clean = normalizeFinanceSettings(settings);
  return {
    id: "main",
    start_month: clean.startMonth,
    cash_balance: clean.cashBalance,
    player_balances: clean.playerBalances,
    updated_by: currentSession?.user?.id || null,
    updated_at: new Date().toISOString(),
  };
}

function saveState() {
  state.gameMvpVotes = gameMvpVotes;
  state.payments = payments;
  state.attendanceOverrides = attendanceOverrides;
  state.gameFinanceOverrides = gameFinanceOverrides;
  state.financeSettings = financeSettings;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

async function persistState() {
  saveState();
  if (remoteEnabled && isAdmin) {
    await saveRemoteState();
  }
  updateAccessUi();
}

async function persistMvpVote(vote) {
  saveState();
  if (remoteEnabled && supabaseClient && currentSession?.user) {
    const { error } = await supabaseClient.from("game_mvp_votes").insert(mvpVoteToRow(vote));
    if (error) throw error;
  }
  updateAccessUi();
}

async function saveRemoteState() {
  if (!supabaseClient) return;
  const players = state.players.map(playerToRow);
  const games = state.games.map(gameToRow);
  const events = (state.events || []).map(eventToRow);
  const paymentRows = payments.map(paymentToRow);
  const attendanceOverrideRows = attendanceOverrides.map(attendanceOverrideToRow);
  const gameFinanceOverrideRows = gameFinanceOverrides.map(gameFinanceOverrideToRow);
  const financeSettingsRow = financeSettingsToRow(financeSettings);

  if (players.length) {
    const { error } = await supabaseClient.from("players").upsert(players);
    if (error) throw error;
  }

  if (games.length) {
    const { error } = await supabaseClient.from("games").upsert(games);
    if (error) throw error;
  }

  if (events.length) {
    const { error } = await supabaseClient.from("events").upsert(events);
    if (error) throw error;
  }

  if (paymentRows.length) {
    const { error } = await supabaseClient.from("payments").upsert(paymentRows);
    if (error) throw error;
  }

  if (attendanceOverrideRows.length) {
    const { error } = await supabaseClient.from("attendance_overrides").upsert(attendanceOverrideRows);
    if (error) throw error;
  }

  if (gameFinanceOverrideRows.length) {
    const { error } = await supabaseClient.from("game_finance_overrides").upsert(gameFinanceOverrideRows);
    if (error) {
      const legacyRows = gameFinanceOverrideRows.map(({ field_cost, ...row }) => row);
      const { error: legacyError } = await supabaseClient.from("game_finance_overrides").upsert(legacyRows);
      if (legacyError) throw error;
      console.warn("game_finance_overrides.field_cost is not available yet. Run supabase/schema.sql to persist custom field costs.");
    }
  }

  const { error: financeError } = await supabaseClient.from("finance_settings").upsert(financeSettingsRow);
  if (financeError) throw financeError;
}

function canWriteOfficialData() {
  return !remoteEnabled || isAdmin;
}

function requireAdmin() {
  if (canWriteOfficialData()) return true;
  alert("Modo visitante: podes gerar sugestoes e exportar PNG, mas so o admin pode guardar/editar dados.");
  return false;
}

function bindEvents() {
  els.tabs.forEach((tab) => on(tab, "click", () => showView(tab.dataset.view)));

  on(els.playerSearch, "input", renderPlayerList);
  on(els.clearSelection, "click", () => {
    selectedIds.clear();
    renderPlayerList();
  });
  on(els.addGuest, "click", addGuest);
  on(els.gameDate, "input", updatePreviewGameDate);
  on(els.gameDate, "change", updatePreviewGameDate);
  on(els.generateTeams, "click", generateAndRenderSuggestions);
  on(els.confirmGame, "click", confirmPreviewGame);
  on(els.exportImage, "click", exportCurrentGameImage);
  on(els.saveScore, "click", saveCurrentScore);
  on(els.addPlayerGameBtn, "click", addSelectedPlayerToGame);
  on(els.playerForm, "submit", savePlayerFromForm);
  [els.formPace, els.formShooting, els.formPassing, els.formDribbling, els.formDefending, els.formPhysical]
    .forEach((input) => on(input, "input", updateOverallFromPartialRatings));
  on(els.formPhoto, "change", handlePhotoSelection);
  on(els.clearPlayerPhoto, "click", clearPendingPhoto);
  on(els.cancelPlayerEdit, "click", clearPlayerForm);
  on(els.exportData, "click", exportData);
  on(els.importData, "change", importData);
  on(els.resetData, "click", resetData);
  on(els.adminLogin, "click", adminLogin);
  on(els.accountSignup, "click", createAccount);
  on(els.adminLogout, "click", adminLogout);
  on(els.eventForm, "submit", saveEventFromForm);
  on(els.loadEventGoing, "click", loadCurrentEventGoingPlayers);
}

async function initApp() {
  await initRemote();
  applyLandingRoute();
  render();
  setupNavigationHistory();
}

function applyLandingRoute() {
  const linkedPlayer = getLinkedPlayer();
  if (!linkedPlayer) return;

  const activeEvent = getLandingActiveEvent();
  if (activeEvent && !getResponseForPlayer(activeEvent.id, linkedPlayer.id)) {
    currentEventId = activeEvent.id;
    showView("events", { push: false });
    return;
  }

  const openGame = getLandingOpenGame(linkedPlayer.id);
  if (openGame) {
    currentGameId = openGame.id;
    currentHistoryGameId = null;
    showView("today", { push: false });
    return;
  }

  currentPlayerProfileId = linkedPlayer.id;
  showView("player-profile", { push: false });
}

function getLandingOpenGame(playerId) {
  return [...state.games]
    .filter((game) => !isFinishedGame(game) && getGamePlayerIds(ensureGameShape(game)).includes(playerId))
    .sort((a, b) => new Date(a.date) - new Date(b.date))[0] || null;
}

function getLandingActiveEvent() {
  const now = Date.now();
  return [...(state.events || [])]
    .filter((eventData) => eventData.status === "open")
    .sort((a, b) => {
      const aFuture = new Date(a.startsAt).getTime() >= now ? 0 : 1;
      const bFuture = new Date(b.startsAt).getTime() >= now ? 0 : 1;
      return aFuture - bFuture || new Date(a.startsAt) - new Date(b.startsAt);
    })[0] || null;
}

async function initRemote() {
  const hasConfig = Boolean(config.supabaseUrl && config.supabaseAnonKey);
  if (!hasConfig || !window.supabase?.createClient) {
    updateAccessUi();
    return;
  }

  supabaseClient = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
  remoteEnabled = true;
  await loadAccountState();
  await loadRemoteState();
  updateAccessUi();
}

async function loadAccountState() {
  currentSession = null;
  currentProfile = null;
  knownProfiles = [];
  playerClaims = [];
  isAdmin = false;

  if (!supabaseClient) return;
  const { data } = await supabaseClient.auth.getSession();
  currentSession = data?.session || null;
  if (!currentSession?.user) return;

  const user = currentSession.user;
  const { data: profiles, error: profilesError } = await supabaseClient
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true });

  if (profilesError) {
    console.warn("Profile load failed", profilesError);
    return;
  }

  const profileRows = profiles || [];
  knownProfiles = profileRows;
  currentProfile = profileRows.find((profile) => profile.id === user.id) || null;
  if (!currentProfile) {
    const role = await hasAnyRemoteProfile(profileRows) ? "player" : "admin";
    const displayName = user.user_metadata?.display_name || user.email?.split("@")[0] || "Jogador";
    const username = normalizeUsername(user.user_metadata?.username || displayName);
    const { data: createdProfile, error } = await supabaseClient
      .from("profiles")
      .insert({
        id: user.id,
        email: user.email,
        username,
        display_name: displayName,
        role,
      })
      .select()
      .single();
    if (error) {
      console.warn("Profile create failed", error);
    } else {
      currentProfile = createdProfile;
      knownProfiles = [...profileRows, createdProfile];
    }
  }

  isAdmin = currentProfile?.role === "admin";
  await loadPlayerClaims();
}

async function hasAnyRemoteProfile(visibleProfiles = []) {
  if (!supabaseClient || !currentSession?.user) return visibleProfiles.length > 0;
  const { data, error } = await supabaseClient.rpc("has_any_profile");
  if (error) {
    console.warn("Profile bootstrap check failed", error);
    return true;
  }
  return Boolean(data);
}

async function loadPlayerClaims() {
  if (!currentSession?.user || !supabaseClient) {
    playerClaims = [];
    return;
  }

  const { data, error } = await supabaseClient
    .from("player_claims")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("Claims load failed", error);
    playerClaims = [];
    return;
  }
  playerClaims = data || [];
}

async function loadRemoteState() {
  if (!remoteEnabled) return;
  if (!currentSession?.user) {
    eventResponses = [];
    gameMvpVotes = [];
    mvpVoteCounts = [];
    updateAccessUi();
    return;
  }

  const [
    { data: players, error: playerError },
    { data: games, error: gameError },
    { data: events, error: eventError },
    { data: responses, error: responseError },
    { data: mvpRows, error: mvpError },
    { data: mvpCountRows, error: mvpCountError },
  ] = await Promise.all([
    supabaseClient.from("players").select("*").order("name", { ascending: true }),
    supabaseClient.from("games").select("*").order("date", { ascending: false }),
    supabaseClient.from("events").select("*").order("starts_at", { ascending: true }),
    supabaseClient.from("event_responses").select("*").order("updated_at", { ascending: false }),
    supabaseClient.from("game_mvp_votes").select("*").order("updated_at", { ascending: false }),
    supabaseClient.rpc("mvp_vote_counts"),
  ]);

  if (playerError || gameError || eventError || responseError) {
    console.warn("Remote load failed", playerError || gameError || eventError || responseError);
    remoteEnabled = false;
    updateAccessUi("Supabase indisponivel, modo local");
    return;
  }
  if (mvpError) console.warn("MVP vote load failed. Run supabase/schema.sql again.", mvpError);
  if (mvpCountError) console.warn("MVP vote count load failed. Run supabase/schema.sql again.", mvpCountError);

  let remotePayments = [];
  let remoteAttendanceOverrides = [];
  let remoteGameFinanceOverrides = [];
  if (isAdmin) {
    const [
      { data: paymentRows, error: paymentError },
      { data: attendanceRows, error: attendanceError },
      { data: gameFinanceRows, error: gameFinanceError },
      { data: financeRows, error: financeError },
    ] = await Promise.all([
      supabaseClient.from("payments").select("*").order("paid_at", { ascending: false }),
      supabaseClient.from("attendance_overrides").select("*").order("updated_at", { ascending: false }),
      supabaseClient.from("game_finance_overrides").select("*").order("updated_at", { ascending: false }),
      supabaseClient.from("finance_settings").select("*").eq("id", "main"),
    ]);
    if (paymentError || attendanceError || financeError) {
      console.warn("Finance load failed. Run supabase/schema.sql again.", paymentError || attendanceError || financeError);
    } else {
      remotePayments = paymentRows || [];
      remoteAttendanceOverrides = attendanceRows || [];
      if (financeRows?.[0]) financeSettings = financeSettingsFromRow(financeRows[0]);
    }
    if (gameFinanceError) {
      console.warn("Game finance rules load failed. Run supabase/schema.sql again.", gameFinanceError);
    } else {
      remoteGameFinanceOverrides = gameFinanceRows || [];
    }
  }

  if (!players.length && isAdmin && state.players.length) {
    await saveRemoteState();
    updateAccessUi("Online: dados locais publicados");
    return;
  }

  if (!players.length && state.players.length) {
    updateAccessUi("Online: sem dados remotos");
    return;
  }

  state = migrateState({
    players: players.map(playerFromRow),
    games: games.map(gameFromRow),
    events: (events || []).map(eventFromRow),
    gameMvpVotes: (mvpRows || []).map(mvpVoteFromRow).filter(Boolean),
    payments: (remotePayments || []).map(paymentFromRow).filter(Boolean),
    attendanceOverrides: (remoteAttendanceOverrides || []).map(attendanceOverrideFromRow).filter(Boolean),
    gameFinanceOverrides: (remoteGameFinanceOverrides || []).map(gameFinanceOverrideFromRow).filter(Boolean),
    financeSettings,
  });
  await repairDuplicatePlayerLinks();
  eventResponses = (responses || []).map(responseFromRow);
  gameMvpVotes = state.gameMvpVotes || [];
  mvpVoteCounts = (mvpCountRows || []).map(mvpVoteCountFromRow).filter((row) => row.gameId && row.candidatePlayerId);
  payments = state.payments || [];
  attendanceOverrides = state.attendanceOverrides || [];
  gameFinanceOverrides = state.gameFinanceOverrides || [];
  financeSettings = state.financeSettings || financeSettings;
  currentEventId = getNextEvent()?.id || state.events[0]?.id || null;
  currentGameId = null;
  saveState();
}

async function repairDuplicatePlayerLinks() {
  if (!remoteEnabled || !supabaseClient || !isAdmin) return;
  const byUser = new Map();
  state.players.forEach((playerData) => {
    if (!playerData.linkedUserId) return;
    const list = byUser.get(playerData.linkedUserId) || [];
    list.push(playerData);
    byUser.set(playerData.linkedUserId, list);
  });

  for (const [userId, linkedPlayers] of byUser.entries()) {
    if (linkedPlayers.length <= 1) continue;
    const approvedClaims = playerClaims
      .filter((claim) => claim.user_id === userId && claim.status === "approved")
      .sort((a, b) => new Date(b.reviewed_at || b.created_at) - new Date(a.reviewed_at || a.created_at));
    const keepId = approvedClaims[0]?.player_id || linkedPlayers.sort((a, b) => a.name.localeCompare(b.name))[0].id;
    state.players = state.players.map((playerData) => ({
      ...playerData,
      linkedUserId: playerData.linkedUserId === userId && playerData.id !== keepId ? null : playerData.linkedUserId,
    }));
    const { error } = await supabaseClient
      .from("players")
      .update({ linked_user_id: null, updated_at: new Date().toISOString() })
      .eq("linked_user_id", userId)
      .neq("id", keepId);
    if (error) console.warn("Duplicate link repair failed", error);
  }
}

function updateAccessUi(message) {
  const linkedPlayer = getLinkedPlayer();
  let defaultMode = "Modo local";
  if (remoteEnabled) {
    if (!currentSession) defaultMode = "Online: visitante";
    else if (isAdmin) defaultMode = "Online: admin";
    else if (linkedPlayer) defaultMode = `Online: ${linkedPlayer.name}`;
    else defaultMode = "Online: conta sem perfil";
  }
  const mode = message || defaultMode;
  if (els.dataStatus) els.dataStatus.textContent = mode;
  document.body.classList.toggle("visitor-mode", remoteEnabled && !isAdmin);
  document.body.classList.toggle("admin-mode", canWriteOfficialData());
  document.body.classList.toggle("non-admin-mode", !canWriteOfficialData());
  if (els.adminLogin) els.adminLogin.classList.toggle("hidden", Boolean(currentSession));
  if (els.accountSignup) els.accountSignup.classList.toggle("hidden", Boolean(currentSession) || !remoteEnabled);
  if (els.adminLogout) els.adminLogout.classList.toggle("hidden", !currentSession);
}

async function adminLogin() {
  if (!remoteEnabled || !supabaseClient) {
    alert("Configura primeiro o Supabase em app-config.js.");
    return;
  }
  const login = prompt("Email ou username:");
  if (!login) {
    alert("Escreve o email ou username da conta.");
    return;
  }
  const email = await resolveLoginEmail(login);
  if (!email) {
    alert("Nao encontrei esse email/username.");
    return;
  }
  const password = prompt("Password:");
  if (!password) return;
  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) {
    alert(`Login falhou: ${formatAuthError(error)}`);
    return;
  }
  await loadAccountState();
  await loadRemoteState();
  updateAccessUi();
  render();
}

async function createAccount() {
  if (!remoteEnabled || !supabaseClient) {
    alert("Configura primeiro o Supabase em app-config.js.");
    return;
  }
  if (authActionBusy) return;
  const email = prompt("Email:");
  if (!email) return;
  const username = normalizeUsername(prompt("Username:", email.split("@")[0]) || "");
  if (!username) {
    alert("Escolhe um username valido.");
    return;
  }
  const password = prompt("Password:");
  if (!password) return;
  const displayName = prompt("Nome a mostrar:", email.split("@")[0]) || email.split("@")[0];
  setAuthActionBusy(true);
  let data;
  let error;
  try {
    ({ data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName, username } },
    }));
  } finally {
    setAuthActionBusy(false);
  }
  if (error) {
    alert(`Nao consegui criar conta: ${formatAuthError(error)}`);
    return;
  }
  if (!data.session) {
    alert("Conta criada. Se o Supabase pedir confirmacao, confirma o email e depois entra na app.");
    return;
  }
  await loadAccountState();
  await loadRemoteState();
  showView("account");
  updateAccessUi();
  render();
}

async function resolveLoginEmail(login) {
  const clean = String(login || "").trim();
  if (!clean) return "";
  if (clean.includes("@") || !remoteEnabled || !supabaseClient) return clean.toLowerCase();
  const { data, error } = await supabaseClient.rpc("email_for_login", { login_value: clean });
  if (error) {
    console.warn("Login lookup failed", error);
    return "";
  }
  return data || "";
}

async function requestPasswordReset() {
  if (!remoteEnabled || !supabaseClient) {
    alert("Configura primeiro o Supabase.");
    return;
  }
  if (authActionBusy) return;
  const login = prompt("Email ou username para recuperar password:");
  if (!login) {
    alert("Escreve o email ou username da conta.");
    return;
  }
  const email = await resolveLoginEmail(login);
  if (!email) {
    alert("Nao encontrei esse email/username.");
    return;
  }
  const redirectTo = window.location.href.split("#")[0].split("?")[0];
  setAuthActionBusy(true);
  let error;
  try {
    ({ error } = await supabaseClient.auth.resetPasswordForEmail(email, { redirectTo }));
  } finally {
    setAuthActionBusy(false);
  }
  if (error) {
    alert(`Nao consegui enviar recuperacao: ${formatAuthError(error)}`);
    return;
  }
  alert("Email de recuperacao enviado.");
}

function setAuthActionBusy(isBusy) {
  authActionBusy = isBusy;
  document.querySelectorAll("#account-signup, [data-account-signup], [data-password-reset]").forEach((button) => {
    button.disabled = isBusy;
    button.classList.toggle("is-busy", isBusy);
  });
}

function formatAuthError(error) {
  const message = String(error?.message || error || "").toLowerCase();
  if (message.includes("email rate limit") || message.includes("rate limit exceeded")) {
    return "o limite de emails de confirmacao/recuperacao foi atingido. Tenta novamente mais tarde ou pede ao organizador para configurar o SMTP no Supabase.";
  }
  if (message.includes("error sending confirmation email") || message.includes("error sending recovery email")) {
    return "o Supabase tentou enviar o email, mas o SMTP falhou. Confirma no Supabase se o host, porta, username, API key e sender email do SendGrid estao corretos.";
  }
  if (message.includes("password")) {
    return "confirma se a password tem pelo menos 6 caracteres.";
  }
  if (message.includes("invalid login credentials")) {
    return "email/username ou password incorretos.";
  }
  if (message.includes("email not confirmed") || message.includes("not confirmed")) {
    return "este email ainda nao foi confirmado. Confirma o email recebido ou verifica no Supabase se a confirmacao esta ativa.";
  }
  if (message.includes("invalid email")) {
    return "confirma se o email esta bem escrito.";
  }
  if (message.includes("already registered") || message.includes("already exists")) {
    return "este email ja tem conta. Usa Entrar ou Recuperar password.";
  }
  return error?.message || "erro inesperado do Supabase.";
}

async function changeCurrentPassword() {
  if (!currentSession || !supabaseClient) {
    alert("Entra primeiro.");
    return;
  }
  const password = prompt("Nova password:");
  if (!password) return;
  const { error } = await supabaseClient.auth.updateUser({ password });
  if (error) {
    alert(`Nao consegui mudar password: ${error.message}`);
    return;
  }
  alert("Password alterada.");
}

async function setCurrentUsername() {
  if (!currentSession || !supabaseClient) {
    alert("Entra primeiro.");
    return;
  }
  const username = normalizeUsername(prompt("Novo username:", currentProfile?.username || "") || "");
  if (!username) {
    alert("Escolhe um username valido.");
    return;
  }
  const { data, error } = await supabaseClient
    .from("profiles")
    .update({ username, updated_at: new Date().toISOString() })
    .eq("id", currentSession.user.id)
    .select()
    .single();
  if (error) {
    const message = String(error.message || "").toLowerCase().includes("duplicate")
      ? "Esse username ja esta em uso."
      : `Nao consegui guardar username: ${error.message}`;
    alert(message);
    return;
  }
  currentProfile = data;
  knownProfiles = knownProfiles.map((profile) => profile.id === data.id ? data : profile);
  updateAccessUi();
  render();
}

async function unlinkOwnPlayerProfile() {
  const linkedPlayer = getLinkedPlayer();
  if (!linkedPlayer) {
    alert("Esta conta nao tem perfil associado.");
    return;
  }
  if (!confirm(`Desassociar a tua conta do perfil ${linkedPlayer.name}?`)) return;
  await unlinkPlayerProfile(linkedPlayer.id);
}

async function adminLogout() {
  if (supabaseClient) await supabaseClient.auth.signOut();
  isAdmin = false;
  currentSession = null;
  currentProfile = null;
  knownProfiles = [];
  playerClaims = [];
  updateAccessUi();
  render();
}

function on(element, eventName, handler) {
  if (element) element.addEventListener(eventName, handler);
}

function showView(viewName, options = {}) {
  if (viewName !== "today") {
    previewGame = null;
  }
  currentViewName = viewName;
  const activeTabName = viewName === "history-game" ? "games" : viewName;
  els.tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.view === activeTabName));
  els.views.forEach((view) => view.classList.toggle("active", view.id === `view-${viewName}`));
  if (navigationHistoryReady && options.push !== false) {
    pushNavigationState();
  }
}

function setupNavigationHistory() {
  if (navigationHistoryReady || !window.history?.pushState) return;
  navigationHistoryReady = true;
  history.replaceState({ footerExitGuard: true }, "", location.href);
  history.pushState(captureNavigationState(), "", location.href);
  window.addEventListener("popstate", handleNavigationPopState);
}

function captureNavigationState() {
  return {
    footerApp: true,
    viewName: currentViewName,
    currentPlayerProfileId,
    currentGameId,
    currentHistoryGameId,
  };
}

function pushNavigationState() {
  history.pushState(captureNavigationState(), "", location.href);
}

function handleNavigationPopState(event) {
  if (event.state?.footerExitGuard) {
    if (confirm("Queres sair do Footer?")) {
      history.back();
    } else {
      history.pushState(captureNavigationState(), "", location.href);
    }
    return;
  }

  if (!event.state?.footerApp) {
    if (!confirm("Queres sair do Footer?")) {
      history.pushState(captureNavigationState(), "", location.href);
    }
    return;
  }

  currentPlayerProfileId = event.state.currentPlayerProfileId || currentPlayerProfileId;
  currentGameId = event.state.currentGameId || null;
  currentHistoryGameId = event.state.currentHistoryGameId || null;
  showView(event.state.viewName || "events", { push: false });
  render();
}

function render() {
  ensureGameDateInput();
  renderPlayerList();
  renderPlayersTable();
  renderCurrentGame();
  renderGamesList();
  renderHistoryGameDetail();
  renderAccountPanel();
  renderClaimsList();
  renderAccountsList();
  renderPaymentsPanel();
  renderStatsPanel();
  renderEventsList();
  renderPlayerProfile();
  renderMvpVoteGate();
}

function getLinkedPlayer() {
  if (!currentSession?.user) return null;
  return [...state.players]
    .filter((playerData) => playerData.linkedUserId === currentSession.user.id)
    .sort((a, b) => a.name.localeCompare(b.name))[0] || null;
}

function getMyPendingClaim() {
  if (!currentSession?.user) return null;
  return playerClaims.find((claim) => claim.user_id === currentSession.user.id && claim.status === "pending") || null;
}

function renderAccountPanel() {
  if (!els.accountPanel) return;
  if (!remoteEnabled) {
    els.accountPanel.innerHTML = `<div class="empty-state">Configura o Supabase para usar contas e perfis.</div>`;
    return;
  }

  if (!currentSession?.user) {
    els.accountPanel.innerHTML = `
      <div class="account-card">
        <h3>Entra ou cria conta</h3>
        <p>Depois de entrares, podes associar a tua conta ao perfil de jogador que ja existe na base.</p>
        <div class="actions">
          <button class="primary-btn" data-account-login>Entrar</button>
          <button class="ghost-btn" data-account-signup>Criar conta</button>
          <button class="ghost-btn" data-password-reset>Recuperar password</button>
        </div>
      </div>
    `;
    bindAccountPanelActions();
    return;
  }

  const user = currentSession.user;
  const linkedPlayer = getLinkedPlayer();
  const pendingClaim = getMyPendingClaim();
  const availablePlayers = state.players
    .filter((p) => !p.isGuest && !p.linkedUserId)
    .sort((a, b) => a.name.localeCompare(b.name));

  if (linkedPlayer) {
    const form = getPlayerForm(linkedPlayer);
    els.accountPanel.innerHTML = `
      <div class="account-card good-card">
        <div>
          <p class="eyebrow">${isAdmin ? "Admin" : "Jogador"}</p>
          <h3>${escapeHtml(linkedPlayer.name)}</h3>
          <p>${escapeHtml(user.email || "")}</p>
          <p>Username: <strong>${escapeHtml(currentProfile?.username || "por definir")}</strong></p>
        </div>
        <div class="profile-summary">
          ${renderAvatar(linkedPlayer)}
          <strong>${canSeeCurrentRatings() ? form.currentRating : linkedPlayer.overall}</strong>
          <span>${canSeeCurrentRatings() ? renderFormChip(form) : renderFormSign(form)}</span>
        </div>
        <div class="actions">
          <label class="file-btn">
            Alterar foto
            <input data-own-player-photo type="file" accept="image/*">
          </label>
        </div>
        ${renderSecurityActions()}
      </div>
    `;
    els.accountPanel.querySelector("[data-own-player-photo]")?.addEventListener("change", handleOwnPlayerPhotoSelection);
    bindAccountPanelActions();
    return;
  }

  if (pendingClaim) {
    const playerData = findPlayer(pendingClaim.player_id);
    els.accountPanel.innerHTML = `
      <div class="account-card warn-card">
        <h3>Pedido pendente</h3>
        <p>Pediste para associar esta conta ao perfil ${escapeHtml(playerData?.name || "selecionado")}. Aguarda aprovacao do admin.</p>
        ${renderSecurityActions()}
      </div>
    `;
    bindAccountPanelActions();
    return;
  }

  els.accountPanel.innerHTML = `
    <div class="account-card">
      <h3>Associar conta a jogador</h3>
      <p>Escolhe o teu perfil. O admin vai aprovar antes de ficares ligado oficialmente.</p>
      ${renderSecurityActions()}
      <div class="claim-grid">
        ${availablePlayers.map((p) => `
          <button class="claim-card" data-claim-player="${p.id}">
            ${renderAvatar(p)}
            <span>
              <strong>${escapeHtml(p.name)}</strong>
              <small>OVR ${p.overall}</small>
            </span>
          </button>
        `).join("") || `<div class="hint">Nao ha perfis livres para reclamar.</div>`}
      </div>
    </div>
  `;

  els.accountPanel.querySelectorAll("[data-claim-player]").forEach((button) => {
    button.addEventListener("click", () => requestPlayerClaim(button.dataset.claimPlayer));
  });
  bindAccountPanelActions();
}

function renderSecurityActions() {
  return `
    <div class="actions account-actions">
      <button class="ghost-btn" data-set-username>Definir username</button>
      <button class="ghost-btn" data-change-password>Mudar password</button>
      <button class="danger-btn" data-unlink-own-player>Desassociar perfil</button>
    </div>
  `;
}

async function handleOwnPlayerPhotoSelection(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const linkedPlayer = getLinkedPlayer();
  if (!linkedPlayer) {
    alert("Esta conta nao tem perfil de jogador associado.");
    return;
  }
  try {
    const photoDataUrl = await resizePhoto(file);
    await updateOwnPlayerPhoto(linkedPlayer.id, photoDataUrl);
  } catch (error) {
    alert(`Nao consegui atualizar a foto: ${error.message}`);
  } finally {
    event.target.value = "";
  }
}

async function updateOwnPlayerPhoto(playerId, photoDataUrl) {
  const playerIndex = state.players.findIndex((playerData) => playerData.id === playerId);
  if (playerIndex < 0) return;
  const updatedPlayer = { ...state.players[playerIndex], photoDataUrl };
  state.players[playerIndex] = updatedPlayer;
  saveState();

  if (remoteEnabled && supabaseClient) {
    const { error } = await supabaseClient
      .from("players")
      .update({
        photo_data_url: photoDataUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", playerId);
    if (error) throw error;
  }

  render();
}

function openPlayerProfile(playerId) {
  const playerData = findPlayer(playerId);
  if (!playerData) return;
  currentPlayerProfileId = playerId;
  showView("player-profile");
  renderPlayerProfile();
}

function renderPlayerProfile() {
  if (!els.playerProfile) return;
  const playerData = currentPlayerProfileId ? findPlayer(currentPlayerProfileId) : null;
  if (!playerData) {
    els.playerProfile.innerHTML = `
      <div class="empty-state">Escolhe um jogador na convocatoria, no gerador ou na lista de jogadores.</div>
    `;
    return;
  }
  const summary = getPlayerMatchSummary(playerData.id);
  const finishedGames = summary.games.filter((item) => item.outcome !== "open").length;
  const winRate = finishedGames ? Math.round((summary.wins / finishedGames) * 100) : 0;
  const account = playerData.linkedUserId ? knownProfiles.find((item) => item.id === playerData.linkedUserId) : null;
  const form = getPlayerForm(playerData);
  const synergies = getPlayerSynergies(playerData.id);
  const variant = getPlayerCardVariant(playerData, form);
  const teamRecentItems = getPlayerTeamRecord(playerData.id, PROFILE_HISTORY_LIMIT);
  const teamRecentRecord = teamRecentItems.map((item) => item.outcome);
  const playerRecentItems = getPlayerAppearanceRecord(playerData.id, PROFILE_HISTORY_LIMIT);
  const playerRecentRecord = playerRecentItems.map((item) => item.outcome);
  const awardAudit = getPlayerWinAwardAudit(playerData.id);
  const awards = getPlayerAwardShowcase(playerData);

  els.playerProfile.innerHTML = `
    <div class="player-profile-head">
      <div class="player-profile-card-wrap player-profile-card-hero">
        ${renderPlayerCard(playerData, { mode: "profile", form, variant })}
      </div>
    </div>

    <section class="profile-section">
      <h3>Historico</h3>
      ${renderHistorySummaryCard(summary, winRate)}
      <div class="recent-summary-grid">
        ${renderSummaryCard("Ult. 20 equipa", renderRecordDots(teamRecentRecord, { chronological: true, wrap: true }))}
        ${renderSummaryCard("Ult. 20 jogador", renderRecordDots(playerRecentRecord, { chronological: true, wrap: true }))}
      </div>
    </section>

    <section class="profile-section">
      <h3>Auditoria de cartas</h3>
      <div class="award-audit-grid">
        <article class="award-audit-card">
          <span>Sequencia atual</span>
          <strong>${awardAudit.currentWinStreak} vitorias</strong>
          <small>Jogos consecutivos da equipa com presenca e vitoria.</small>
        </article>
        <article class="award-audit-card">
          <span>Melhor sequencia valida</span>
          <strong>${awardAudit.bestWinStreak} vitorias</strong>
          <small>Melhor serie historica sem faltas pelo meio.</small>
        </article>
        <article class="award-audit-card">
          <span>Forma por participacoes</span>
          <strong>${awardAudit.bestWinsInFive}/5</strong>
          <small>Melhor janela de 5 jogos em que participou.</small>
        </article>
      </div>
    </section>

    <section class="profile-section">
      <div class="section-title-row">
        <h3>Montra de premios</h3>
        <span class="unlock-progress">${awards.length}/${getTotalAwardCardTypes()} cartas desbloqueadas</span>
      </div>
      ${awards.length ? `
        <div class="award-grid">
          ${awards.map((award) => renderAwardShowcaseCard(playerData, award)).join("")}
        </div>
      ` : `<div class="empty-state compact">Ainda nao ha cartas especiais registadas.</div>`}
    </section>

    <section class="profile-section">
      <h3>Melhores sinergias</h3>
      ${synergies.length ? `
        <div class="synergy-grid">
          ${synergies.map((item) => renderSynergyCard(item)).join("")}
        </div>
      ` : `<div class="empty-state compact">Ainda nao ha jogos suficientes para medir sinergias.</div>`}
    </section>

    <section class="profile-section">
      <h3>Ultimos 20 da equipa</h3>
      ${teamRecentItems.length ? `
        <div class="profile-games">
          ${teamRecentItems.map((item) => renderTeamRecentGameRow(item)).join("")}
        </div>
      ` : `<div class="empty-state">Ainda nao ha jogos finalizados.</div>`}
    </section>

    <section class="profile-section">
      <h3>Ultimos 20 jogos do jogador</h3>
      ${playerRecentItems.length ? `
        <div class="profile-games">
          ${playerRecentItems.map((item) => renderPlayerGameRow(item)).join("")}
        </div>
      ` : `<div class="empty-state">Ainda nao ha jogos registados para este jogador.</div>`}
    </section>

    <section class="profile-section player-identity-section">
      <h3>Perfil</h3>
      <div class="player-identity-card">
        <p class="eyebrow">${playerData.isGuest ? "Convidado" : account ? "Perfil ligado" : "Jogador"}</p>
        <strong>${escapeHtml(playerData.name)}</strong>
        ${account ? `<span>${escapeHtml(account.email || account.username || "")}</span>` : ""}
      </div>
    </section>
  `;

  els.playerProfile.querySelectorAll("[data-open-player]").forEach((button) => {
    button.addEventListener("click", () => openPlayerProfile(button.dataset.openPlayer));
  });
  els.playerProfile.querySelectorAll("[data-profile-open-game]").forEach((button) => {
    button.addEventListener("click", () => {
      const game = state.games.find((item) => item.id === button.dataset.profileOpenGame);
      if (isFinishedGame(game)) {
        currentHistoryGameId = game.id;
        currentGameId = null;
        showView("history-game");
        renderHistoryGameDetail();
        return;
      }
      currentGameId = game?.id || button.dataset.profileOpenGame;
      currentHistoryGameId = null;
      showView("today");
      renderCurrentGame();
    });
  });
  els.playerProfile.querySelectorAll("[data-award-key]").forEach((card) => {
    const openAward = () => {
      const award = PLAYER_CARD_VARIANTS[card.dataset.awardKey];
      if (!award) return;
      showAwardDetail(playerData, award, Number(card.dataset.awardCount || 1));
    };
    card.addEventListener("click", openAward);
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openAward();
      }
    });
  });
}

function renderProfileStat(label, value) {
  return `
    <div class="profile-stat">
      <span>${label}</span>
      <strong>${value}</strong>
    </div>
  `;
}

function renderHistorySummaryCard(summary, winRate) {
  return `
    <div class="history-summary-card">
      <div>
        <span>Jogos</span>
        <strong>${summary.appearances}</strong>
      </div>
      <dl>
        <div><dt>V</dt><dd>${summary.wins}</dd></div>
        <div><dt>E</dt><dd>${summary.draws}</dd></div>
        <div><dt>D</dt><dd>${summary.losses}</dd></div>
        <div><dt>Wrate</dt><dd>${winRate}%</dd></div>
      </dl>
    </div>
  `;
}

function renderSummaryCard(label, value) {
  return `
    <div class="summary-card">
      <span>${label}</span>
      <strong>${value}</strong>
    </div>
  `;
}

function renderAwardShowcaseCard(playerData, award) {
  const variant = PLAYER_CARD_VARIANTS[award.key] || PLAYER_CARD_VARIANTS.base;
  return `
    <article class="award-card" data-award-key="${variant.key}" data-award-count="${award.count}" tabindex="0" role="button" aria-label="${escapeHtml(variant.label)}">
      <div class="award-card-preview">
        ${renderPlayerCard(playerData, { mode: "award", variant })}
        <span class="award-count">x${award.count}</span>
      </div>
      <strong>${escapeHtml(variant.label)}</strong>
    </article>
  `;
}

function getTotalAwardCardTypes() {
  return Object.keys(PLAYER_CARD_VARIANTS).filter(isShowcaseAwardKey).length;
}

function showAwardDetail(playerData, award, count = 1) {
  const variant = PLAYER_CARD_VARIANTS[award.key] || PLAYER_CARD_VARIANTS.base;
  const existing = document.querySelector(".award-modal");
  if (existing) existing.remove();
  const modal = document.createElement("div");
  modal.className = "award-modal";
  modal.innerHTML = `
    <div class="award-modal-backdrop" data-close-award></div>
    <section class="award-modal-panel" role="dialog" aria-modal="true" aria-label="${escapeHtml(variant.label)}">
      <button class="award-modal-close" data-close-award type="button" aria-label="Fechar">x</button>
      <div class="award-modal-card">
        ${renderPlayerCard(playerData, { mode: "profile", variant })}
        <span class="award-count award-count-large">x${count}</span>
      </div>
      <div class="award-modal-copy">
        <p class="eyebrow">Premio</p>
        <h3>${escapeHtml(variant.label)}</h3>
        <p>${escapeHtml(variant.description || "Carta especial obtida pelo jogador.")}</p>
      </div>
    </section>
  `;
  document.body.appendChild(modal);
  const handleKey = (event) => {
    if (event.key === "Escape") {
      close();
    }
  };
  const close = () => {
    modal.remove();
    window.removeEventListener("keydown", handleKey);
  };
  modal.querySelectorAll("[data-close-award]").forEach((button) => button.addEventListener("click", close));
  window.addEventListener("keydown", handleKey);
}

function addAwardCount(counts, key, amount = 1) {
  if (!isShowcaseAwardKey(key)) return;
  counts.set(key, (counts.get(key) || 0) + amount);
}

function isShowcaseAwardKey(key) {
  return Boolean(PLAYER_CARD_VARIANTS[key] && !FIELD_ONLY_CARD_KEYS.has(key));
}

function getAwardsUnlockedByGame(playerId, game) {
  if (!isFinishedGame(game) || !getPlayerParticipation(game, playerId)) return [];
  const orderedGames = getFinishedGamesAsc(state.games);
  const targetIndex = orderedGames.findIndex((item) => item.id === game.id);
  if (targetIndex < 0) return [];
  const gamesUntilBefore = orderedGames.slice(0, targetIndex);
  const gamesUntilThis = orderedGames.slice(0, targetIndex + 1);
  const before = new Set(getAwardKeysForGames(playerId, gamesUntilBefore));
  return getAwardKeysForGames(playerId, gamesUntilThis)
    .filter((key) => !before.has(key))
    .filter(isShowcaseAwardKey)
    .map((key) => PLAYER_CARD_VARIANTS[key])
    .filter(Boolean);
}

function getAwardKeysForGames(playerId, games) {
  const counts = new Map();
  const audit = getPlayerWinAwardAudit(playerId, games);
  for (let streak = 1; streak <= Math.min(audit.bestWinStreak, 5); streak += 1) {
    addAwardCount(counts, `win_${streak}x`);
  }

  const appearances = getPlayerAppearanceRecord(playerId, Number.MAX_SAFE_INTEGER, games).reverse();
  appearances.forEach((item, index) => {
    const windowItems = appearances.slice(Math.max(0, index - 4), index + 1);
    if (windowItems.length === FORM_LOOKBACK_GAMES) {
      const wins = windowItems.filter((entry) => entry.outcome === "win").length;
      if (wins >= 5) addAwardCount(counts, "form_5w_5");
      else if (wins >= 4) addAwardCount(counts, "form_4w_5");
      else if (wins >= 3) addAwardCount(counts, "form_3w_5");
    }
  });

  return [...counts.keys()];
}

function getFinishedGamesAsc(games = state.games) {
  return [...games].filter(isFinishedGame).sort((a, b) => {
    const timeDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
    return timeDiff || String(a.id).localeCompare(String(b.id));
  });
}

function getFinishedGamesDesc(games = state.games) {
  return [...games].filter(isFinishedGame).sort((a, b) => {
    const timeDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
    return timeDiff || String(b.id).localeCompare(String(a.id));
  });
}

function getPlayerTeamRecord(playerId, limit = PROFILE_HISTORY_LIMIT, games = state.games) {
  return getFinishedGamesDesc(games)
    .slice(0, limit)
    .map((game) => {
      const participation = getPlayerParticipation(game, playerId);
      return {
        game,
        participation,
        outcome: participation ? getPlayerOutcome(game, participation.side) : "absent",
      };
    });
}

function getPlayerAppearanceRecord(playerId, limit = PROFILE_HISTORY_LIMIT, games = state.games) {
  return getFinishedGamesDesc(games)
    .map((game) => {
      const participation = getPlayerParticipation(game, playerId);
      if (!participation) return null;
      return {
        game,
        participation,
        side: participation.side,
        teamLabel: participation.teamLabel,
        wasBench: participation.wasBench,
        outcome: getPlayerOutcome(game, participation.side),
      };
    })
    .filter(Boolean)
    .slice(0, limit);
}

function getPlayerWinAwardAudit(playerId, games = state.games) {
  let currentWinStreak = 0;
  let bestWinStreak = 0;
  let runningWinStreak = 0;
  const finishedAsc = getFinishedGamesAsc(games);

  finishedAsc.forEach((game) => {
    const participation = getPlayerParticipation(game, playerId);
    if (!participation || getPlayerOutcome(game, participation.side) !== "win") {
      runningWinStreak = 0;
      return;
    }
    runningWinStreak += 1;
    bestWinStreak = Math.max(bestWinStreak, runningWinStreak);
  });

  for (const game of getFinishedGamesDesc(games)) {
    const participation = getPlayerParticipation(game, playerId);
    if (!participation || getPlayerOutcome(game, participation.side) !== "win") break;
    currentWinStreak += 1;
  }

  const appearancesAsc = getPlayerAppearanceRecord(playerId, Number.MAX_SAFE_INTEGER, games).reverse();
  let bestWinsInFive = 0;
  appearancesAsc.forEach((item, index) => {
    const windowItems = appearancesAsc.slice(Math.max(0, index - 4), index + 1);
    if (windowItems.length === FORM_LOOKBACK_GAMES) {
      bestWinsInFive = Math.max(bestWinsInFive, windowItems.filter((entry) => entry.outcome === "win").length);
    }
  });

  return { currentWinStreak, bestWinStreak, bestWinsInFive };
}

function getPlayerAwardShowcase(playerData) {
  const counts = new Map();
  const appearances = getPlayerFinishedAppearances(playerData.id, state.games, "asc");

  if (!appearances.length) {
    addAwardCount(counts, "rookie");
  }

  const awardAudit = getPlayerWinAwardAudit(playerData.id);
  const cappedBestWinStreak = Math.min(awardAudit.bestWinStreak, 5);
  for (let streak = 1; streak <= cappedBestWinStreak; streak += 1) {
    addAwardCount(counts, `win_${streak}x`);
  }

  appearances.forEach((item, index) => {
    const windowItems = appearances.slice(Math.max(0, index - 4), index + 1);
    if (windowItems.length === FORM_LOOKBACK_GAMES) {
      const wins = windowItems.filter((entry) => entry.outcome === "win").length;
      if (wins >= 5) addAwardCount(counts, "form_5w_5");
      else if (wins >= 4) addAwardCount(counts, "form_4w_5");
      else if (wins >= 3) addAwardCount(counts, "form_3w_5");
    }
  });

  countPlayerMvpAwards(playerData.id, counts);
  countPlayerAttendanceAwards(playerData.id, counts);

  const form = getPlayerForm(playerData);
  if (form.adjustment >= 4) addAwardCount(counts, "rising");
  if (form.levelKey === "hot") addAwardCount(counts, "hot");
  if (form.levelKey === "bad" || form.levelKey === "recovery") addAwardCount(counts, "recovery");
  if (hasRecentReturn(playerData.id)) addAwardCount(counts, "return");
  if (hasRegularRecentAttendance(playerData.id)) addAwardCount(counts, "regular");
  if (!counts.size && appearances.length) addAwardCount(counts, "base");

  return [...counts.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => CARD_AWARD_PRIORITY.indexOf(a.key) - CARD_AWARD_PRIORITY.indexOf(b.key));
}

function countPlayerMvpAwards(playerId, counts) {
  let streak = 0;
  state.games
    .filter(isFinishedGame)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .forEach((game) => {
      const mvpIds = getOfficialMvpIdsForGame(game);
      if (mvpIds.has(playerId)) {
        streak += 1;
        addAwardCount(counts, "mvp");
        if (streak === 2) addAwardCount(counts, "mvp_2x");
        if (streak >= 3) addAwardCount(counts, "mvp_3x");
      } else {
        streak = 0;
      }
    });

  const months = new Set(state.games.filter((game) => isFinishedGame(game) && isMonthComplete(getMonthId(game.date))).map((game) => getMonthId(game.date)));
  months.forEach((monthId) => {
    if (getOfficialMvpWinnersByMonth(monthId).includes(playerId)) addAwardCount(counts, "mvp_month");
  });
}

function countPlayerSeasonAwards(playerId, counts) {
  const seasons = new Set(state.games.filter((game) => isFinishedGame(game) && isSeasonComplete(getSeasonId(game.date))).map((game) => getSeasonId(game.date)));
  seasons.forEach((seasonId) => {
    if (!getSeasonChampionIds(seasonId).includes(playerId)) return;
    const seasonKey = seasonId.split("-")[0];
    addAwardCount(counts, `champion_${seasonKey}`);
  });
}

function countPlayerAttendanceAwards(playerId, counts) {
  const months = new Set(state.games.filter((game) => isFinishedGame(game) && isMonthComplete(getMonthId(game.date))).map((game) => getMonthId(game.date)));
  months.forEach((monthId) => {
    const games = state.games.filter((game) => isFinishedGame(game) && getMonthId(game.date) === monthId);
    if (games.length >= 2 && games.every((game) => getPlayerParticipation(game, playerId))) addAwardCount(counts, "ironman_month");
    if (games.length >= 5 && games.filter((game) => getPlayerParticipation(game, playerId)).length / games.length >= 0.8) addAwardCount(counts, "regular");
  });

  const gamesAsc = [...state.games].filter(isFinishedGame).sort((a, b) => new Date(a.date) - new Date(b.date));
  for (let index = 3; index < gamesAsc.length; index += 1) {
    const absentBefore = gamesAsc.slice(index - 3, index).every((game) => !getPlayerParticipation(game, playerId));
    if (absentBefore && getPlayerParticipation(gamesAsc[index], playerId)) addAwardCount(counts, "return");
  }
}

function renderFormChip(form) {
  return `<span class="form-chip ${form.className}">${form.level} ${formatSigned(form.adjustment)}</span>`;
}

function renderFormSign(form, options = {}) {
  const className = form.adjustment > 0 ? "positive" : form.adjustment < 0 ? "negative" : "neutral";
  const label = options.compact ? formatSigned(form.adjustment) : `${formatSigned(form.adjustment)} forma`;
  return `<span class="form-sign ${className}">${label}</span>`;
}

function renderRatingBadge(playerData, form = getPlayerForm(playerData)) {
  const variant = getPlayerCardVariant(playerData, form);
  if (canSeeCurrentRatings()) {
    return `<span class="rating-badge admin-rating ${renderCardHaloClass(playerData, variant)}">${playerData.overall}&rarr;${form.currentRating}</span>`;
  }
  return `<span class="rating-badge public-rating ${renderCardHaloClass(playerData, variant)}"><strong>${playerData.overall}</strong>${renderFormSign(form, { compact: true })}</span>`;
}

function renderCardHaloClass(playerData, variant = getPlayerCardVariant(playerData)) {
  if (!playerData || !variant) return "";
  return `card-halo card-halo-${variant.key}`;
}

function getPlayerCardVariant(playerData, form = getPlayerForm(playerData), game = null) {
  if (!playerData) return PLAYER_CARD_VARIANTS.base;
  const award = getActivePlayerCardAward(playerData, form, game);
  return PLAYER_CARD_VARIANTS[award] || PLAYER_CARD_VARIANTS.base;
}

function isLightTextCardVariant(variant) {
  return ["hot", "mvp", "mvp_2x", "mvp_3x", "mvp_month", "champion_autumn", "champion_winter", "ironman_month"].includes(variant?.key);
}

function getCardTextColor(variant) {
  if (variant?.key === "ironman_month") return "#dfe4e7";
  return isLightTextCardVariant(variant) ? "#f8eecb" : "#201809";
}

function getActivePlayerCardAward(playerData, form = getPlayerForm(playerData), game = null) {
  if (!playerData) return "base";
  if (game) {
    const seasonChampionCard = getSeasonChampionCardKeyForGame(playerData.id, game);
    if (seasonChampionCard) return seasonChampionCard;

    const monthMvpCard = getMonthMvpCardKeyForGame(playerData.id, game);
    if (monthMvpCard) return monthMvpCard;

    const nextGameMvpIds = getNextGameMvpIds(game);
    if (nextGameMvpIds.has(playerData.id)) {
      return getMvpStreakCardKey(playerData.id, getPreviousFinishedGameFor(game));
    }
  }

  if (form.winStreak >= 5) return "win_5x";
  if (form.winStreak >= 4) return "win_4x";
  if (form.winStreak >= 3) return "win_3x";
  if (form.winStreak >= 2) return "win_2x";
  if (form.recentGamesCount >= FORM_LOOKBACK_GAMES && form.wins >= 5) return "form_5w_5";
  if (form.recentGamesCount >= FORM_LOOKBACK_GAMES && form.wins >= 4) return "form_4w_5";
  if (form.recentGamesCount >= FORM_LOOKBACK_GAMES && form.wins >= 3) return "form_3w_5";
  if (isLatestCompletedMonthIronman(playerData.id)) return "ironman_month";
  if (form.adjustment >= 4) return "rising";
  if (hasRecentReturn(playerData.id)) return "return";
  if (hasRegularRecentAttendance(playerData.id)) return "regular";
  if (!getPlayerFinishedAppearances(playerData.id).length) return "rookie";
  if (form.levelKey === "hot") return "hot";
  if (form.levelKey === "bad" || form.levelKey === "recovery") return "recovery";
  return "base";
}

function getLatestOfficialMvpIds() {
  const finishedGames = [...state.games]
    .filter(isFinishedGame)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  for (const game of finishedGames) {
    const winners = getOfficialMvpWinners(getMvpVoteCountsForGame(game.id));
    if (winners.length) return new Set(winners.map((playerData) => playerData.id));
  }

  return new Set();
}

function getPreviousFinishedGameFor(game) {
  if (!game?.date) return null;
  const gameTime = new Date(game.date).getTime();
  const finishedGames = [...state.games]
    .filter((item) => isFinishedGame(item) && item.id !== game.id)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  return finishedGames.find((item) => new Date(item.date).getTime() < gameTime) || null;
}

function getOfficialMvpIdsForGame(game) {
  if (!isMvpVotingClosed(game)) return new Set();
  const counts = getMvpVoteCountsForGame(game?.id);
  return new Set(getOfficialMvpWinners(counts).map((playerData) => playerData.id));
}

function getNextGameMvpIds(game) {
  const previousGame = getPreviousFinishedGameFor(game);
  if (!previousGame) return new Set();
  const mvpIds = getOfficialMvpIdsForGame(previousGame);
  if (!mvpIds.size) return new Set();
  const previousMvpPlaysThisGame = getGamePlayerIds(game).some((playerId) => mvpIds.has(playerId));
  return previousMvpPlaysThisGame ? mvpIds : new Set();
}

function getPlayerFinishedAppearances(playerId, games = state.games, direction = "desc") {
  return [...games]
    .filter(isFinishedGame)
    .sort((a, b) => direction === "asc" ? new Date(a.date) - new Date(b.date) : new Date(b.date) - new Date(a.date))
    .map((game) => {
      const participation = getPlayerParticipation(game, playerId);
      if (!participation) return null;
      return { game, ...participation, outcome: getPlayerOutcome(game, participation.side) };
    })
    .filter(Boolean);
}

function getMvpStreakCardKey(playerId, game) {
  const streak = getOfficialMvpStreakEndingAt(playerId, game);
  if (streak >= 3) return "mvp_3x";
  if (streak >= 2) return "mvp_2x";
  return "mvp";
}

function getOfficialMvpStreakEndingAt(playerId, game) {
  if (!game) return 0;
  const gameTime = new Date(game.date).getTime();
  let streak = 0;
  const finishedGames = [...state.games]
    .filter((item) => isFinishedGame(item) && new Date(item.date).getTime() <= gameTime)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  for (const item of finishedGames) {
    const ids = getOfficialMvpIdsForGame(item);
    if (!ids.size || !ids.has(playerId)) break;
    streak += 1;
  }
  return streak;
}

function getMonthId(value) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getSeasonInfo(value) {
  const date = new Date(value);
  const year = date.getFullYear();
  const springStart = getSeasonStart("spring", year);
  const summerStart = getSeasonStart("summer", year);
  const autumnStart = getSeasonStart("autumn", year);
  const winterStart = getSeasonStart("winter", year);

  if (date >= winterStart) return buildSeasonInfo("winter", year);
  if (date >= autumnStart) return buildSeasonInfo("autumn", year);
  if (date >= summerStart) return buildSeasonInfo("summer", year);
  if (date >= springStart) return buildSeasonInfo("spring", year);
  return buildSeasonInfo("winter", year - 1);
}

function getSeasonId(value) {
  const season = getSeasonInfo(value);
  return `${season.key}-${season.year}`;
}

function getSeasonChampionCardKey(value) {
  return `champion_${getSeasonInfo(value).key}`;
}

function buildSeasonInfo(key, year) {
  return { key, year, label: SEASON_DEFINITIONS[key]?.label || key };
}

function getSeasonStart(key, year) {
  const definition = SEASON_DEFINITIONS[key] || SEASON_DEFINITIONS.spring;
  return new Date(year, definition.startMonth, definition.startDay, 0, 0, 0, 0);
}

function getSeasonEndFromInfo(season) {
  const definition = SEASON_DEFINITIONS[season.key] || SEASON_DEFINITIONS.spring;
  const endYear = season.key === "winter" ? season.year + 1 : season.year;
  return new Date(endYear, definition.endMonth, definition.endDay, 0, 0, 0, 0);
}

function getMonthEnd(value) {
  const date = new Date(value);
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function getSeasonEnd(value) {
  const season = getSeasonInfo(value);
  return getSeasonEndFromInfo(season);
}

function isMonthComplete(monthId) {
  const games = state.games.filter((game) => monthKey(game.date) === monthId);
  if (!games.some(isFinishedGame)) return false;
  if (games.some((game) => !isFinishedGame(game))) return false;
  return getMonthEnd(monthIdToDate(monthId)).getTime() <= Date.now();
}

function isSeasonComplete(seasonId) {
  const games = state.games.filter((game) => getSeasonId(game.date) === seasonId);
  if (!games.some(isFinishedGame)) return false;
  if (games.some((game) => !isFinishedGame(game))) return false;
  return getSeasonEnd(seasonIdToDate(seasonId)).getTime() <= Date.now();
}

function getCompletedMonthIds() {
  return [...new Set(state.games.map((game) => monthKey(game.date)))]
    .filter(isMonthComplete)
    .sort();
}

function getLatestCompletedMonthId() {
  const months = getCompletedMonthIds();
  return months[months.length - 1] || null;
}

function monthIdToDate(monthId) {
  const [yearText, monthText] = String(monthId).split("-");
  const year = Number(yearText) || new Date().getFullYear();
  const month = Math.max(1, Math.min(12, Number(monthText) || 1));
  return new Date(year, month - 1, 1, 12);
}

function getNextMonthId(monthId) {
  const date = monthIdToDate(monthId);
  date.setMonth(date.getMonth() + 1);
  return getMonthId(date);
}

function getCompletedSeasonIds() {
  return [...new Set(state.games.map((game) => getSeasonId(game.date)))]
    .filter(isSeasonComplete)
    .sort((a, b) => getSeasonEnd(seasonIdToDate(a)) - getSeasonEnd(seasonIdToDate(b)));
}

function getLatestCompletedSeasonId() {
  const seasons = getCompletedSeasonIds();
  return seasons[seasons.length - 1] || null;
}

function seasonIdToDate(seasonId) {
  const [key, yearText] = seasonId.split("-");
  const year = Number(yearText) || new Date().getFullYear();
  return getSeasonStart(key, year);
}

function getLatestCompletedSeasonDate() {
  const seasonId = getLatestCompletedSeasonId();
  return seasonId ? seasonIdToDate(seasonId) : new Date();
}

function getOfficialMvpWinnersByMonth(monthId) {
  const rows = getMonthlyMvpRows(monthId);
  if (!rows.length) return [];
  const best = rows[0];
  return rows
    .filter((row) =>
      row.mvpCount === best.mvpCount &&
      row.wins === best.wins &&
      row.winRate === best.winRate
    )
    .map((row) => row.playerId);
}

function getMonthlyMvpRows(monthId) {
  const stats = new Map();
  const monthGames = state.games.filter((game) => isFinishedGame(game) && getMonthId(game.date) === monthId);

  monthGames.forEach((game) => {
    getGamePlayerIds(game).forEach((playerId) => {
      const participation = getPlayerParticipation(game, playerId);
      if (!participation) return;
      const row = stats.get(playerId) || { playerId, mvpCount: 0, games: 0, wins: 0, winRate: 0 };
      row.games += 1;
      if (getPlayerOutcome(game, participation.side) === "win") row.wins += 1;
      stats.set(playerId, row);
    });

    getOfficialMvpIdsForGame(game).forEach((playerId) => {
      const row = stats.get(playerId) || { playerId, mvpCount: 0, games: 0, wins: 0, winRate: 0 };
      row.mvpCount += 1;
      stats.set(playerId, row);
    });
  });

  return [...stats.values()]
    .filter((row) => row.mvpCount > 0)
    .map((row) => ({ ...row, winRate: row.games ? row.wins / row.games : 0 }))
    .sort((a, b) =>
      b.mvpCount - a.mvpCount ||
      b.wins - a.wins ||
      b.winRate - a.winRate
    );
}

function isCurrentMonthMvpLeader(playerId) {
  return getOfficialMvpWinnersByMonth(getMonthId(new Date())).includes(playerId);
}

function isLatestCompletedMonthMvpLeader(playerId) {
  const monthId = getLatestCompletedMonthId();
  return Boolean(monthId && getOfficialMvpWinnersByMonth(monthId).includes(playerId));
}

function getMonthMvpCardKeyForGame(playerId, game) {
  if (!game || !getPlayerParticipation(game, playerId)) return null;
  const gameMonthId = getMonthId(game.date);
  const monthId = getCompletedMonthIds()
    .filter((id) => getNextMonthId(id) === gameMonthId)
    .reverse()
    .find((id) => {
      if (!getOfficialMvpWinnersByMonth(id).includes(playerId)) return false;
      return isFirstPlayerGameAfterMonth(id, playerId, game);
    });
  return monthId ? "mvp_month" : null;
}

function isFirstPlayerGameAfterMonth(monthId, playerId, game) {
  const monthEndTime = getMonthEnd(monthIdToDate(monthId)).getTime();
  const gameTime = new Date(game.date).getTime();
  if (gameTime < monthEndTime || getMonthId(game.date) !== getNextMonthId(monthId) || !getPlayerParticipation(game, playerId)) return false;

  return !state.games.some((candidate) => {
    if (candidate.id === game.id || !getPlayerParticipation(candidate, playerId)) return false;
    const candidateTime = new Date(candidate.date).getTime();
    return candidateTime >= monthEndTime && candidateTime < gameTime && getMonthId(candidate.date) === getNextMonthId(monthId);
  });
}

function getSeasonChampionIds(seasonId) {
  const stats = new Map();
  state.games
    .filter((game) => isFinishedGame(game) && getSeasonId(game.date) === seasonId)
    .forEach((game) => {
      getGamePlayerIds(game).forEach((playerId) => {
        const participation = getPlayerParticipation(game, playerId);
        if (!participation) return;
        const record = stats.get(playerId) || { playerId, games: 0, wins: 0 };
        record.games += 1;
        if (getPlayerOutcome(game, participation.side) === "win") record.wins += 1;
        stats.set(playerId, record);
      });
    });

  const rows = [...stats.values()].filter((row) => row.wins > 0);
  if (!rows.length) return [];
  rows.sort((a, b) =>
    b.wins - a.wins ||
    (b.wins / b.games) - (a.wins / a.games) ||
    b.games - a.games ||
    (findPlayer(a.playerId)?.name || "").localeCompare(findPlayer(b.playerId)?.name || "")
  );
  const best = rows[0];
  return best ? [best.playerId] : [];
}

function getSeasonChampionCardKeyForGame(playerId, game) {
  if (!game || !getPlayerParticipation(game, playerId)) return null;
  const gameTime = new Date(game.date).getTime();
  const seasonId = getCompletedSeasonIds()
    .filter((id) => getSeasonEnd(seasonIdToDate(id)).getTime() <= gameTime)
    .reverse()
    .find((id) => {
      const championId = getSeasonChampionIds(id)[0];
      return championId === playerId && isFirstPlayerGameAfterSeason(id, playerId, game);
    });
  return seasonId ? `champion_${seasonId.split("-")[0]}` : null;
}

function isFirstPlayerGameAfterSeason(seasonId, playerId, game) {
  const seasonEndTime = getSeasonEnd(seasonIdToDate(seasonId)).getTime();
  const gameTime = new Date(game.date).getTime();
  if (gameTime < seasonEndTime || !getPlayerParticipation(game, playerId)) return false;

  return !state.games.some((candidate) => {
    if (candidate.id === game.id || !getPlayerParticipation(candidate, playerId)) return false;
    const candidateTime = new Date(candidate.date).getTime();
    return candidateTime >= seasonEndTime && candidateTime < gameTime;
  });
}

function isCurrentSeasonChampion(playerId) {
  return getSeasonChampionIds(getSeasonId(new Date())).includes(playerId);
}

function isLatestCompletedSeasonChampion(playerId) {
  const seasonId = getLatestCompletedSeasonId();
  return Boolean(seasonId && getSeasonChampionIds(seasonId).includes(playerId));
}

function isCurrentMonthIronman(playerId) {
  const monthId = getMonthId(new Date());
  const games = state.games.filter((game) => isFinishedGame(game) && getMonthId(game.date) === monthId);
  return games.length >= 2 && games.every((game) => getPlayerParticipation(game, playerId));
}

function isLatestCompletedMonthIronman(playerId) {
  const monthId = getLatestCompletedMonthId();
  if (!monthId) return false;
  const games = state.games.filter((game) => isFinishedGame(game) && getMonthId(game.date) === monthId);
  return games.length >= 2 && games.every((game) => getPlayerParticipation(game, playerId));
}

function hasRegularRecentAttendance(playerId) {
  const recentGames = [...state.games]
    .filter(isFinishedGame)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 10);
  if (recentGames.length < 5) return false;
  const attended = recentGames.filter((game) => getPlayerParticipation(game, playerId)).length;
  return attended / recentGames.length >= 0.8;
}

function hasRecentReturn(playerId) {
  const recentGames = [...state.games].filter(isFinishedGame).sort((a, b) => new Date(b.date) - new Date(a.date));
  if (!recentGames.length || !getPlayerParticipation(recentGames[0], playerId)) return false;
  return recentGames.slice(1, 4).length >= 3 && recentGames.slice(1, 4).every((game) => !getPlayerParticipation(game, playerId));
}

function canSeeCurrentRatings() {
  return canWriteOfficialData();
}

function formatSigned(value) {
  const number = Number(value) || 0;
  return number > 0 ? `+${number}` : String(number);
}

function renderRecordDots(record, options = {}) {
  if (!record.length) return `<span class="record-empty">Sem jogos</span>`;
  const labels = { win: "V", draw: "E", loss: "D", absent: "-" };
  const titles = { win: "Vitoria", draw: "Empate", loss: "Derrota", absent: "Nao jogou" };
  const visibleRecord = options.chronological ? [...record].reverse() : record;
  const wrapClass = options.wrap ? " record-dots-wrap" : "";
  return `<span class="record-dots${wrapClass}">${visibleRecord.map((outcome) => `<span class="record-dot ${outcome}" title="${titles[outcome] || ""}">${labels[outcome] || "-"}</span>`).join("")}</span>`;
}

function renderTeamRecentGameRow(item) {
  const resultText = item.participation ? getPlayerResultText(item.game, item.participation.side) : getGameResultText(item.game);
  const outcomeLabel = {
    win: "Vitoria",
    draw: "Empate",
    loss: "Derrota",
    absent: "Nao foi",
  }[item.outcome] || "Nao foi";
  const detail = item.participation
    ? `${item.participation.teamLabel}${item.participation.wasBench ? " suplente" : ""}`
    : "Ausente";
  return `
    <article class="profile-game-row">
      <div>
        <strong>${formatDate(item.game.date)} - ${resultText}</strong>
        <span>${detail}</span>
      </div>
      <span class="metric ${item.outcome === "win" ? "good-pill" : item.outcome === "loss" ? "warn-pill" : item.outcome === "absent" ? "muted-pill" : ""}">${outcomeLabel}</span>
      <button class="ghost-btn" data-profile-open-game="${item.game.id}">Abrir</button>
    </article>
  `;
}

function renderPlayerGameRow(item) {
  const resultText = getPlayerResultText(item.game, item.side);
  const outcomeLabel = {
    win: "Vitoria",
    draw: "Empate",
    loss: "Derrota",
    open: "Em aberto",
  }[item.outcome] || "Em aberto";
  return `
    <article class="profile-game-row">
      <div>
        <strong>${formatDate(item.game.date)} - ${resultText}</strong>
        <span>${item.teamLabel}${item.wasBench ? " suplente" : ""}</span>
      </div>
      <span class="metric ${item.outcome === "win" ? "good-pill" : item.outcome === "loss" ? "warn-pill" : ""}">${outcomeLabel}</span>
      <button class="ghost-btn" data-profile-open-game="${item.game.id}">Abrir</button>
    </article>
  `;
}

function renderSynergyCard(item) {
  const playerData = findPlayer(item.playerId);
  if (!playerData) return "";
  return `
    <article class="synergy-card">
      <button class="player-open-link ${renderCardHaloClass(playerData)}" data-open-player="${playerData.id}" type="button">${renderAvatar(playerData)}</button>
      <div>
        <strong>${escapeHtml(playerData.name)}</strong>
        <span>${item.wins}V em ${item.gamesTogether} jogos juntos</span>
        <small>${item.winMarginTotal > 0 ? `+${item.winMarginTotal}` : item.winMarginTotal} saldo da equipa nas vitorias</small>
      </div>
      <span class="metric good-pill">${item.winRate}%</span>
    </article>
  `;
}

function getPlayerMatchSummary(playerId) {
  const summary = {
    appearances: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    games: [],
  };

  [...state.games]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .forEach((game) => {
      const participation = getPlayerParticipation(game, playerId);
      if (!participation) return;
      summary.appearances += 1;
      const outcome = getPlayerOutcome(game, participation.side);
      if (outcome === "win") summary.wins += 1;
      if (outcome === "draw") summary.draws += 1;
      if (outcome === "loss") summary.losses += 1;
      summary.games.push({ game, ...participation, outcome });
    });

  return summary;
}

function getPlayerSynergies(playerId) {
  const byPlayer = new Map();

  state.games
    .filter(isFinishedGame)
    .forEach((game) => {
      const participation = getPlayerParticipation(game, playerId);
      if (!participation) return;
      const sameSideIds = getGameSidePlayerIds(game, participation.side).filter((id) => id !== playerId);
      const outcome = getPlayerOutcome(game, participation.side);
      const margin = outcome === "win" ? Math.max(0, getTeamGoalDiff(game, participation.side)) : 0;

      sameSideIds.forEach((teammateId) => {
        const stats = byPlayer.get(teammateId) || {
          playerId: teammateId,
          gamesTogether: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          winMarginTotal: 0,
        };
        stats.gamesTogether += 1;
        if (outcome === "win") {
          stats.wins += 1;
          stats.winMarginTotal += margin;
        }
        if (outcome === "draw") stats.draws += 1;
        if (outcome === "loss") stats.losses += 1;
        byPlayer.set(teammateId, stats);
      });
    });

  return [...byPlayer.values()]
    .map((stats) => ({
      ...stats,
      winRate: stats.gamesTogether ? Math.round((stats.wins / stats.gamesTogether) * 100) : 0,
      score: stats.wins * 12 + stats.winMarginTotal * 2 + stats.gamesTogether + (stats.gamesTogether ? stats.wins / stats.gamesTogether : 0),
    }))
    .sort((a, b) =>
      b.score - a.score ||
      b.wins - a.wins ||
      b.winMarginTotal - a.winMarginTotal ||
      b.gamesTogether - a.gamesTogether ||
      (findPlayer(a.playerId)?.name || "").localeCompare(findPlayer(b.playerId)?.name || "")
    )
    .slice(0, 4);
}

function getGameSidePlayerIds(game, side) {
  return side === "A"
    ? [...(game.teamA || []), ...(game.benchA || [])]
    : [...(game.teamB || []), ...(game.benchB || [])];
}

function getTeamGoalDiff(game, side) {
  if (game.scoreA == null || game.scoreB == null) return 0;
  const diff = Number(game.scoreA) - Number(game.scoreB);
  return side === "A" ? diff : -diff;
}

function getPlayerParticipation(game, playerId) {
  if ((game.teamA || []).includes(playerId)) return { side: "A", teamLabel: "Equipa A", wasBench: false };
  if ((game.teamB || []).includes(playerId)) return { side: "B", teamLabel: "Equipa B", wasBench: false };
  if ((game.benchA || []).includes(playerId)) return { side: "A", teamLabel: "Equipa A", wasBench: true };
  if ((game.benchB || []).includes(playerId)) return { side: "B", teamLabel: "Equipa B", wasBench: true };
  return null;
}

function getPlayerOutcome(game, side) {
  if (game.scoreA == null || game.scoreB == null) return "open";
  if (Number(game.scoreA) === Number(game.scoreB)) return "draw";
  const teamAWon = Number(game.scoreA) > Number(game.scoreB);
  return (side === "A" && teamAWon) || (side === "B" && !teamAWon) ? "win" : "loss";
}

function getFinishedGames(limit = null) {
  const games = [...state.games]
    .filter(isFinishedGame)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  return limit ? games.slice(0, limit) : games;
}

function getPlayerTeamRecentItems(playerId, limit = FORM_LOOKBACK_GAMES) {
  return getFinishedGames(limit).map((game) => {
    const participation = getPlayerParticipation(game, playerId);
    return {
      game,
      participation,
      outcome: participation ? getPlayerOutcome(game, participation.side) : "absent",
    };
  });
}

function getPlayerTeamRecentRecord(playerId, limit = FORM_LOOKBACK_GAMES) {
  return getPlayerTeamRecentItems(playerId, limit).map((item) => item.outcome);
}

function bindAccountPanelActions() {
  els.accountPanel?.querySelector("[data-account-login]")?.addEventListener("click", adminLogin);
  els.accountPanel?.querySelector("[data-account-signup]")?.addEventListener("click", createAccount);
  els.accountPanel?.querySelector("[data-password-reset]")?.addEventListener("click", requestPasswordReset);
  els.accountPanel?.querySelector("[data-change-password]")?.addEventListener("click", changeCurrentPassword);
  els.accountPanel?.querySelector("[data-set-username]")?.addEventListener("click", setCurrentUsername);
  els.accountPanel?.querySelector("[data-unlink-own-player]")?.addEventListener("click", unlinkOwnPlayerProfile);
}

function renderClaimsList() {
  if (!els.claimsList) return;
  if (!isAdmin) {
    els.claimsList.innerHTML = `<div class="empty-state">So admins conseguem ver pedidos.</div>`;
    return;
  }

  const pendingClaims = playerClaims.filter((claim) => claim.status === "pending");
  if (!pendingClaims.length) {
    els.claimsList.innerHTML = `<div class="empty-state">Nao ha pedidos pendentes.</div>`;
    return;
  }

  els.claimsList.innerHTML = pendingClaims.map((claim) => {
    const playerData = findPlayer(claim.player_id);
    const profile = knownProfiles.find((item) => item.id === claim.user_id);
    return `
      <article class="claim-row">
        <div>
          <strong>${escapeHtml(playerData?.name || "Jogador removido")}</strong>
          <span>${escapeHtml(profile?.display_name || profile?.email || claim.user_id)} - ${formatDate(claim.created_at)}</span>
        </div>
        <div class="actions">
          <button class="primary-btn" data-approve-claim="${claim.id}">Aprovar</button>
          <button class="danger-btn" data-reject-claim="${claim.id}">Rejeitar</button>
        </div>
      </article>
    `;
  }).join("");

  els.claimsList.querySelectorAll("[data-approve-claim]").forEach((button) => {
    button.addEventListener("click", () => reviewPlayerClaim(button.dataset.approveClaim, "approved"));
  });
  els.claimsList.querySelectorAll("[data-reject-claim]").forEach((button) => {
    button.addEventListener("click", () => reviewPlayerClaim(button.dataset.rejectClaim, "rejected"));
  });
}

function renderAccountsList() {
  if (!els.accountsList) return;
  if (!isAdmin) {
    els.accountsList.innerHTML = `<div class="empty-state">So admins conseguem ver contas.</div>`;
    return;
  }

  if (!knownProfiles.length) {
    els.accountsList.innerHTML = `<div class="empty-state">Ainda nao ha contas criadas.</div>`;
    return;
  }

  els.accountsList.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Username</th>
            <th>Email</th>
            <th>Role</th>
            <th>Jogador</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${knownProfiles.map((profile) => {
            const linkedPlayer = state.players.find((p) => p.linkedUserId === profile.id);
            return `
              <tr>
                <td><strong>${escapeHtml(profile.display_name || "-")}</strong></td>
                <td>${escapeHtml(profile.username || "-")}</td>
                <td>${escapeHtml(profile.email || "-")}</td>
                <td><span class="metric">${escapeHtml(profile.role || "player")}</span></td>
                <td>${linkedPlayer ? `${renderAvatar(linkedPlayer)} <strong>${escapeHtml(linkedPlayer.name)}</strong>` : "<span class=\"metric\">Sem perfil</span>"}</td>
                <td>
                  <button class="mini-btn" data-toggle-admin="${profile.id}">
                    ${profile.role === "admin" ? "Remover admin" : "Tornar admin"}
                  </button>
                </td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;

  els.accountsList.querySelectorAll("[data-toggle-admin]").forEach((button) => {
    button.addEventListener("click", () => toggleProfileAdminRole(button.dataset.toggleAdmin));
  });
}

function renderPaymentsPanel() {
  if (!els.paymentsPanel) return;
  if (!isAdmin) {
    els.paymentsPanel.innerHTML = `<div class="empty-state">So admins conseguem gerir pagamentos.</div>`;
    return;
  }

  const report = buildMonthlyPaymentReport(currentPaymentsMonth);
  const paymentOptions = report.rows
    .slice()
    .sort((a, b) => a.player.name.localeCompare(b.player.name))
    .map((row) => `<option value="${row.player.id}">${escapeHtml(row.player.name)} - saldo ${euro(row.currentBalance)}</option>`)
    .join("");
  els.paymentsPanel.innerHTML = `
    <div class="payments-toolbar">
      <label>
        Mes
        <input id="payments-month" type="month" value="${escapeHtml(currentPaymentsMonth)}">
      </label>
      <button class="ghost-btn" data-payments-whatsapp>WhatsApp</button>
    </div>

    <section class="payments-form primary-payment-form">
      <div class="payments-form-title">
        <strong>Registar pagamento ou ajuste</strong>
        <span>Usa divida para aumentar o saldo a pagar sem mexer nas presencas.</span>
      </div>
      <select data-payment-player>
        <option value="">Jogador</option>
        ${paymentOptions}
      </select>
      <input data-payment-amount type="number" min="0" step="0.5" placeholder="Valor">
      <input data-payment-date type="date" value="${escapeHtml(todayInputDate())}">
      <input data-payment-note placeholder="Nota">
      <div class="payments-form-actions">
        <button class="primary-btn" data-add-payment>Registar pagamento</button>
        <button class="ghost-btn" data-add-debt>Adicionar divida</button>
      </div>
    </section>

    <section class="payments-toolbar payments-cashbar">
        <label>
          Caixa registada
          <input data-finance-cash type="number" step="0.5" value="${financeSettings.cashBalance}">
        </label>
        <button class="ghost-btn" data-save-finance-settings>Guardar caixa</button>
    </section>

    <div class="finance-summary">
      ${renderSummaryCard("Jogos", report.games.length)}
      ${renderSummaryCard("Campo pago", euro(report.fieldCost))}
      ${renderSummaryCard("A cobrar", euro(report.totalDue))}
      ${renderSummaryCard("Recebido", euro(report.totalPaidMonth))}
      ${renderSummaryCard("Dif. caixa mes", euro(report.cashMonthDelta))}
      ${renderSummaryCard("Caixa", euro(financeSettings.cashBalance))}
    </div>

    ${renderGameFinanceControls(report)}

    <div class="table-wrap payments-table-wrap">
      <table class="payments-table">
        <colgroup>
          <col class="payment-name-col">
          ${report.games.map(() => `<col class="payment-game-col">`).join("")}
          <col class="payment-small-col">
          <col class="payment-money-col">
          <col class="payment-money-col">
          <col class="payment-balance-col">
          <col class="payment-balance-col">
        </colgroup>
        <thead>
          <tr>
            <th>Nome</th>
            ${report.games.map((game) => `<th>${dayOfMonth(game.date)}</th>`).join("")}
            <th>Idas</th>
            <th>A pagar</th>
            <th>Pag./aj.</th>
            <th>Saldo anterior</th>
            <th>Saldo atual</th>
          </tr>
        </thead>
        <tbody>
          ${report.rows.map((row) => renderPaymentRow(row, report.games)).join("")}
        </tbody>
      </table>
    </div>

    <section class="profile-section">
      <h3>Pagamentos do mes</h3>
      ${renderPaymentsHistory(report.monthPayments)}
    </section>
  `;

  els.paymentsPanel.querySelector("#payments-month")?.addEventListener("change", (event) => {
    currentPaymentsMonth = event.target.value || monthKey(new Date());
    renderPaymentsPanel();
  });
  els.paymentsPanel.querySelector("[data-save-finance-settings]")?.addEventListener("click", saveFinanceSettingsFromPanel);
  els.paymentsPanel.querySelector("[data-payments-whatsapp]")?.addEventListener("click", sharePaymentsOnWhatsApp);
  els.paymentsPanel.querySelector("[data-add-payment]")?.addEventListener("click", () => addManualPayment("payment"));
  els.paymentsPanel.querySelector("[data-add-debt]")?.addEventListener("click", () => addManualPayment("debt"));
  els.paymentsPanel.querySelectorAll("[data-open-payment-player]").forEach((button) => {
    button.addEventListener("click", () => openPlayerProfile(button.dataset.openPaymentPlayer));
  });
  els.paymentsPanel.querySelectorAll("[data-attendance-game]").forEach((input) => {
    input.addEventListener("change", () => updateAttendanceOverride(input.dataset.attendanceGame, input.dataset.attendancePlayer, input.checked));
  });
  els.paymentsPanel.querySelectorAll("[data-game-finance-toggle]").forEach((input) => {
    input.addEventListener("change", () => updateGameFinanceOverride(input.dataset.gameFinanceToggle, input.dataset.gameFinanceField, input.checked));
  });
  els.paymentsPanel.querySelectorAll("[data-game-field-cost]").forEach((input) => {
    input.addEventListener("change", () => updateGameFinanceOverride(input.dataset.gameFieldCost, "fieldCost", Number(input.value || 0)));
  });
  els.paymentsPanel.querySelectorAll("[data-edit-payment]").forEach((button) => {
    button.addEventListener("click", () => editPayment(button.dataset.editPayment));
  });
}

function renderStatsPanel() {
  if (!els.statsPanel) return;
  const rows = getPlayerHistoryStatsRows();
  const activeRows = rows.filter((row) => row.appearances > 0 || row.mvpCount > 0);
  const winRateBaseRows = activeRows.filter((row) => row.appearances >= 5);
  const winRateRows = (winRateBaseRows.length ? winRateBaseRows : activeRows)
    .slice()
    .sort(sortByWinRate)
    .slice(0, 5);
  const showDebtStats = canShowDebtStats();
  const currentDebts = showDebtStats ? getCurrentDebtRows().slice(0, 5) : [];
  const pairRows = getBestPairStats(5);
  const trioRows = getBestTrioStats(5);
  const goalEligibleRows = activeRows.filter((row) => row.appearances >= 5);
  const goalsForRows = goalEligibleRows.slice().sort(sortByGoalsForAverage).slice(0, 5);
  const goalsAgainstRows = goalEligibleRows.slice().sort(sortByGoalsAgainstAverage).slice(0, 5);
  const mvpHistoryRows = getMvpHistoryRows(10);

  if (!activeRows.length) {
    els.statsPanel.innerHTML = `<div class="empty-state">Ainda nao ha historico suficiente para gerar stats.</div>`;
    return;
  }

  const mostWins = activeRows.slice().sort(sortByWins)[0];
  const mostAppearances = activeRows.slice().sort(sortByAppearances)[0];
  const mostMvps = activeRows.slice().sort(sortByMvps)[0];
  const bestStreak = activeRows.slice().sort(sortByWinStreak)[0];

  els.statsPanel.innerHTML = `
    <section class="stats-arena">
      <div>
        <p class="eyebrow">Liga Footer</p>
        <h3>📊 Quadro de honra</h3>
        <span>Os destaques historicos do grupo, calculados pelos jogos finalizados.</span>
      </div>
      <div class="stats-arena-badges">
        <span>${activeRows.length} jogadores</span>
        <span>${getFinishedGames().length} jogos</span>
        <span>${mvpHistoryRows.length} MVPs fechados</span>
      </div>
    </section>

    <div class="stats-highlight-grid">
      ${renderStatsHighlight("🏆 Mais vitorias", mostWins?.wins || 0, mostWins ? mostWins.player : null, `${mostWins?.appearances || 0} presencas`)}
      ${renderStatsHighlight("👟 Mais presencas", mostAppearances?.appearances || 0, mostAppearances ? mostAppearances.player : null, `${mostAppearances?.wins || 0} vitorias`)}
      ${renderStatsHighlight("⭐ Mais MVPs", mostMvps?.mvpCount || 0, mostMvps ? mostMvps.player : null, `${mostMvps?.appearances || 0} jogos`)}
      ${renderStatsHighlight("🔥 Maior sequencia", bestStreak?.bestWinStreak || 0, bestStreak ? bestStreak.player : null, "vitorias seguidas")}
    </div>

    <div class="stats-rank-grid">
      ${renderStatsRanking("🏆 Mais vitorias", activeRows.slice().sort(sortByWins).slice(0, 5), (row) => `${row.wins}V em ${row.appearances} jogos`)}
      ${renderStatsRanking("📈 Melhor win rate", winRateRows, (row) => `${row.winRate}% (${row.wins}V/${row.appearances}J)`)}
      ${renderStatsRanking("👟 Mais presencas", activeRows.slice().sort(sortByAppearances).slice(0, 5), (row) => `${row.appearances} jogos`)}
      ${renderStatsRanking("⭐ Mais MVPs", activeRows.slice().sort(sortByMvps).slice(0, 5), (row) => `${row.mvpCount} MVP${row.mvpCount === 1 ? "" : "s"}`)}
      ${renderStatsRanking("🔥 Vitorias seguidas", activeRows.slice().sort(sortByWinStreak).slice(0, 5), (row) => `${row.bestWinStreak} seguidas`)}
      ${renderStatsRanking("⚽ Melhor media de golos marcados", goalsForRows, (row) => `${formatStatsAverage(row.goalsForAverage)} golos/jogo`, "Ainda nao ha jogadores com 5 jogos.")}
      ${renderStatsRanking("🛡️ Menor media de golos sofridos", goalsAgainstRows, (row) => `${formatStatsAverage(row.goalsAgainstAverage)} golos/jogo`, "Ainda nao ha jogadores com 5 jogos.")}
      ${showDebtStats ? renderDebtRanking(currentDebts) : renderDebtRankingUnavailable()}
      ${renderPairRanking(pairRows)}
      ${renderTrioRanking(trioRows)}
      ${renderMvpHistoryRanking(mvpHistoryRows)}
    </div>
  `;

  els.statsPanel.querySelectorAll("[data-open-stats-player]").forEach((button) => {
    button.addEventListener("click", () => openPlayerProfile(button.dataset.openStatsPlayer));
  });
}

function hasValidFinalScore(game) {
  return [game?.scoreA, game?.scoreB].every(
    (score) =>
      score !== null
      && score !== undefined
      && String(score).trim() !== ""
      && Number.isFinite(Number(score))
  );
}

function getPlayerHistoryStatsRows() {
  return state.players.map((playerData) => {
    const summary = getPlayerMatchSummary(playerData.id);
    const finishedGames = summary.games.filter(
      (item) => item.outcome !== "open" && hasValidFinalScore(item.game)
    );
    const appearances = finishedGames.length;
    const outcomes = finishedGames.reduce(
      (counts, item) => {
        if (item.outcome === "win") counts.wins += 1;
        if (item.outcome === "draw") counts.draws += 1;
        if (item.outcome === "loss") counts.losses += 1;
        return counts;
      },
      { wins: 0, draws: 0, losses: 0 }
    );
    const goalSummary = FooterStats.summarizePlayerGoals(
      finishedGames.map((item) => {
        const goalsFor = item.side === "A" ? Number(item.game.scoreA) : Number(item.game.scoreB);
        const goalsAgainst = item.side === "A" ? Number(item.game.scoreB) : Number(item.game.scoreA);
        return { playerId: playerData.id, goalsFor, goalsAgainst };
      })
    );
    const mvpCount = getFinishedGames().reduce((count, game) => count + (getOfficialMvpIdsForGame(game).has(playerData.id) ? 1 : 0), 0);
    const awardAudit = getPlayerWinAwardAudit(playerData.id);
    return {
      player: playerData,
      appearances,
      wins: outcomes.wins,
      draws: outcomes.draws,
      losses: outcomes.losses,
      winRate: appearances ? Math.round((outcomes.wins / appearances) * 100) : 0,
      mvpCount,
      bestWinStreak: awardAudit.bestWinStreak,
      goalsFor: goalSummary.goalsFor,
      goalsAgainst: goalSummary.goalsAgainst,
      goalsForAverage: goalSummary.averageGoalsFor,
      goalsAgainstAverage: goalSummary.averageGoalsAgainst,
    };
  });
}

function getCurrentDebtRows() {
  const report = buildMonthlyPaymentReport(monthKey(new Date()));
  return report.rows
    .filter((row) => row.currentBalance > 0)
    .sort((a, b) => b.currentBalance - a.currentBalance || a.player.name.localeCompare(b.player.name));
}

function canShowDebtStats() {
  return isAdmin;
}

function getFinishedTeamPerformances() {
  return getFinishedGames().filter(hasValidFinalScore).flatMap((game) =>
    ["A", "B"].map((side) => {
      const outcome = getPlayerOutcome(game, side);
      return {
        playerIds: getGameSidePlayerIds(game, side).filter((id) => findPlayer(id)).sort(),
        outcome,
        winMargin: outcome === "win" ? Math.max(0, getTeamGoalDiff(game, side)) : 0,
      };
    })
  );
}

function compareCanonicalIdKeys(aIds, bIds) {
  const aKey = aIds.map(String).join("::");
  const bKey = bIds.map(String).join("::");
  if (aKey < bKey) return -1;
  if (aKey > bKey) return 1;
  return 0;
}

function sortCombinationStats(a, b) {
  const numericDifference =
    b.score - a.score
    || b.wins - a.wins
    || b.winMarginTotal - a.winMarginTotal
    || b.gamesTogether - a.gamesTogether;
  if (numericDifference) return numericDifference;

  const compareNames = (left, right) => left.localeCompare(right, "pt-PT");
  const aNameKey = a.players.map((playerData) => playerData.name).sort(compareNames).join(" + ");
  const bNameKey = b.players.map((playerData) => playerData.name).sort(compareNames).join(" + ");
  return aNameKey.localeCompare(bNameKey, "pt-PT")
    || compareCanonicalIdKeys(a.playerIds, b.playerIds);
}

function getBestCombinationStats(groupSize, minimumGames, limit) {
  const ranking = FooterStats.buildCombinationRanking(
    getFinishedTeamPerformances(),
    groupSize,
    minimumGames,
    undefined,
    (playerId) => findPlayer(playerId)?.name
  )
    .map((stats) => ({
      ...stats,
      players: stats.playerIds.map(findPlayer).filter(Boolean),
    }))
    .filter((stats) => stats.players.length === groupSize)
    .sort(sortCombinationStats);

  return Number.isInteger(limit) ? ranking.slice(0, Math.max(0, limit)) : ranking;
}

function getBestPairStats(limit = 5) {
  return getBestCombinationStats(2, 2, limit);
}

function getBestTrioStats(limit = 5) {
  return getBestCombinationStats(3, 3, limit);
}

function getMvpHistoryRows(limit = 10) {
  return getFinishedGames()
    .map((game) => {
      const winners = [...getOfficialMvpIdsForGame(game)].map(findPlayer).filter(Boolean);
      return { game, winners, totalVotes: getMvpTotalVotes(game.id) };
    })
    .filter((row) => row.winners.length)
    .slice(0, limit);
}

function sortByWins(a, b) {
  return b.wins - a.wins || b.appearances - a.appearances || a.player.name.localeCompare(b.player.name);
}

function sortByWinRate(a, b) {
  return b.winRate - a.winRate || b.wins - a.wins || b.appearances - a.appearances || a.player.name.localeCompare(b.player.name);
}

function sortByAppearances(a, b) {
  return b.appearances - a.appearances || b.wins - a.wins || a.player.name.localeCompare(b.player.name);
}

function sortByMvps(a, b) {
  return b.mvpCount - a.mvpCount || b.wins - a.wins || a.player.name.localeCompare(b.player.name);
}

function sortByWinStreak(a, b) {
  return b.bestWinStreak - a.bestWinStreak || b.wins - a.wins || a.player.name.localeCompare(b.player.name);
}

function sortByGoalsForAverage(a, b) {
  return b.goalsForAverage - a.goalsForAverage
    || b.goalsFor - a.goalsFor
    || b.appearances - a.appearances
    || a.player.name.localeCompare(b.player.name, "pt-PT")
    || compareCanonicalIdKeys([a.player.id], [b.player.id]);
}

function sortByGoalsAgainstAverage(a, b) {
  return a.goalsAgainstAverage - b.goalsAgainstAverage
    || a.goalsAgainst - b.goalsAgainst
    || b.appearances - a.appearances
    || a.player.name.localeCompare(b.player.name, "pt-PT")
    || compareCanonicalIdKeys([a.player.id], [b.player.id]);
}

function formatStatsAverage(value) {
  return new Intl.NumberFormat("pt-PT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function renderStatsHighlight(label, value, playerData, detail) {
  return `
    <article class="stats-hero-card">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      ${playerData ? `<button class="stats-player-link" data-open-stats-player="${playerData.id}" type="button">${escapeHtml(playerData.name)}</button>` : "<em>-</em>"}
      <small>${escapeHtml(detail || "")}</small>
    </article>
  `;
}

function renderStatsRanking(title, rows, valueRenderer, emptyMessage = "Sem dados.") {
  return `
    <section class="stats-ranking-card">
      <h3>${escapeHtml(title)}</h3>
      <div class="stats-ranking-list">
        ${rows.length ? rows.map((row, index) => `
          <article class="stats-ranking-row stats-ranking-row-${index + 1}">
            <span class="stats-rank-number">${index + 1}</span>
            <button class="stats-player-link" data-open-stats-player="${row.player.id}" type="button">${escapeHtml(row.player.name)}</button>
            <strong>${escapeHtml(valueRenderer(row))}</strong>
          </article>
        `).join("") : `<div class="empty-state compact">${escapeHtml(emptyMessage)}</div>`}
      </div>
    </section>
  `;
}

function renderDebtRanking(rows) {
  return `
    <section class="stats-ranking-card">
      <h3>💸 Maior caloteiro atual</h3>
      <div class="stats-ranking-list">
        ${rows.length ? rows.map((row, index) => `
          <article class="stats-ranking-row stats-ranking-row-${index + 1}">
            <span class="stats-rank-number">${index + 1}</span>
            <button class="stats-player-link" data-open-stats-player="${row.player.id}" type="button">${escapeHtml(row.player.name)}</button>
            <strong>${euro(row.currentBalance)}</strong>
          </article>
        `).join("") : `<div class="empty-state compact">Ninguem em divida neste mes.</div>`}
      </div>
    </section>
  `;
}

function renderDebtRankingUnavailable() {
  return `
    <section class="stats-ranking-card">
      <h3>ðŸ’¸ Maior caloteiro atual</h3>
      <div class="stats-ranking-list">
        <div class="empty-state compact">Ranking financeiro disponivel so para admins.</div>
      </div>
    </section>
  `;
}

function renderPairRanking(rows) {
  return `
    <section class="stats-ranking-card">
      <h3>🤝 Melhor dupla</h3>
      <div class="stats-ranking-list">
        ${rows.length ? rows.map((row, index) => `
          <article class="stats-ranking-row stats-combination-row stats-ranking-row-${index + 1}">
            <span class="stats-rank-number">${index + 1}</span>
            <span class="stats-combination-names">${renderCombinationMembers(row.players)}</span>
            <strong>${row.winRate}% (${row.wins}V/${row.gamesTogether}J)</strong>
          </article>
        `).join("") : `<div class="empty-state compact">Ainda nao ha duplas com 2 jogos.</div>`}
      </div>
    </section>
  `;
}

function renderCombinationMembers(players) {
  return players.map((playerData, index) => `
    <span class="stats-combination-member">
      ${index ? '<span class="stats-combination-separator" aria-hidden="true">+</span>' : ""}
      <button class="stats-player-link" data-open-stats-player="${playerData.id}" type="button">${escapeHtml(playerData.name)}</button>
    </span>
  `).join("");
}

function renderTrioRanking(rows) {
  return `
    <section class="stats-ranking-card">
      <h3>🤝 Melhores triplas</h3>
      <div class="stats-ranking-list">
        ${rows.length ? rows.map((row, index) => `
          <article class="stats-ranking-row stats-combination-row stats-ranking-row-${index + 1}">
            <span class="stats-rank-number">${index + 1}</span>
            <span class="stats-combination-names">${renderCombinationMembers(row.players)}</span>
            <strong>${row.winRate}% (${row.wins}V/${row.gamesTogether}J)</strong>
          </article>
        `).join("") : `<div class="empty-state compact">Ainda nao ha triplas com 3 jogos.</div>`}
      </div>
    </section>
  `;
}

function renderMvpHistoryRanking(rows) {
  return `
    <section class="stats-ranking-card stats-history-card">
      <h3>🗂️ Historico de MVPs</h3>
      <div class="stats-ranking-list">
        ${rows.length ? rows.map((row) => `
          <article class="stats-ranking-row stats-mvp-history-row">
            <span>${escapeHtml(formatDate(row.game.date))}</span>
            <strong>${row.winners.map((playerData) => `<button class="stats-player-link" data-open-stats-player="${playerData.id}" type="button">${escapeHtml(playerData.name)}</button>`).join(" + ")}</strong>
            <small>${row.totalVotes} votos</small>
          </article>
        `).join("") : `<div class="empty-state compact">Ainda nao ha MVPs fechados.</div>`}
      </div>
    </section>
  `;
}

function renderPaymentRow(row, games) {
  const balanceClass = row.currentBalance > 0 ? "debt-cell" : row.currentBalance < 0 ? "credit-cell" : "";
  return `
    <tr>
      <td><button class="player-name-link" data-open-payment-player="${row.player.id}" type="button"><strong>${escapeHtml(row.player.name)}</strong></button></td>
      ${games.map((game) => `
        <td>
          <input type="checkbox"
            data-attendance-game="${game.id}"
            data-attendance-player="${row.player.id}"
            ${row.attendanceByGame.get(game.id) ? "checked" : ""}
            ${getGameFinanceSettings(game).chargePlayers ? "" : "disabled"}>
        </td>
      `).join("")}
      <td>${row.attendanceCount}</td>
      <td>${euro(row.due)}</td>
      <td>${euro(row.paidMonth)}</td>
      <td>${euro(row.previousBalance)}</td>
      <td class="${balanceClass}"><strong>${euro(row.currentBalance)}</strong></td>
    </tr>
  `;
}

function renderGameFinanceControls(report) {
  if (!report.games.length) {
    return `<section class="profile-section"><div class="empty-state">Ainda nao ha jogos neste mes.</div></section>`;
  }
  return `
    <section class="profile-section finance-games-section">
      <div class="finance-settings-head">
        <div>
          <h3>Regras dos jogos</h3>
          <p>Se o jogo nao se realizou mas o campo foi pago, deixa Campo pago ligado e desliga Cobrar jogadores.</p>
        </div>
      </div>
      <div class="finance-games">
        ${report.games.map((game) => {
          const settings = getGameFinanceSettings(game);
          return `
            <article class="finance-game-row">
              <div>
                <strong>${formatDate(game.date)}</strong>
                <span>${escapeHtml(game.title || "Jogo")}</span>
              </div>
              <label>
                <input type="checkbox" data-game-finance-toggle="${game.id}" data-game-finance-field="fieldPaid" ${settings.fieldPaid ? "checked" : ""}>
                Campo pago
              </label>
              <label>
                <input type="checkbox" data-game-finance-toggle="${game.id}" data-game-finance-field="chargePlayers" ${settings.chargePlayers ? "checked" : ""}>
                Cobrar jogadores
              </label>
              <label>
                Campo
                <input class="finance-cost-input" type="number" min="0" step="0.5" data-game-field-cost="${game.id}" value="${settings.fieldCost}">
              </label>
            </article>
          `;
        }).join("")}
      </div>
    </section>
  `;
}

function renderPaymentsHistory(monthPayments) {
  if (!monthPayments.length) return `<div class="empty-state">Ainda nao ha movimentos registados neste mes.</div>`;
  return `
    <div class="profile-games">
      ${monthPayments.map((payment) => {
        const playerData = findPlayer(payment.playerId);
        const isDebt = isDebtAdjustment(payment);
        const visibleNote = getVisiblePaymentNote(payment);
        return `
          <article class="profile-game-row">
            <div>
              <strong>${escapeHtml(playerData?.name || "Jogador removido")} - ${isDebt ? "Divida" : "Pagamento"} ${euro(payment.amount)}</strong>
              <span>${formatDate(payment.paidAt)}${visibleNote ? ` - ${escapeHtml(visibleNote)}` : ""}</span>
            </div>
            <button class="mini-btn" data-edit-payment="${payment.id}" type="button">Editar</button>
          </article>
        `;
      }).join("")}
    </div>
  `;
}

function isDebtAdjustment(payment) {
  return String(payment?.note || "").startsWith(DEBT_NOTE_PREFIX);
}

function getPaymentSignedAmount(payment) {
  return isDebtAdjustment(payment) ? -Math.abs(Number(payment.amount) || 0) : Number(payment.amount) || 0;
}

function getVisiblePaymentNote(payment) {
  const note = String(payment?.note || "");
  if (!note.startsWith(DEBT_NOTE_PREFIX)) return note;
  return note.slice(DEBT_NOTE_PREFIX.length).trim();
}

function makePaymentNote(note, type) {
  const clean = String(note || "").trim();
  if (type !== "debt") return clean;
  return clean ? `${DEBT_NOTE_PREFIX} ${clean}` : DEBT_NOTE_PREFIX;
}

async function addManualPayment(type = "payment") {
  if (!requireAdmin()) return;
  const playerId = els.paymentsPanel.querySelector("[data-payment-player]")?.value;
  const amount = Number(els.paymentsPanel.querySelector("[data-payment-amount]")?.value);
  const paidAtValue = els.paymentsPanel.querySelector("[data-payment-date]")?.value;
  const note = els.paymentsPanel.querySelector("[data-payment-note]")?.value.trim() || "";
  if (!playerId || Number.isNaN(amount) || amount <= 0 || !paidAtValue) {
    alert("Escolhe jogador, valor e data do movimento.");
    return;
  }
  const payment = {
    id: `${type === "debt" ? "debt" : "pay"}-${Date.now()}-${slug(playerId)}`,
    playerId,
    amount,
    paidAt: new Date(`${paidAtValue}T12:00:00`).toISOString(),
    note: makePaymentNote(note, type),
    createdBy: currentSession?.user?.id || null,
    createdAt: new Date().toISOString(),
  };
  const previousPayments = payments;
  payments = [payment, ...payments];
  currentPaymentsMonth = monthKey(new Date(payment.paidAt));
  try {
    await persistState();
  } catch (error) {
    payments = previousPayments;
    saveState();
    alert(`Nao consegui guardar pagamento. Confirma se executaste o schema.sql no Supabase. Detalhe: ${error.message}`);
  }
  renderPaymentsPanel();
}

async function editPayment(paymentId) {
  if (!requireAdmin()) return;
  const payment = payments.find((item) => item.id === paymentId);
  if (!payment) return;
  const isDebt = isDebtAdjustment(payment);
  const amountText = prompt(isDebt ? "Novo valor da divida:" : "Novo valor pago:", String(payment.amount));
  if (amountText === null) return;
  const nextAmount = Number(amountText);
  if (Number.isNaN(nextAmount) || nextAmount <= 0) {
    alert("Valor invalido.");
    return;
  }
  const currentDate = toDateInputValue(payment.paidAt);
  const nextDateValue = prompt("Nova data do pagamento (YYYY-MM-DD):", currentDate);
  if (nextDateValue === null) return;
  const parsedDate = new Date(`${nextDateValue}T12:00:00`);
  if (Number.isNaN(parsedDate.getTime())) {
    alert("Data invalida.");
    return;
  }
  const nextNote = prompt(isDebt ? "Nota da divida:" : "Nota do pagamento:", getVisiblePaymentNote(payment)) ?? "";
  const editNote = prompt("Nota da edicao:", "Corrigido pelo admin") ?? "";
  const previousPayments = payments.map((item) => ({ ...item }));
  payment.amount = nextAmount;
  payment.paidAt = parsedDate.toISOString();
  payment.note = appendPaymentEditNote(makePaymentNote(nextNote.trim(), isDebt ? "debt" : "payment"), editNote.trim());
  try {
    await persistState();
  } catch (error) {
    payments = previousPayments;
    saveState();
    alert(`Nao consegui editar pagamento. Confirma se executaste o schema.sql no Supabase. Detalhe: ${error.message}`);
  }
  renderPaymentsPanel();
}

function appendPaymentEditNote(note, editNote) {
  const stamp = `Editado ${new Date().toLocaleDateString("pt-PT")}${editNote ? `: ${editNote}` : ""}`;
  return note ? `${note} | ${stamp}` : stamp;
}

function toDateInputValue(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return todayInputDate();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

async function saveFinanceSettingsFromPanel() {
  if (!requireAdmin()) return;
  const cashBalance = Number(els.paymentsPanel.querySelector("[data-finance-cash]")?.value || 0);
  const previous = financeSettings;
  financeSettings = {
    ...financeSettings,
    cashBalance: Number.isNaN(cashBalance) ? 0 : cashBalance,
  };
  try {
    await persistState();
  } catch (error) {
    financeSettings = previous;
    saveState();
    alert(`Nao consegui guardar caixa. Confirma se executaste o schema.sql no Supabase. Detalhe: ${error.message}`);
  }
  renderPaymentsPanel();
}

async function updateAttendanceOverride(gameId, playerId, attended) {
  if (!requireAdmin()) return;
  const id = attendanceOverrideId(gameId, playerId);
  const next = {
    id,
    gameId,
    playerId,
    attended,
    updatedBy: currentSession?.user?.id || null,
    updatedAt: new Date().toISOString(),
  };
  const index = attendanceOverrides.findIndex((item) => item.id === id);
  const previousOverrides = [...attendanceOverrides];
  if (index >= 0) attendanceOverrides[index] = next;
  else attendanceOverrides.push(next);
  try {
    await persistState();
  } catch (error) {
    attendanceOverrides = previousOverrides;
    saveState();
    alert(`Nao consegui guardar ajuste de presenca. Confirma se executaste o schema.sql no Supabase. Detalhe: ${error.message}`);
  }
  renderPaymentsPanel();
}

async function updateGameFinanceOverride(gameId, field, value) {
  if (!requireAdmin()) return;
  if (!["fieldPaid", "chargePlayers", "fieldCost"].includes(field)) return;
  if (field === "fieldCost" && (Number.isNaN(value) || value < 0)) {
    alert("Insere um valor valido para o campo.");
    renderPaymentsPanel();
    return;
  }
  const existing = gameFinanceOverrides.find((item) => item.gameId === gameId) || getGameFinanceSettings({ id: gameId });
  const next = {
    ...existing,
    id: gameFinanceOverrideId(gameId),
    gameId,
    [field]: field === "fieldCost" ? Number(value) : value,
    updatedBy: currentSession?.user?.id || null,
    updatedAt: new Date().toISOString(),
  };
  const index = gameFinanceOverrides.findIndex((item) => item.gameId === gameId);
  const previousOverrides = [...gameFinanceOverrides];
  if (index >= 0) gameFinanceOverrides[index] = next;
  else gameFinanceOverrides.push(next);
  try {
    await persistState();
  } catch (error) {
    gameFinanceOverrides = previousOverrides;
    saveState();
    alert(`Nao consegui guardar regra do jogo. Confirma se executaste o schema.sql no Supabase. Detalhe: ${error.message}`);
  }
  renderPaymentsPanel();
}

async function toggleProfileAdminRole(profileId) {
  if (!requireAdmin()) return;
  const profile = knownProfiles.find((item) => item.id === profileId);
  if (!profile) return;
  if (profile.id === currentSession?.user?.id && profile.role === "admin") {
    alert("Nao removo o admin da conta com sessao iniciada.");
    return;
  }
  const nextRole = profile.role === "admin" ? "player" : "admin";
  if (!confirm(`${nextRole === "admin" ? "Promover" : "Remover admin de"} ${profile.email || profile.username || profile.id}?`)) return;
  if (remoteEnabled && supabaseClient) {
    const { error } = await supabaseClient
      .from("profiles")
      .update({ role: nextRole, updated_at: new Date().toISOString() })
      .eq("id", profileId);
    if (error) {
      alert(`Nao consegui atualizar role: ${error.message}`);
      return;
    }
  }
  profile.role = nextRole;
  renderAccountsList();
  updateAccessUi();
}

function buildMonthlyPaymentReport(month) {
  const games = getGamesInMonth(month);
  const rows = getFinancePlayers(games, month).map((playerData) => {
    const attendanceByGame = new Map();
    games.forEach((game) => {
      attendanceByGame.set(game.id, shouldChargePlayerForGame(game, playerData.id));
    });
    const attendanceCount = [...attendanceByGame.values()].filter(Boolean).length;
    const due = Math.min(attendanceCount * PAYMENT_RULES.playerFeePerGame, PAYMENT_RULES.monthlyCap);
    const paidMonth = getPlayerPaymentsInMonth(playerData.id, month).reduce((sum, payment) => sum + getPaymentSignedAmount(payment), 0);
    const previousBalance = getPlayerBalanceBeforeMonth(playerData.id, month);
    const currentBalance = previousBalance + due - paidMonth;
    return {
      player: playerData,
      attendanceByGame,
      attendanceCount,
      due,
      paidMonth,
      previousBalance,
      currentBalance,
    };
  });
  const monthPayments = payments
    .filter((payment) => monthKey(payment.paidAt) === month)
    .sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt));
  const fieldPaidGames = games.filter((game) => getGameFinanceSettings(game).fieldPaid);
  const fieldCost = fieldPaidGames.reduce((sum, game) => sum + getGameFinanceSettings(game).fieldCost, 0);
  const totalPaidMonth = monthPayments
    .filter((payment) => !isDebtAdjustment(payment))
    .reduce((sum, payment) => sum + payment.amount, 0);
  return {
    month,
    games,
    fieldPaidGames,
    rows,
    monthPayments,
    fieldCost,
    totalDue: rows.reduce((sum, row) => sum + row.due, 0),
    totalPaidMonth,
    totalCurrentBalance: rows.reduce((sum, row) => sum + row.currentBalance, 0),
    cashMonthDelta: totalPaidMonth - fieldCost,
  };
}

function getFinancePlayers(games, month) {
  const ids = new Set();
  state.players.filter((p) => !p.isGuest).forEach((p) => ids.add(p.id));
  games.forEach((game) => {
    state.players.forEach((playerData) => {
      if (didPlayerAttendGame(game, playerData.id)) ids.add(playerData.id);
    });
  });
  payments.forEach((payment) => {
    if (monthKey(payment.paidAt) <= month) ids.add(payment.playerId);
  });
  return [...ids]
    .map((id) => findPlayer(id))
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name));
}

function getGamesInMonth(month) {
  return [...state.games]
    .filter((game) => monthKey(game.date) === month)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}

function getPlayerPaymentsInMonth(playerId, month) {
  return payments.filter((payment) => payment.playerId === playerId && monthKey(payment.paidAt) === month);
}

function getPlayerBalanceBeforeMonth(playerId, month) {
  const initial = Number(financeSettings.playerBalances?.[playerId] || 0);
  if (month <= financeSettings.startMonth) return initial;
  const months = new Set();
  state.games.forEach((game) => {
    const key = monthKey(game.date);
    if (key > financeSettings.startMonth && key < month) months.add(key);
  });
  payments.forEach((payment) => {
    const key = monthKey(payment.paidAt);
    if (key > financeSettings.startMonth && key < month) months.add(key);
  });
  return [...months].sort().reduce((balance, key) => {
    const games = getGamesInMonth(key);
    const attendanceCount = games.filter((game) => shouldChargePlayerForGame(game, playerId)).length;
    const due = Math.min(attendanceCount * PAYMENT_RULES.playerFeePerGame, PAYMENT_RULES.monthlyCap);
    const paid = getPlayerPaymentsInMonth(playerId, key).reduce((sum, payment) => sum + getPaymentSignedAmount(payment), 0);
    return balance + due - paid;
  }, initial);
}

function shouldChargePlayerForGame(game, playerId) {
  if (!getGameFinanceSettings(game).chargePlayers) return false;
  return didPlayerAttendGame(game, playerId);
}

function didPlayerAttendGame(game, playerId) {
  const override = attendanceOverrides.find((item) => item.gameId === game.id && item.playerId === playerId);
  if (override) return override.attended;
  return getGamePlayerIds(game).includes(playerId);
}

function getGameFinanceSettings(game) {
  const gameId = typeof game === "string" ? game : game?.id;
  const override = gameFinanceOverrides.find((item) => item.gameId === gameId);
  return {
    id: gameFinanceOverrideId(gameId),
    gameId,
    fieldPaid: override?.fieldPaid ?? true,
    chargePlayers: override?.chargePlayers ?? true,
    fieldCost: override?.fieldCost ?? PAYMENT_RULES.fieldCostPerGame,
    updatedBy: override?.updatedBy || null,
    updatedAt: override?.updatedAt || new Date().toISOString(),
  };
}

function getGamePlayerIds(game) {
  return [...new Set([...(game.teamA || []), ...(game.teamB || []), ...(game.benchA || []), ...(game.benchB || [])])];
}

function attendanceOverrideId(gameId, playerId) {
  return `att-${gameId}-${playerId}`;
}

function gameFinanceOverrideId(gameId) {
  return `gfin-${gameId}`;
}

function sharePaymentsOnWhatsApp() {
  const report = buildMonthlyPaymentReport(currentPaymentsMonth);
  const debtors = report.rows.filter((row) => row.currentBalance > 0.009);
  const lines = [
    debtors.length ? "Jogadores em divida:" : "Nao ha jogadores em divida.",
    ...debtors.map((row) => `${row.player.name}: ${euro(row.currentBalance)}`),
  ];
  window.open(`https://wa.me/?text=${encodeURIComponent(lines.join("\n"))}`, "_blank", "noopener");
}

function getNextEvent() {
  const now = Date.now();
  return [...(state.events || [])]
    .filter((eventData) => eventData.status !== "completed" && eventData.status !== "cancelled")
    .sort((a, b) => {
      const aFuture = new Date(a.startsAt).getTime() >= now ? 0 : 1;
      const bFuture = new Date(b.startsAt).getTime() >= now ? 0 : 1;
      return aFuture - bFuture || new Date(a.startsAt) - new Date(b.startsAt);
    })[0] || null;
}

function getCurrentEvent() {
  return (state.events || []).find((eventData) => eventData.id === currentEventId) || getNextEvent();
}

function getEventResponses(eventId, status) {
  return eventResponses.filter((response) => response.eventId === eventId && (!status || response.status === status));
}

function getEventPlayers(eventId, status) {
  return getEventResponses(eventId, status)
    .map((response) => findPlayer(response.playerId))
    .filter(Boolean)
    .sort((a, b) => b.overall - a.overall || a.name.localeCompare(b.name));
}

function getResponseForPlayer(eventId, playerId) {
  return eventResponses.find((response) => response.eventId === eventId && response.playerId === playerId) || null;
}

function getEventGoingCount(eventId, exceptPlayerId = null) {
  return getEventResponses(eventId, "going")
    .filter((response) => response.playerId !== exceptPlayerId)
    .length;
}

function isEventFullForPlayer(eventData, playerId) {
  const currentResponse = playerId ? getResponseForPlayer(eventData.id, playerId) : null;
  if (currentResponse?.status === "going") return false;
  return getEventGoingCount(eventData.id, playerId) >= eventData.maxPlayers;
}

function renderEventsList() {
  if (!els.eventsList) return;
  if (els.eventDate && !els.eventDate.value) {
    els.eventDate.value = toDateTimeLocalInput(defaultEventDate());
  }

  document.body.classList.toggle("player-linked", Boolean(getLinkedPlayer()));
  const events = [...(state.events || [])]
    .filter((eventData) => eventData.status !== "completed")
    .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
  if (!events.length) {
    els.eventsList.innerHTML = `<div class="empty-state">Ainda nao ha convocatorias. O admin pode lancar o proximo jogo.</div>`;
    return;
  }

  els.eventsList.innerHTML = events.map((eventData) => renderEventCard(eventData)).join("");

  els.eventsList.querySelectorAll("[data-event-response]").forEach((button) => {
    button.addEventListener("click", () => saveEventResponse(button.dataset.eventId, button.dataset.eventResponse));
  });
  els.eventsList.querySelectorAll("[data-event-generate]").forEach((button) => {
    button.addEventListener("click", () => {
      currentEventId = button.dataset.eventGenerate;
      loadCurrentEventGoingPlayers({ autoGenerate: true });
    });
  });
  els.eventsList.querySelectorAll("[data-event-cancel]").forEach((button) => {
    button.addEventListener("click", () => updateEventStatus(button.dataset.eventCancel, "cancelled"));
  });
  els.eventsList.querySelectorAll("[data-event-delete]").forEach((button) => {
    button.addEventListener("click", () => deleteEvent(button.dataset.eventDelete));
  });
  els.eventsList.querySelectorAll("[data-save-event-date]").forEach((button) => {
    button.addEventListener("click", () => saveEventDateFromList(button.dataset.saveEventDate));
  });
  els.eventsList.querySelectorAll("[data-event-share]").forEach((button) => {
    button.addEventListener("click", () => shareEventOnWhatsApp(button.dataset.eventShare));
  });
  els.eventsList.querySelectorAll("[data-event-add-existing-btn]").forEach((button) => {
    button.addEventListener("click", () => addExistingPlayerToEvent(button.dataset.eventAddExistingBtn));
  });
  els.eventsList.querySelectorAll("[data-event-add-guest-btn]").forEach((button) => {
    button.addEventListener("click", () => addGuestToEvent(button.dataset.eventAddGuestBtn));
  });
  els.eventsList.querySelectorAll("[data-open-player]").forEach((button) => {
    button.addEventListener("click", () => openPlayerProfile(button.dataset.openPlayer));
  });
}

function renderEventCard(eventData) {
  const linkedPlayer = getLinkedPlayer();
  const myResponse = linkedPlayer ? getResponseForPlayer(eventData.id, linkedPlayer.id) : null;
  const going = getEventPlayers(eventData.id, "going");
  const maybe = getEventPlayers(eventData.id, "maybe");
  const notGoing = getEventPlayers(eventData.id, "not_going");
  const missing = Math.max(0, eventData.minPlayers - going.length);
  const isFull = going.length >= eventData.maxPlayers;
  const isSelected = eventData.id === currentEventId;
  return `
    <article class="event-card ${isSelected ? "selected" : ""}">
      <div class="event-top">
        <div>
          <p class="eyebrow">${escapeHtml(eventData.status)}</p>
          <h3>${escapeHtml(eventData.title)}</h3>
          <p>${formatDate(eventData.startsAt)}${eventData.location ? ` - ${escapeHtml(eventData.location)}` : ""}</p>
        </div>
        <strong class="counter">${going.length}/${eventData.maxPlayers}</strong>
      </div>
      <div class="event-counts">
        <span class="metric good-pill">Vou ${going.length}</span>
        <span class="metric">Talvez ${maybe.length}</span>
        <span class="metric">Nao vou ${notGoing.length}</span>
        ${isFull ? `<span class="metric warn-pill">Cheio</span>` : ""}
        <span class="metric ${missing ? "warn-pill" : "good-pill"}">${missing ? `Faltam ${missing}` : "Pronto"}</span>
      </div>
      <div class="event-date-edit admin-actions">
        <label class="game-date-control">
          <span>Data/hora</span>
          <input type="datetime-local" data-event-date-edit="${eventData.id}" value="${toDateTimeLocalInput(eventData.startsAt)}">
        </label>
        <button class="ghost-btn" data-save-event-date="${eventData.id}">Guardar data</button>
      </div>
      ${renderResponseActions(eventData, myResponse)}
      <div class="event-roster">
        ${renderRosterMini("Vou", going)}
        ${renderRosterMini("Talvez", maybe)}
        ${renderRosterMini("Nao vou", notGoing)}
      </div>
      ${renderEventAdminAdds(eventData)}
      <div class="actions admin-actions">
        <button class="ghost-btn" data-event-share="${eventData.id}">WhatsApp</button>
        ${eventData.status === "cancelled" ? `
          <button class="danger-btn" data-event-delete="${eventData.id}">Apagar convocatoria</button>
        ` : `
          <button class="primary-btn" data-event-generate="${eventData.id}" ${going.length < eventData.minPlayers || going.length > Math.min(eventData.maxPlayers, 12) ? "disabled" : ""}>Gerar com confirmados</button>
          <button class="danger-btn" data-event-cancel="${eventData.id}">Cancelar</button>
        `}
      </div>
    </article>
  `;
}

function renderResponseActions(eventData, myResponse) {
  if (eventData.status === "cancelled") {
    return `<div class="hint warn">Convocatoria cancelada. Podes apagar esta convocatoria do historico de convocatorias.</div>`;
  }
  const linkedPlayer = getLinkedPlayer();
  if (!currentSession) {
    return `<div class="hint">Entra para responder a esta convocatoria.</div>`;
  }
  if (!linkedPlayer && !isAdmin) {
    return `<div class="hint warn">Associa primeiro a tua conta a um perfil de jogador.</div>`;
  }
  if (isAdmin && !linkedPlayer) {
    return `<div class="hint">Admin sem perfil associado. Podes acompanhar e gerar equipas.</div>`;
  }
  const status = myResponse?.status || "";
  const goingDisabled = status !== "going" && isEventFullForPlayer(eventData, linkedPlayer.id);
  return `
    <div class="response-row">
      <button class="ghost-btn ${status === "going" ? "selected" : ""}" data-event-id="${eventData.id}" data-event-response="going" ${goingDisabled ? "disabled" : ""}>Vou</button>
      <button class="ghost-btn ${status === "maybe" ? "selected" : ""}" data-event-id="${eventData.id}" data-event-response="maybe">Talvez</button>
      <button class="ghost-btn ${status === "not_going" ? "selected" : ""}" data-event-id="${eventData.id}" data-event-response="not_going">Nao vou</button>
      ${goingDisabled ? `<span class="hint warn">Limite de ${eventData.maxPlayers} jogadores atingido.</span>` : ""}
    </div>
  `;
}

function renderRosterMini(label, players) {
  const roster = players.length
    ? players.map((p) => `
      <button class="roster-player-chip ${renderCardHaloClass(p)}" data-open-player="${p.id}" type="button">
        ${renderAvatar(p)}
        <span>${escapeHtml(p.name)}</span>
      </button>
    `).join("")
    : `<span>-</span>`;
  return `<div><strong>${label}</strong><span class="roster-player-list">${roster}</span></div>`;
}

function renderEventAdminAdds(eventData) {
  if (!isAdmin || eventData.status === "cancelled") return "";
  const isFull = getEventGoingCount(eventData.id) >= eventData.maxPlayers;
  const assignedIds = new Set(getEventResponses(eventData.id).map((response) => response.playerId));
  const availablePlayers = state.players
    .filter((p) => !p.isGuest && !assignedIds.has(p.id))
    .sort((a, b) => a.name.localeCompare(b.name));
  return `
    <div class="event-admin-adds admin-actions">
      <div class="add-existing-row">
        <select data-event-add-existing="${eventData.id}">
          <option value="">Adicionar jogador existente</option>
          ${availablePlayers.map((p) => `<option value="${p.id}">${escapeHtml(p.name)} - ${p.overall}</option>`).join("")}
        </select>
        <button class="ghost-btn" data-event-add-existing-btn="${eventData.id}" ${isFull ? "disabled" : ""}>Adicionar como Vou</button>
      </div>
      <div class="add-guest-row">
        <input data-event-guest-name="${eventData.id}" placeholder="Amigo novo">
        <input data-event-guest-score="${eventData.id}" type="number" min="0" max="10" step="0.5" placeholder="0-10">
        <button class="ghost-btn" data-event-add-guest-btn="${eventData.id}" ${isFull ? "disabled" : ""}>Adicionar convidado</button>
      </div>
      ${isFull ? `<div class="hint warn">Limite de ${eventData.maxPlayers} jogadores atingido.</div>` : ""}
    </div>
  `;
}

async function saveEventFromForm(event) {
  event.preventDefault();
  if (!requireAdmin()) return;
  const title = els.eventTitle.value.trim();
  const startsAt = fromDateTimeLocalInput(els.eventDate.value);
  const location = els.eventLocation.value.trim();
  const maxPlayers = clampNumber(Number(els.eventMaxPlayers.value || 12), 10, 12);
  if (!title || !startsAt) return;

  const eventData = normalizeEventRecord({
    id: `e-${Date.now()}-${slug(title)}`,
    title,
    sport: "futsal",
    startsAt,
    location,
    minPlayers: 10,
    maxPlayers,
    status: "open",
    createdBy: currentSession?.user?.id || null,
  });

  state.events = [eventData, ...(state.events || [])];
  currentEventId = eventData.id;
  if (remoteEnabled && supabaseClient) {
    const { error } = await supabaseClient.from("events").upsert(eventToRow(eventData));
    if (error) {
      alert(`Nao consegui lancar evento: ${error.message}`);
      return;
    }
  }
  saveState();
  els.eventForm.reset();
  els.eventDate.value = toDateTimeLocalInput(defaultEventDate());
  render();
}

async function saveEventDateFromList(eventId) {
  if (!requireAdmin()) return;
  const input = [...(els.eventsList?.querySelectorAll("[data-event-date-edit]") || [])]
    .find((item) => item.dataset.eventDateEdit === eventId);
  const startsAt = fromDateTimeLocalInput(input?.value);
  if (!startsAt) {
    alert("Escolhe uma data e hora valida.");
    return;
  }
  await updateEventDate(eventId, startsAt);
}

async function updateEventDate(eventId, startsAt) {
  const eventData = (state.events || []).find((item) => item.id === eventId);
  if (!eventData) return false;
  const linkedGame = findGameForEventData(eventData);
  const previousEventDate = eventData.startsAt;
  const previousGameDate = linkedGame?.date || null;

  eventData.startsAt = startsAt;
  if (linkedGame) {
    linkedGame.date = startsAt;
    currentGenerationDateIso = startsAt;
    currentPaymentsMonth = monthKey(startsAt);
  }

  try {
    await persistState();
  } catch (error) {
    eventData.startsAt = previousEventDate;
    if (linkedGame) linkedGame.date = previousGameDate;
    saveState();
    alert(`Nao consegui guardar a nova data: ${error.message}`);
    return false;
  }
  render();
  return true;
}

async function saveEventResponse(eventId, status) {
  if (!currentSession?.user) {
    alert("Entra primeiro para responder.");
    return;
  }
  const linkedPlayer = getLinkedPlayer();
  if (!linkedPlayer) {
    alert("Associa primeiro a tua conta a um perfil.");
    showView("account");
    return;
  }

  try {
    await saveEventResponseForPlayer(eventId, linkedPlayer.id, status, currentSession.user.id);
  } catch (error) {
    alert(`Nao consegui guardar resposta: ${formatEventResponseError(error)}`);
    return;
  }
  currentEventId = eventId;
  render();
}

async function saveEventResponseForPlayer(eventId, playerId, status, userId = null) {
  const eventData = (state.events || []).find((item) => item.id === eventId);
  const existing = getResponseForPlayer(eventId, playerId);
  if (eventData && status === "going" && existing?.status !== "going" && getEventGoingCount(eventId, playerId) >= eventData.maxPlayers) {
    throw new Error(`Limite de ${eventData.maxPlayers} jogadores atingido.`);
  }

  const row = {
    event_id: eventId,
    player_id: playerId,
    user_id: userId,
    status,
    updated_at: new Date().toISOString(),
  };

  if (remoteEnabled && supabaseClient) {
    const { error } = await supabaseClient
      .from("event_responses")
      .upsert(row, { onConflict: "event_id,player_id" });
    if (error) throw error;
    await loadRemoteState();
    return;
  }

  if (existing) {
    existing.status = status;
    existing.updatedAt = row.updated_at;
  } else {
    eventResponses.unshift(responseFromRow({ ...row, id: `r-${Date.now()}-${playerId}` }));
  }
}

async function addExistingPlayerToEvent(eventId) {
  if (!requireAdmin()) return;
  const select = els.eventsList?.querySelector(`[data-event-add-existing="${eventId}"]`);
  const playerId = select?.value;
  if (!playerId) return;
  try {
    await saveEventResponseForPlayer(eventId, playerId, "going");
    currentEventId = eventId;
    render();
  } catch (error) {
    alert(`Nao consegui adicionar jogador: ${formatEventResponseError(error)}`);
  }
}

async function addGuestToEvent(eventId) {
  if (!requireAdmin()) return;
  const nameInput = els.eventsList?.querySelector(`[data-event-guest-name="${eventId}"]`);
  const scoreInput = els.eventsList?.querySelector(`[data-event-guest-score="${eventId}"]`);
  const name = nameInput?.value.trim();
  const score = Number(scoreInput?.value);
  if (!name || Number.isNaN(score) || score < 0 || score > 10) {
    alert("Escreve o nome do convidado e uma nota entre 0 e 10.");
    return;
  }

  const overall = Math.round(score * 10);
  const guest = {
    id: `g-${Date.now()}-${slug(name)}`,
    name,
    pace: overall,
    shooting: overall,
    passing: overall,
    dribbling: overall,
    defending: overall,
    physical: overall,
    overall,
    photoDataUrl: "",
    linkedUserId: null,
    isGuest: true,
    guestScore0To10: score,
  };

  state.players.push(guest);
  try {
    if (remoteEnabled && supabaseClient) {
      const { error: playerError } = await supabaseClient.from("players").upsert(playerToRow(guest));
      if (playerError) throw playerError;
    }
    await saveEventResponseForPlayer(eventId, guest.id, "going");
    currentEventId = eventId;
    saveState();
    render();
  } catch (error) {
    state.players = state.players.filter((p) => p.id !== guest.id);
    alert(`Nao consegui adicionar convidado: ${formatEventResponseError(error)}`);
  }
}

function formatEventResponseError(error) {
  if (String(error?.message || "").includes("event_max_players_reached")) {
    return "a convocatoria ja atingiu o limite de jogadores.";
  }
  return error?.message || "erro inesperado.";
}

function shareEventOnWhatsApp(eventId) {
  const eventData = (state.events || []).find((item) => item.id === eventId);
  if (!eventData) return;
  const going = getEventPlayers(eventId, "going");
  const maybe = getEventPlayers(eventId, "maybe");
  const notGoing = getEventPlayers(eventId, "not_going");
  const missing = Math.max(0, eventData.minPlayers - going.length);
  const appUrl = getShareAppUrl();
  const lines = [
    `Convocatoria: ${eventData.title}`,
    formatDate(eventData.startsAt),
    eventData.location ? `Local: ${eventData.location}` : "",
    "",
    `Confirmados: ${going.length}/${eventData.maxPlayers}`,
    `Vou: ${going.length ? going.map((p) => p.name).join(", ") : "-"}`,
    maybe.length ? `Talvez: ${maybe.map((p) => p.name).join(", ")}` : "",
    notGoing.length ? `Nao vou: ${notGoing.map((p) => p.name).join(", ")}` : "",
    missing ? `Faltam ${missing} para fechar o minimo.` : "Ja temos minimo para jogar.",
    "",
    `Responder aqui: ${appUrl}`,
  ].filter(Boolean);

  const url = `https://wa.me/?text=${encodeURIComponent(lines.join("\n"))}`;
  window.open(url, "_blank", "noopener");
}

function getShareAppUrl() {
  if (location.protocol === "file:" || location.hostname === "127.0.0.1" || location.hostname === "localhost") {
    return "https://kre-master.github.io/equilibrador-5v5/";
  }
  return location.href.split("#")[0];
}

async function updateEventStatus(eventId, status) {
  if (!requireAdmin()) return;
  const eventData = state.events.find((item) => item.id === eventId);
  if (!eventData) return;
  if (status === "cancelled" && !confirm(`Cancelar a convocatoria "${eventData.title}"?`)) return;
  eventData.status = status;
  if (remoteEnabled && supabaseClient) {
    const { error } = await supabaseClient.from("events").upsert(eventToRow(eventData));
    if (error) {
      alert(`Nao consegui atualizar evento: ${error.message}`);
      return;
    }
  }
  saveState();
  render();
}

async function deleteEvent(eventId) {
  if (!requireAdmin()) return;
  const eventData = state.events.find((item) => item.id === eventId);
  if (!eventData) return;
  if (!confirm(`Apagar definitivamente a convocatoria "${eventData.title}"?`)) return;

  if (remoteEnabled && supabaseClient) {
    const { error } = await supabaseClient.from("events").delete().eq("id", eventId);
    if (error) {
      alert(`Nao consegui apagar convocatoria: ${error.message}`);
      return;
    }
  }

  state.events = (state.events || []).filter((item) => item.id !== eventId);
  eventResponses = eventResponses.filter((response) => response.eventId !== eventId);
  if (currentEventId === eventId) {
    currentEventId = getNextEvent()?.id || state.events[0]?.id || null;
  }
  saveState();
  render();
}

function loadCurrentEventGoingPlayers(options = {}) {
  const eventData = getCurrentEvent();
  if (!eventData) {
    setHint("Ainda nao ha convocatoria para carregar.", "warn");
    showView("today");
    return;
  }
  const goingPlayers = getEventPlayers(eventData.id, "going");
  selectedIds = new Set(goingPlayers.map((p) => p.id));
  currentEventId = eventData.id;
  currentGameId = null;
  previewGame = null;
  currentSuggestions = [];
  setGameDateInput(eventData.startsAt);
  showView("today");
  render();
  setHint(`${goingPlayers.length} confirmados carregados da convocatoria "${eventData.title}".`, goingPlayers.length >= 10 && goingPlayers.length <= 13 ? "good" : "warn");
  if (options.autoGenerate) {
    generateAndRenderSuggestions({ autoPreviewBest: true });
  }
}

async function requestPlayerClaim(playerId) {
  if (!remoteEnabled || !supabaseClient || !currentSession?.user) {
    alert("Entra primeiro para reclamar um perfil.");
    return;
  }

  const playerData = findPlayer(playerId);
  if (!playerData || playerData.linkedUserId) {
    alert("Este perfil ja esta associado.");
    return;
  }

  const { error } = await supabaseClient.from("player_claims").insert({
    user_id: currentSession.user.id,
    player_id: playerId,
    status: "pending",
  });

  if (error) {
    alert(`Nao consegui criar o pedido: ${error.message}`);
    return;
  }

  await loadAccountState();
  updateAccessUi();
  render();
}

async function reviewPlayerClaim(claimId, status) {
  if (!isAdmin || !supabaseClient) return;
  const claim = playerClaims.find((item) => item.id === claimId);
  if (!claim) return;

  const updates = {
    status,
    reviewed_at: new Date().toISOString(),
    reviewed_by: currentSession?.user?.id || null,
  };
  const { error: claimError } = await supabaseClient
    .from("player_claims")
    .update(updates)
    .eq("id", claimId);
  if (claimError) {
    alert(`Nao consegui atualizar o pedido: ${claimError.message}`);
    return;
  }

  if (status === "approved") {
    const playerIndex = state.players.findIndex((p) => p.id === claim.player_id);
    if (playerIndex >= 0) {
      state.players = state.players.map((playerData) => ({
        ...playerData,
        linkedUserId: playerData.id === claim.player_id
          ? claim.user_id
          : playerData.linkedUserId === claim.user_id
            ? null
            : playerData.linkedUserId,
      }));
      const { error: unlinkError } = await supabaseClient
        .from("players")
        .update({ linked_user_id: null, updated_at: new Date().toISOString() })
        .eq("linked_user_id", claim.user_id)
        .neq("id", claim.player_id);
      if (unlinkError) {
        alert(`Nao consegui limpar ligacoes antigas: ${unlinkError.message}`);
        return;
      }
      await persistState();
    }
    await supabaseClient
      .from("player_claims")
      .update({
        status: "rejected",
        reviewed_at: new Date().toISOString(),
        reviewed_by: currentSession?.user?.id || null,
      })
      .eq("player_id", claim.player_id)
      .eq("status", "pending")
      .neq("id", claimId);
  }

  await loadAccountState();
  await loadRemoteState();
  updateAccessUi();
  render();
}

function renderPlayerList() {
  if (!els.playerList) return;
  const query = normalize(els.playerSearch?.value || "");
  const players = state.players
    .filter((p) => normalize(p.name).includes(query))
    .sort((a, b) => b.overall - a.overall || a.name.localeCompare(b.name));

  els.playerList.innerHTML = players.map((p) => {
    const selected = selectedIds.has(p.id);
    const form = getPlayerForm(p);
    const variant = getPlayerCardVariant(p, form);
    return `
      <label class="player-chip ${renderCardHaloClass(p, variant)} ${selected ? "selected" : ""}">
        <input type="checkbox" data-select-player="${p.id}" ${selected ? "checked" : ""}>
        <button class="player-open-link" data-open-player="${p.id}" type="button">${renderAvatar(p)}</button>
        <button class="player-meta player-open-link" data-open-player="${p.id}" type="button">
          <strong>${escapeHtml(p.name)}</strong>
          <span>${p.isGuest ? "Convidado" : "Fixo"} - PAC ${p.pace} - DEF ${p.defending} - PHY ${p.physical}</span>
        </button>
        ${renderRatingBadge(p, form)}
      </label>
    `;
  }).join("");

  els.playerList.querySelectorAll("[data-select-player]").forEach((input) => {
    input.addEventListener("change", (event) => {
      if (event.target.checked) {
        selectedIds.add(event.target.dataset.selectPlayer);
      } else {
        selectedIds.delete(event.target.dataset.selectPlayer);
      }
      renderPlayerList();
    });
  });
  els.playerList.querySelectorAll("[data-open-player]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      openPlayerProfile(button.dataset.openPlayer);
    });
  });

  const count = selectedIds.size;
  els.selectedCount.textContent = `${count}/13`;
  els.selectionHint.className = "hint";
  if (count < 10) {
    els.selectionHint.textContent = `Faltam ${10 - count} jogadores para gerar equipas.`;
  } else if (count > 13) {
    els.selectionHint.textContent = "A primeira versao suporta no maximo 13 jogadores.";
    els.selectionHint.classList.add("warn");
  } else {
    els.selectionHint.textContent = `${count} jogadores selecionados. Pronto para gerar.`;
    els.selectionHint.classList.add("good");
  }
}

async function addGuest() {
  const name = els.guestName.value.trim();
  const score = Number(els.guestScore.value);
  if (!name || Number.isNaN(score) || score < 0 || score > 10) {
    setHint("Escreve nome do convidado e uma nota entre 0 e 10.", "warn");
    return;
  }

  const overall = Math.round(score * 10);
  const id = `g-${Date.now()}-${slug(name)}`;
  const guest = {
    id,
    name,
    pace: overall,
    shooting: overall,
    passing: overall,
    dribbling: overall,
    defending: overall,
    physical: overall,
    overall,
    photoDataUrl: "",
    isGuest: true,
    guestScore0To10: score,
  };
  state.players.push(guest);
  selectedIds.add(id);
  els.guestName.value = "";
  els.guestScore.value = "";
  await persistState();
  render();
}

function setHint(message, level) {
  els.selectionHint.textContent = message;
  els.selectionHint.className = `hint ${level || ""}`.trim();
}

function generateAndRenderSuggestions(options = {}) {
  ensureGameDateInput();
  previewGame = null;
  currentGameId = null;
  renderCurrentGame();

  const selected = getSelectedPlayers();
  if (selected.length < 10 || selected.length > 12) {
    setHint("Seleciona entre 10 e 12 jogadores antes de gerar.", "warn");
    return;
  }

  currentSuggestions = generateSuggestions(selected, state.games).slice(0, 6);
  renderSuggestions();
  if (options.autoPreviewBest && currentSuggestions.length) {
    previewSuggestion(0);
  }
}

function renderSuggestions() {
  if (!currentSuggestions.length) {
    els.suggestions.innerHTML = `<div class="empty-state">Nao encontrei uma combinacao valida.</div>`;
    return;
  }

  els.suggestions.innerHTML = currentSuggestions.map((suggestion, index) => {
    const teamA = suggestion.teamA.map((p) => p.name).join(", ");
    const teamB = suggestion.teamB.map((p) => p.name).join(", ");
    return `
      <article class="suggestion-card">
        <div class="suggestion-top">
          <strong>Sugestao ${index + 1}</strong>
          <button class="primary-btn" data-preview-suggestion="${index}">Ver no campo</button>
        </div>
        <div class="team-preview">
          <div class="team-line"><strong>A ${suggestion.teamAStats.total}</strong> - ${escapeHtml(teamA)}</div>
          <div class="team-line blue"><strong>B ${suggestion.teamBStats.total}</strong> - ${escapeHtml(teamB)}</div>
        </div>
        ${renderTeamRadarChart(suggestion.teamA, suggestion.teamB, { compact: true })}
        <div class="metric-row">
          <span class="metric">Diferenca ${suggestion.diffTotal}</span>
          <span class="metric">Plantel ${suggestion.squadDiff}</span>
          <span class="metric">Media A ${suggestion.teamAStats.average}</span>
          <span class="metric">Media B ${suggestion.teamBStats.average}</span>
          <span class="metric">Repeticao ${suggestion.historyPenalty}</span>
          <span class="metric">Forma ${suggestion.formPenalty}</span>
        </div>
      </article>
    `;
  }).join("");

  els.suggestions.querySelectorAll("[data-preview-suggestion]").forEach((button) => {
    button.addEventListener("click", () => previewSuggestion(Number(button.dataset.previewSuggestion)));
  });
}

function getTeamFormStats(players) {
  return players.reduce((stats, playerData) => {
    const form = getPlayerForm(playerData);
    stats.totalAdjustment += form.adjustment;
    stats[form.levelKey] = (stats[form.levelKey] || 0) + 1;
    return stats;
  }, { totalAdjustment: 0, hot: 0, good: 0, normal: 0, bad: 0, recovery: 0 });
}

function getFormBalancePenalty(teamA, teamB) {
  const a = getTeamFormStats(teamA);
  const b = getTeamFormStats(teamB);
  const strongDiff = Math.abs((a.hot + a.good) - (b.hot + b.good));
  const weakDiff = Math.abs((a.bad + a.recovery) - (b.bad + b.recovery));
  const adjustmentDiff = Math.abs(a.totalAdjustment - b.totalAdjustment);
  return strongDiff * 5 + weakDiff * 7 + adjustmentDiff * 1.5;
}

function generateSuggestions(players, games) {
  const pairHistory = buildPairHistory(games);
  const teamHistory = buildTeamHistory(games);
  const suggestions = [];
  const seen = new Set();

  const teamASize = Math.floor(players.length / 2);
  const teamCombos = combinations(players, teamASize);
  for (const teamA of teamCombos) {
    const teamAIds = new Set(teamA.map((p) => p.id));
    const teamB = players.filter((p) => !teamAIds.has(p.id));
    const keyA = keyForIds(teamA);
    const keyB = keyForIds(teamB);
    const divisionKey = [keyA, keyB].sort().join("|");
    if (seen.has(divisionKey)) continue;
    seen.add(divisionKey);

    const ratingOptions = { ratingFor: getPlayerRatingForBalance };
    const teamAStats = getTeamStats(teamA, ratingOptions);
    const teamBStats = getTeamStats(teamB, ratingOptions);
    const diffTotal = Math.abs(teamAStats.total - teamBStats.total);
    const squadDiff = Math.abs(teamAStats.average - teamBStats.average);
    const attrDiff =
      Math.abs(teamAStats.attack - teamBStats.attack) +
      Math.abs(teamAStats.defense - teamBStats.defense) * 1.25 +
      Math.abs(teamAStats.physical - teamBStats.physical) +
      Math.abs(teamAStats.pace - teamBStats.pace) * 0.7;
    const pairPenalty = sameTeamPairPenalty(teamA, pairHistory) + sameTeamPairPenalty(teamB, pairHistory);
    const exactPenalty = (teamHistory.get(keyA) || 0) * 12 + (teamHistory.get(keyB) || 0) * 12;
    const historyPenalty = Math.round(pairPenalty + exactPenalty);
    const formPenalty = getFormBalancePenalty(teamA, teamB);
    const score = diffTotal * 3 + squadDiff * 1.7 + attrDiff * 0.45 + historyPenalty + formPenalty;

    suggestions.push({
      teamA,
      teamB,
      benchA: [],
      benchB: [],
      teamAStats,
      teamBStats,
      squadAStats: teamAStats,
      squadBStats: teamBStats,
      diffTotal,
      squadDiff,
      historyPenalty,
      formPenalty: Number(formPenalty.toFixed(2)),
      score: Number(score.toFixed(2)),
    });
  }

  return suggestions.sort((a, b) => a.score - b.score || a.diffTotal - b.diffTotal || a.squadDiff - b.squadDiff);
}

function getBenchSplits(bench) {
  if (!bench.length) return [{ benchA: [], benchB: [] }];
  if (bench.length === 1) return [{ benchA: bench, benchB: [] }, { benchA: [], benchB: bench }];

  const splits = [];
  const minA = Math.floor(bench.length / 2);
  const maxA = Math.ceil(bench.length / 2);
  for (let size = minA; size <= maxA; size += 1) {
    combinations(bench, size).forEach((benchA) => {
      const benchAIds = new Set(benchA.map((p) => p.id));
      const benchB = bench.filter((p) => !benchAIds.has(p.id));
      splits.push({ benchA, benchB });
    });
  }
  return splits;
}

function getThirdWorstPlayer(players) {
  return [...players].sort((a, b) => a.overall - b.overall || a.name.localeCompare(b.name))[2] || players[0];
}

function createGameFromSuggestion(suggestion, options = {}) {
  return {
    id: options.id || `preview-${Date.now()}`,
    date: options.date || getGenerationDateIso(),
    status: options.status || "preview",
    teamA: suggestion.teamA.map((p) => p.id),
    teamB: suggestion.teamB.map((p) => p.id),
    benchA: suggestion.benchA.map((p) => p.id),
    benchB: suggestion.benchB.map((p) => p.id),
    scoreA: null,
    scoreB: null,
    notes: "",
  };
}

function previewSuggestion(index) {
  const suggestion = currentSuggestions[index];
  if (!suggestion) return;

  previewGame = createGameFromSuggestion(suggestion, { date: getGenerationDateIso() });
  currentGameId = null;
  renderCurrentGame();
  setHint("Sugestao no campo. Confirma so quando estiver certo.", "good");
}

function ensureGameDateInput() {
  if (!els.gameDate || els.gameDate.value) return;
  setGameDateInput(currentGenerationDateIso || new Date().toISOString());
}

function setGameDateInput(value) {
  if (!els.gameDate || !value) return;
  const iso = normalizeGenerationDate(value);
  if (!iso) return;
  currentGenerationDateIso = iso;
  els.gameDate.value = toDateTimeLocalInput(iso);
}

function getGenerationDateIso() {
  ensureGameDateInput();
  syncGenerationDateFromInput();
  return currentGenerationDateIso || new Date().toISOString();
}

function normalizeGenerationDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function syncGenerationDateFromInput() {
  const iso = fromDateTimeLocalInput(els.gameDate?.value);
  if (iso) {
    currentGenerationDateIso = iso;
  }
  return currentGenerationDateIso;
}

async function updatePreviewGameDate(event) {
  const iso = syncGenerationDateFromInput();
  const game = getCurrentGame();
  if (!game || !iso) return;
  if (previewGame || game.status === "preview") {
    game.date = iso;
    if (previewGame) previewGame.date = iso;
    renderCurrentGame();
    return;
  }
  if (event?.type === "input") return;
  await updateGameDate(game.id, iso);
}

async function confirmPreviewGame() {
  if (!requireAdmin()) return;
  const game = getCurrentGame();
  if (!game) return;
  const officialGame = {
    ...ensureGameShape({ ...game }),
    id: `game-${Date.now()}`,
    status: game.scoreA == null || game.scoreB == null ? "open" : "finished",
  };
  state.games.unshift(officialGame);
  currentGameId = officialGame.id;
  previewGame = null;
  await persistState();
  selectedIds.clear();
  currentSuggestions = [];
  els.suggestions.innerHTML = `<div class="hint good">Jogo confirmado e guardado no historico.</div>`;
  render();
}

function renderCurrentGame() {
  const game = getCurrentGame();
  const hasGame = Boolean(game);
  els.currentGameEmpty.classList.toggle("hidden", hasGame);
  els.currentGame.classList.toggle("hidden", !hasGame);
  els.exportImage.disabled = !hasGame;
  if (els.confirmGame) els.confirmGame.disabled = !hasGame || game.status !== "preview";
  if (!game) return;

  if (game.date && document.activeElement !== els.gameDate) {
    setGameDateInput(game.date);
  }
  els.scoreA.value = game.scoreA ?? "";
  els.scoreB.value = game.scoreB ?? "";
  els.fieldCard.innerHTML = renderField(game);
  bindMvpPanelActions(game);
  renderRosterEditor(game);
  renderAddPlayerSelect(game);
}

function renderMvpPanel(game) {
  if (game.scoreA == null || game.scoreB == null) return "";
  const participants = hydrate(getGamePlayerIds(game));
  const linkedPlayer = getLinkedPlayer();
  const canVote = linkedPlayer && participants.some((p) => p.id === linkedPlayer.id);
  const counts = getMvpVoteCountsForGame(game.id);
  const totalVotes = getMvpTotalVotes(game.id);
  const votingClosed = isMvpVotingClosed(game);
  const winners = votingClosed ? getOfficialMvpWinners(counts) : [];
  const myVote = linkedPlayer ? getMvpVoteForPlayer(game.id, linkedPlayer.id) : null;
  const lockAt = getMvpLockAt(game);
  const statusText = votingClosed
    ? "Votacao fechada"
    : totalVotes < MVP_MIN_VOTES
      ? `${totalVotes} votos (min. ${MVP_MIN_VOTES})`
      : lockAt ? `Fecha ${formatDate(lockAt.toISOString())}` : `${totalVotes} votos`;
  return `
    <section class="mvp-panel">
      <div>
        <p class="eyebrow">MVP interno</p>
        <strong>${winners.length ? winners.map((p) => escapeHtml(p.name)).join(", ") : statusText}</strong>
        ${renderMvpAdminVoteBreakdown(game, counts)}
      </div>
      ${canVote && myVote ? `
        <span class="metric good-pill">Voto registado</span>
      ` : canVote ? `
        <select data-mvp-candidate="${game.id}">
          <option value="">Escolher MVP</option>
          ${participants.filter((p) => p.id !== linkedPlayer.id).map((p) => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join("")}
        </select>
        <button class="ghost-btn" data-save-mvp-vote="${game.id}">Votar</button>
      ` : `<span class="metric">So participantes votam</span>`}
    </section>
  `;
}

function getLatestFinishedGame() {
  return [...state.games]
    .filter(isFinishedGame)
    .sort((a, b) => new Date(b.date) - new Date(a.date))[0] || null;
}

function getPendingMvpVoteRequirement() {
  const linkedPlayer = getLinkedPlayer();
  if (!linkedPlayer) return null;
  const game = getFinishedGamesDesc(state.games)
    .find((item) => getPlayerParticipation(item, linkedPlayer.id));
  if (!game) return null;
  const participants = hydrate(getGamePlayerIds(game));
  if (getMvpVoteForPlayer(game.id, linkedPlayer.id)) return null;
  const candidates = participants.filter((playerData) => playerData.id !== linkedPlayer.id);
  if (!candidates.length) return null;
  return { game, linkedPlayer, candidates };
}

function renderMvpVoteGate() {
  if (!els.mvpGate) return;
  const requirement = getPendingMvpVoteRequirement();
  document.body.classList.toggle("mvp-gate-open", Boolean(requirement));
  els.mvpGate.classList.toggle("hidden", !requirement);
  if (!requirement) {
    els.mvpGate.innerHTML = "";
    if (renderOfficialMvpRevealGate()) return;
    renderAwardRevealGate();
    return;
  }

  const { game, candidates } = requirement;
  els.mvpGate.innerHTML = `
    <div class="mvp-gate-card">
      <p class="eyebrow">Voto MVP pendente</p>
      <h2>Vota no MVP do ultimo jogo para continuar</h2>
      <p>${formatDate(game.date)} - ${game.scoreA} - ${game.scoreB}</p>
      <select data-gate-mvp-candidate="${game.id}">
        <option value="">Escolher MVP</option>
        ${candidates.map((playerData) => `<option value="${playerData.id}">${escapeHtml(playerData.name)}</option>`).join("")}
      </select>
      <button class="primary-btn" data-gate-save-mvp-vote="${game.id}">Votar e continuar</button>
      <span class="hint">O voto e confidencial. Nao podes votar em ti proprio.</span>
    </div>
  `;

  els.mvpGate.querySelector("[data-gate-save-mvp-vote]")?.addEventListener("click", async () => {
    const linkedPlayer = getLinkedPlayer();
    const select = els.mvpGate.querySelector(`[data-gate-mvp-candidate="${game.id}"]`);
    const candidateId = select?.value;
    if (!linkedPlayer || !candidateId) return;
    const ok = await saveMvpVote(game, linkedPlayer, candidateId);
    if (ok) render();
  });
}

function getPendingAwardRevealRequirement() {
  const linkedPlayer = getLinkedPlayer();
  if (!linkedPlayer) return null;
  const seen = getSeenAwardReveals();
  const game = getFinishedGamesDesc(state.games)
    .find((item) => getPlayerParticipation(item, linkedPlayer.id));
  if (!game || !getMvpVoteForPlayer(game.id, linkedPlayer.id)) return null;
  const awards = getAwardsUnlockedByGame(linkedPlayer.id, game)
    .filter((award) => !seen.has(getAwardRevealKey(linkedPlayer.id, game.id, award.key)));
  return awards.length ? { playerData: linkedPlayer, game, awards, seen } : null;
}

function getPendingOfficialMvpRevealRequirement() {
  const linkedPlayer = getLinkedPlayer();
  if (!linkedPlayer) return null;
  const game = getFinishedGamesDesc(state.games)
    .find((item) => getPlayerParticipation(item, linkedPlayer.id));
  if (!game || !isMvpVotingClosed(game)) return null;
  const mvpIds = getOfficialMvpIdsForGame(game);
  if (!mvpIds.has(linkedPlayer.id)) return null;
  const seen = getSeenAwardReveals();
  const revealKey = getAwardRevealKey(linkedPlayer.id, game.id, "official_mvp");
  if (seen.has(revealKey)) return null;
  const variantKey = getMvpStreakCardKey(linkedPlayer.id, game);
  const variant = PLAYER_CARD_VARIANTS[variantKey] || PLAYER_CARD_VARIANTS.mvp;
  return { playerData: linkedPlayer, game, variant, seen, revealKey };
}

function renderOfficialMvpRevealGate() {
  if (!els.mvpGate) return false;
  const requirement = getPendingOfficialMvpRevealRequirement();
  if (!requirement) return false;
  document.body.classList.add("mvp-gate-open");
  els.mvpGate.classList.remove("hidden");
  const { playerData, game, variant, seen, revealKey } = requirement;
  els.mvpGate.innerHTML = `
    <div class="award-reveal-card mvp-reveal-card">
      <p class="eyebrow">MVP interno</p>
      <h2>Foste eleito MVP</h2>
      <p>${formatDate(game.date)} - ${game.scoreA} - ${game.scoreB}</p>
      <div class="award-reveal-track single">
        <article class="award-reveal-item">
          ${renderPlayerCard(playerData, { mode: "award", variant })}
          <div class="award-reveal-copy">
            <strong class="award-reveal-title">${escapeHtml(variant.label)}</strong>
            <p class="award-reveal-description">Foste eleito MVP deste jogo pelos votos fechados.</p>
          </div>
        </article>
      </div>
      <button class="primary-btn" data-dismiss-mvp-reveal>Continuar</button>
    </div>
  `;
  els.mvpGate.querySelector("[data-dismiss-mvp-reveal]")?.addEventListener("click", () => {
    seen.add(revealKey);
    saveSeenAwardReveals(seen);
    render();
  });
  return true;
}

function renderAwardRevealGate() {
  if (!els.mvpGate) return;
  const requirement = getPendingAwardRevealRequirement();
  if (!requirement) return;
  document.body.classList.add("mvp-gate-open");
  els.mvpGate.classList.remove("hidden");
  const { playerData, game, awards, seen } = requirement;
  els.mvpGate.innerHTML = `
    <div class="award-reveal-card">
      <p class="eyebrow">Carta desbloqueada</p>
      <h2>${awards.length > 1 ? "Novas cartas desbloqueadas" : "Nova carta desbloqueada"}</h2>
      ${awards.length > 1 ? `<p class="award-reveal-count" data-award-reveal-count>${awards.length} cartas desbloqueadas</p>` : ""}
      <p>${formatDate(game.date)}</p>
      <div class="award-reveal-track" aria-label="Cartas desbloqueadas">
        ${awards.map((award) => renderAwardRevealItem(playerData, award)).join("")}
      </div>
      <button class="primary-btn" data-dismiss-award-reveal>Continuar</button>
    </div>
  `;
  els.mvpGate.querySelector("[data-dismiss-award-reveal]")?.addEventListener("click", () => {
    awards.forEach((award) => seen.add(getAwardRevealKey(playerData.id, game.id, award.key)));
    saveSeenAwardReveals(seen);
    render();
  });
}

function renderAwardRevealItem(playerData, award) {
  return `
    <article class="award-reveal-item">
      ${renderPlayerCard(playerData, { mode: "award", variant: award })}
      <div class="award-reveal-copy">
        <strong class="award-reveal-title">${escapeHtml(award.label)}</strong>
        <p class="award-reveal-description">${escapeHtml(award.description)}</p>
      </div>
    </article>
  `;
}

function countMvpVotes(votes) {
  const counts = new Map();
  votes.forEach((vote) => counts.set(vote.candidatePlayerId, (counts.get(vote.candidatePlayerId) || 0) + 1));
  return counts;
}

function getMvpVoteCountsForGame(gameId) {
  if (!gameId) return new Map();
  if (remoteEnabled && currentSession?.user) {
    const counts = new Map();
    mvpVoteCounts
      .filter((row) => row.gameId === gameId)
      .forEach((row) => counts.set(row.candidatePlayerId, row.voteCount));
    return counts;
  }
  return countMvpVotes(gameMvpVotes.filter((vote) => vote.gameId === gameId));
}

function getMvpTotalVotes(gameId) {
  return [...getMvpVoteCountsForGame(gameId).values()].reduce((sum, count) => sum + count, 0);
}

function getMvpVoteForPlayer(gameId, playerId) {
  return gameMvpVotes.find((vote) => vote.gameId === gameId && vote.voterPlayerId === playerId) || null;
}

function incrementMvpVoteCount(gameId, candidatePlayerId) {
  const index = mvpVoteCounts.findIndex((row) => row.gameId === gameId && row.candidatePlayerId === candidatePlayerId);
  if (index >= 0) {
    mvpVoteCounts[index] = { ...mvpVoteCounts[index], voteCount: mvpVoteCounts[index].voteCount + 1 };
  } else {
    mvpVoteCounts.push({ gameId, candidatePlayerId, voteCount: 1 });
  }
}

function getOfficialMvpWinners(counts) {
  const entries = [...counts.entries()];
  const totalVotes = entries.reduce((sum, [, count]) => sum + count, 0);
  if (totalVotes < MVP_MIN_VOTES) return [];
  const max = Math.max(...entries.map(([, count]) => count));
  return entries.filter(([, count]) => count === max).map(([id]) => findPlayer(id)).filter(Boolean);
}

function getMvpLockAt(game) {
  const referenceDate = game?.scoreSavedAt || game?.date;
  if (!referenceDate) return null;
  const time = new Date(referenceDate).getTime();
  if (Number.isNaN(time)) return null;
  return new Date(time + MVP_LOCK_HOURS * 60 * 60 * 1000);
}

function hasMinimumMvpVotes(game) {
  return getMvpTotalVotes(game?.id) >= MVP_MIN_VOTES;
}

function isMvpVotingClosed(game) {
  const lockAt = getMvpLockAt(game);
  return Boolean(lockAt && hasMinimumMvpVotes(game) && Date.now() >= lockAt.getTime());
}

function renderMvpAdminVoteBreakdown(game, counts) {
  if (!isAdmin || !counts.size) return "";
  const rows = [...counts.entries()]
    .map(([playerId, count]) => ({ playerData: findPlayer(playerId), count }))
    .filter((item) => item.playerData)
    .sort((a, b) => b.count - a.count || a.playerData.name.localeCompare(b.playerData.name));
  if (!rows.length) return "";
  return `
    <div class="mvp-breakdown admin-only">
      ${rows.map((item) => `<span>${escapeHtml(item.playerData.name)}: <strong>${item.count}</strong></span>`).join("")}
    </div>
  `;
}

function bindMvpPanelActions(game, root = els.fieldCard) {
  root?.querySelector("[data-save-mvp-vote]")?.addEventListener("click", async () => {
    const linkedPlayer = getLinkedPlayer();
    const select = root.querySelector(`[data-mvp-candidate="${game.id}"]`);
    const candidateId = select?.value;
    if (!linkedPlayer || !candidateId) return;
    const ok = await saveMvpVote(game, linkedPlayer, candidateId);
    if (ok) {
      if (currentHistoryGameId === game.id) renderHistoryGameDetail();
      else renderCurrentGame();
    }
  });
}

async function saveMvpVote(game, linkedPlayer, candidateId) {
  const participants = new Set(getGamePlayerIds(game));
  if (!linkedPlayer || !candidateId || linkedPlayer.id === candidateId) return false;
  if (!participants.has(linkedPlayer.id) || !participants.has(candidateId)) return false;

  let vote = getMvpVoteForPlayer(game.id, linkedPlayer.id);
  if (vote) {
    alert("O teu voto MVP ja foi registado e nao pode ser alterado.");
    return false;
  } else {
    vote = {
      id: createUuid(),
      gameId: game.id,
      voterPlayerId: linkedPlayer.id,
      candidatePlayerId: candidateId,
      userId: currentSession?.user?.id || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const previousVotes = [...gameMvpVotes];
    gameMvpVotes.push(vote);
    try {
      await persistMvpVote(vote);
      incrementMvpVoteCount(game.id, candidateId);
    } catch (error) {
      gameMvpVotes = previousVotes;
      saveState();
      alert(`Nao consegui guardar voto MVP. Confirma se executaste o schema.sql no Supabase. Detalhe: ${error.message}`);
      return false;
    }
  }
  return true;
}

function renderField(game, options = {}) {
  const teamA = hydrate(game.teamA);
  const teamB = hydrate(game.teamB);
  const benchA = hydrate(getBenchA(game));
  const benchB = hydrate(getBenchB(game));
  const squadA = [...teamA, ...benchA];
  const squadB = [...teamB, ...benchB];
  const result = game.scoreA == null || game.scoreB == null ? "vs" : `${game.scoreA} - ${game.scoreB}`;
  const date = formatDate(game.date);
  const radar = renderTeamRadarChart(squadA, squadB, { inlineOdds: Boolean(options.radarInlineOdds) });
  const radarPosition = options.radarPosition || "top";

  return `
    <div class="field-head">
      <div>
        <strong>Equipa A</strong>
      </div>
      <div class="score-block">
        <span>${date}</span>
        <strong>${result}</strong>
      </div>
      <div class="right">
        <strong>Equipa B</strong>
      </div>
    </div>
    ${radarPosition === "top" ? radar : ""}
    <div class="pitch">
      ${orderTeamForField(squadA).map((p, i) => renderDot(p, "team-a", getPosition("a", i, squadA.length), game, options)).join("")}
      ${orderTeamForField(squadB).map((p, i) => renderDot(p, "team-b", getPosition("b", i, squadB.length), game, options)).join("")}
    </div>
    ${renderMvpPanel(game)}
    ${radarPosition === "bottom" ? radar : ""}
  `;
}

function renderDot(playerData, teamClass, pos, game = null, options = {}) {
  const form = getPlayerForm(playerData);
  const variant = getPlayerCardVariant(playerData, form, game);
  const playerAttr = options.clickablePlayers ? ` data-open-field-player="${playerData.id}" role="button" tabindex="0"` : "";
  return `
    <div class="player-dot ${teamClass} card-variant-${variant.key}"${playerAttr} style="left:${pos.x}%;top:${pos.y}%;--field-offset-x:${pos.offsetXPx || 0}px">
      ${renderPlayerCard(playerData, { mode: "field", form, variant })}
    </div>
  `;
}

function getGameResultText(game) {
  return game.scoreA == null || game.scoreB == null ? "Resultado em aberto" : `${game.scoreA} - ${game.scoreB}`;
}

function getPlayerResultText(game, side) {
  if (game.scoreA == null || game.scoreB == null) return "Resultado em aberto";
  return side === "B" ? `${game.scoreB} - ${game.scoreA}` : `${game.scoreA} - ${game.scoreB}`;
}

function renderPlayerCard(playerData, options = {}) {
  const form = options.form || getPlayerForm(playerData);
  const variant = options.variant || getPlayerCardVariant(playerData, form);
  const mode = options.mode || "field";
  const rating = canSeeCurrentRatings() ? form.currentRating : playerData.overall;
  return `
    <article class="player-card player-card-${mode} card-variant-${variant.key}" style="--card-bg: url('${variant.asset}')">
      <div class="card-rating">
        <strong>${rating}</strong>
      </div>
      <div class="card-photo">
        ${renderPlayerCardPhoto(playerData)}
      </div>
      <strong class="card-name">${escapeHtml(shortName(playerData.name, mode === "profile" ? 15 : 11))}</strong>
      <div class="card-stats">
        ${renderFutStats(playerData)}
      </div>
    </article>
  `;
}

function renderPlayerCardPhoto(playerData) {
  if (playerData.photoDataUrl) {
    return `<img src="${escapeHtml(playerData.photoDataUrl)}" alt="">`;
  }
  return `<span>${escapeHtml(initials(playerData.name))}</span>`;
}

function renderFutStats(playerData) {
  return [
    ["PAC", playerData.pace],
    ["SHO", playerData.shooting],
    ["PAS", playerData.passing],
    ["DRI", playerData.dribbling],
    ["DEF", playerData.defending],
    ["PHY", playerData.physical],
  ].map(([label, value]) => `<span><b>${value}</b><em>${label}</em></span>`).join("");
}

function orderTeamForField(players) {
  const remaining = [...players];
  if (remaining.length <= 5) return orderFiveForField(remaining);
  const takeBest = (scoreFn) => {
    let bestIndex = 0;
    for (let i = 1; i < remaining.length; i += 1) {
      if (scoreFn(remaining[i]) > scoreFn(remaining[bestIndex])) bestIndex = i;
    }
    return remaining.splice(bestIndex, 1)[0];
  };

  const backOne = takeBest((p) => p.defending * 2 + p.physical + p.overall * 0.1);
  const backTwo = takeBest((p) => p.defending * 1.6 + p.physical * 1.2 + p.passing * 0.3);
  const wingOne = takeBest((p) => p.dribbling * 2 + p.passing + p.pace * 0.4);
  const wingTwo = takeBest((p) => p.dribbling * 2 + p.passing + p.pace * 0.4);
  const frontOne = takeBest((p) => p.shooting * 2 + p.dribbling + p.overall * 0.2);
  const frontTwo = takeBest((p) => p.shooting * 1.4 + p.pace + p.dribbling * 0.8);

  return [backOne, backTwo, wingOne, wingTwo, frontOne, frontTwo, ...remaining].filter(Boolean);
}

function orderFiveForField(players) {
  const remaining = [...players];
  const takeBest = (scoreFn) => {
    let bestIndex = 0;
    for (let i = 1; i < remaining.length; i += 1) {
      if (scoreFn(remaining[i]) > scoreFn(remaining[bestIndex])) bestIndex = i;
    }
    return remaining.splice(bestIndex, 1)[0];
  };

  const defender = takeBest((p) => p.defending * 2 + p.physical + p.overall * 0.1);
  const wingOne = takeBest((p) => p.dribbling * 2 + p.passing + p.pace * 0.4);
  const wingTwo = takeBest((p) => p.dribbling * 2 + p.passing + p.pace * 0.4);
  const shooter = takeBest((p) => p.shooting * 2 + p.dribbling + p.overall * 0.2);
  const support = remaining[0];

  return [defender, wingOne, wingTwo, shooter, support].filter(Boolean);
}

function renderBenchCards(label, players, teamClass, game = null) {
  if (!players.length) return `<span class="bench-empty">${label}: sem suplente</span>`;
  return players.map((p) => `
    <div class="bench-card">
      ${renderDot(p, teamClass, { x: 50, y: 50 }, game).replace("player-dot", "player-dot bench-dot")}
      <span class="bench-label">${label}</span>
    </div>
  `).join("");
}

function renderAvatar(playerData) {
  if (playerData.photoDataUrl) {
    return `<img class="avatar" src="${escapeHtml(playerData.photoDataUrl)}" alt="">`;
  }
  return `<span class="avatar avatar-fallback">${escapeHtml(initials(playerData.name))}</span>`;
}

function getPosition(side, index, teamSize = 5) {
  const leftFive = [
    { x: 11, y: 50 },
    { x: 27, y: 18 },
    { x: 27, y: 82 },
    { x: 41, y: 38, offsetXPx: -12 },
    { x: 41, y: 62, offsetXPx: -12 },
  ];
  const leftSix = [
    { x: 14, y: 38 },
    { x: 14, y: 62 },
    { x: 28, y: 20 },
    { x: 28, y: 80 },
    { x: 42, y: 38, offsetXPx: -12 },
    { x: 42, y: 62, offsetXPx: -12 },
    { x: 35, y: 50, offsetXPx: -12 },
  ];
  const left = teamSize > 5 ? leftSix : leftFive;
  const right = left.map((p) => ({ x: 100 - p.x, y: p.y, offsetXPx: p.offsetXPx ? Math.abs(p.offsetXPx) : 0 }));
  return (side === "a" ? left : right)[index] || { x: side === "a" ? 45 : 55, y: 50 };
}

function renderRosterEditor(game) {
  const groups = [
    ["teamA", "Equipa A"],
    ["teamB", "Equipa B"],
    ["benchA", "Supl. A"],
    ["benchB", "Supl. B"],
  ];

  els.rosterEditor.innerHTML = groups.map(([key, label]) => {
    const players = hydrate(game[key]);
    return `
      <div class="roster-column">
        <h4>${label} (${players.length})</h4>
        ${players.map((p) => renderRosterRow(p, key)).join("") || `<p class="eyebrow">Vazio</p>`}
      </div>
    `;
  }).join("");

  els.rosterEditor.querySelectorAll("[data-move-player]").forEach((button) => {
    button.addEventListener("click", () => movePlayerInGame(button.dataset.movePlayer, button.dataset.toGroup));
  });
  els.rosterEditor.querySelectorAll("[data-remove-player]").forEach((button) => {
    button.addEventListener("click", () => removePlayerFromGame(button.dataset.removePlayer));
  });
}

function renderRosterRow(playerData, currentGroup) {
  const actions = [
    ["teamA", "A"],
    ["teamB", "B"],
    ["benchA", "Supl. A"],
    ["benchB", "Supl. B"],
  ].filter(([key]) => key !== currentGroup);

  return `
    <div class="roster-row">
      <strong>${renderAvatar(playerData)} ${escapeHtml(playerData.name)} - ${playerData.overall}</strong>
      <div class="roster-actions">
        ${actions.map(([key, label]) => `<button class="mini-btn" data-move-player="${playerData.id}" data-to-group="${key}">${label}</button>`).join("")}
        <button class="mini-btn" data-remove-player="${playerData.id}">Remover</button>
      </div>
    </div>
  `;
}

function renderAddPlayerSelect(game) {
  const inGame = new Set(getGamePlayerIds(game));
  const available = state.players.filter((p) => !inGame.has(p.id)).sort((a, b) => a.name.localeCompare(b.name));
  els.addPlayerToGame.innerHTML = available.length
    ? available.map((p) => `<option value="${p.id}">${escapeHtml(p.name)} - ${p.overall}</option>`).join("")
    : `<option value="">Sem jogadores disponiveis</option>`;
}

function movePlayerInGame(playerId, toGroup) {
  if (!requireAdmin()) return;
  const game = getCurrentGame();
  if (!game) return;
  ensureGameShape(game);
  ["teamA", "teamB", "benchA", "benchB"].forEach((group) => {
    game[group] = game[group].filter((id) => id !== playerId);
  });
  game[toGroup].push(playerId);
  if (game.status !== "preview") persistState();
  render();
}

function removePlayerFromGame(playerId) {
  if (!requireAdmin()) return;
  const game = getCurrentGame();
  if (!game) return;
  ensureGameShape(game);
  ["teamA", "teamB", "benchA", "benchB"].forEach((group) => {
    game[group] = game[group].filter((id) => id !== playerId);
  });
  if (game.status !== "preview") persistState();
  render();
}

function addSelectedPlayerToGame() {
  if (!requireAdmin()) return;
  const game = getCurrentGame();
  const playerId = els.addPlayerToGame.value;
  if (!game || !playerId) return;
  ensureGameShape(game);
  game.benchA.push(playerId);
  if (game.status !== "preview") persistState();
  render();
}

async function saveCurrentScore() {
  if (!requireAdmin()) return;
  const game = getCurrentGame();
  if (!game) return;
  const scoreA = els.scoreA.value === "" ? null : Number(els.scoreA.value);
  const scoreB = els.scoreB.value === "" ? null : Number(els.scoreB.value);
  const wasFinished = isFinishedGame(game);
  game.scoreA = Number.isNaN(scoreA) ? null : scoreA;
  game.scoreB = Number.isNaN(scoreB) ? null : scoreB;
  game.status = game.scoreA == null || game.scoreB == null ? "open" : "finished";
  if (game.status === "finished" && !wasFinished) {
    game.scoreSavedAt = new Date().toISOString();
  }
  if (game.status === "finished") {
    completeOriginEventForGame(game);
  }
  if (game.status !== "finished") {
    game.scoreSavedAt = null;
  }
  if (game.status !== "preview") await persistState();
  if (game.status === "finished") {
    currentGameId = null;
    previewGame = null;
    currentSuggestions = [];
    if (els.suggestions) {
      els.suggestions.innerHTML = "";
    }
  }
  render();
}

function completeOriginEventForGame(game) {
  const originEvent = findOriginEventForGame(game);
  if (!originEvent || originEvent.status === "completed") return;
  originEvent.status = "completed";
}

function getGameTitle(game) {
  const title = String(game?.title || game?.name || "").trim();
  if (title) return title;
  const eventData = findEventForGame(game);
  if (eventData?.title) return eventData.title;
  return `Jogo de ${formatDate(game?.date || new Date().toISOString())}`;
}

function findEventForGame(game, options = {}) {
  if (!game) return null;
  const statuses = options.statuses ? new Set(options.statuses) : null;
  const directEvent = game.eventId ? (state.events || []).find((eventData) => eventData.id === game.eventId) : null;
  if (directEvent && (!statuses || statuses.has(directEvent.status))) return directEvent;

  const gameDate = new Date(game.date).getTime();
  const gamePlayerIds = new Set(getGamePlayerIds(game));
  return (state.events || []).find((eventData) => {
    if (statuses && !statuses.has(eventData.status)) return false;
    const eventDate = new Date(eventData.startsAt).getTime();
    if (Math.abs(eventDate - gameDate) > 60 * 1000) return false;
    const goingIds = getEventResponses(eventData.id, "going").map((response) => response.playerId);
    return goingIds.length ? goingIds.every((playerId) => gamePlayerIds.has(playerId)) : true;
  }) || null;
}

function findGameForEventData(eventData) {
  if (!eventData) return null;
  const eventDate = new Date(eventData.startsAt).getTime();
  if (Number.isNaN(eventDate)) return null;
  const goingIds = getEventResponses(eventData.id, "going").map((response) => response.playerId);
  return state.games.find((game) => {
    const gameDate = new Date(game.date).getTime();
    if (Number.isNaN(gameDate) || Math.abs(gameDate - eventDate) > 60 * 1000) return false;
    if (game.eventId && game.eventId === eventData.id) return true;
    const gamePlayerIds = new Set(getGamePlayerIds(game));
    return goingIds.length ? goingIds.every((playerId) => gamePlayerIds.has(playerId)) : true;
  }) || null;
}

async function updateGameDate(gameId, date) {
  if (!requireAdmin()) return false;
  const game = state.games.find((item) => item.id === gameId);
  if (!game) return false;
  const originEvent = findEventForGame(game);
  const previousGameDate = game.date;
  const previousEventDate = originEvent?.startsAt || null;

  game.date = date;
  currentGenerationDateIso = date;
  currentPaymentsMonth = monthKey(date);
  if (originEvent) originEvent.startsAt = date;

  try {
    await persistState();
  } catch (error) {
    game.date = previousGameDate;
    if (originEvent) originEvent.startsAt = previousEventDate;
    saveState();
    alert(`Nao consegui guardar a nova data: ${error.message}`);
    return false;
  }
  render();
  return true;
}

function findOriginEventForGame(game) {
  return findEventForGame(game, { statuses: ["open"] });
}

async function handlePhotoSelection(event) {
  const file = event.target.files[0];
  if (!file) return;
  try {
    pendingPhotoDataUrl = await resizePhoto(file);
  } catch (error) {
    alert("Nao consegui carregar essa foto.");
    pendingPhotoDataUrl = null;
  }
}

function clearPendingPhoto() {
  pendingPhotoDataUrl = "";
  if (els.formPhoto) els.formPhoto.value = "";
}

function resizePhoto(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxSide = 720;
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function renderPlayersTable() {
  if (!els.playersTable) return;
  const players = [...state.players].sort((a, b) => a.name.localeCompare(b.name));
  els.playersTable.innerHTML = players.map((p) => {
    const form = getPlayerForm(p);
    const variant = getPlayerCardVariant(p, form);
    return `
      <tr class="player-table-row ${renderCardHaloClass(p, variant)}">
        <td><button class="player-open-link ${renderCardHaloClass(p, variant)}" data-open-player="${p.id}" type="button">${renderAvatar(p)}</button></td>
        <td><button class="player-name-link" data-open-player="${p.id}" type="button"><strong>${escapeHtml(p.name)}</strong>${p.isGuest ? " <span class=\"metric\">Guest</span>" : ""}</button></td>
        <td class="ovr-col">${renderRatingBadge(p, form)}</td>
        <td class="stat-col">${p.pace}</td>
        <td class="stat-col">${p.shooting}</td>
        <td class="stat-col">${p.passing}</td>
        <td class="stat-col">${p.dribbling}</td>
        <td class="stat-col">${p.defending}</td>
        <td class="stat-col">${p.physical}</td>
        <td class="admin-only">${renderLinkedAccountCell(p)}</td>
        <td class="admin-only">
          <button class="mini-btn" data-edit-player="${p.id}">Editar</button>
          ${p.linkedUserId ? `<button class="mini-btn" data-unlink-player="${p.id}">Desassociar</button>` : ""}
          <button class="mini-btn" data-delete-player="${p.id}">Apagar</button>
        </td>
        <td class="form-col">${renderRecordDots(form.recentRecord, { chronological: true })}</td>
      </tr>
    `;
  }).join("");

  els.playersTable.querySelectorAll("[data-edit-player]").forEach((button) => {
    button.addEventListener("click", () => editPlayer(button.dataset.editPlayer));
  });
  els.playersTable.querySelectorAll("[data-delete-player]").forEach((button) => {
    button.addEventListener("click", () => deletePlayer(button.dataset.deletePlayer));
  });
  els.playersTable.querySelectorAll("[data-unlink-player]").forEach((button) => {
    button.addEventListener("click", () => unlinkPlayerAsAdmin(button.dataset.unlinkPlayer));
  });
  els.playersTable.querySelectorAll("[data-open-player]").forEach((button) => {
    button.addEventListener("click", () => openPlayerProfile(button.dataset.openPlayer));
  });
}

function renderLinkedAccountCell(playerData) {
  if (!playerData.linkedUserId) return "<span class=\"metric\">Livre</span>";
  const profile = knownProfiles.find((item) => item.id === playerData.linkedUserId);
  if (!profile) return "<span class=\"metric\">Ligado</span>";
  return `
    <span class="linked-account">
      <strong>${escapeHtml(profile.username || profile.display_name || "Conta")}</strong>
      <small>${escapeHtml(profile.email || "")}</small>
    </span>
  `;
}

function getPartialRatingInputs() {
  return [els.formPace, els.formShooting, els.formPassing, els.formDribbling, els.formDefending, els.formPhysical].filter(Boolean);
}

function updateOverallFromPartialRatings() {
  if (!els.formOverall) return;
  const values = getPartialRatingInputs().map((input) => clampRating(input.value));
  if (values.length !== 6) return;
  const average = Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
  els.formOverall.value = average;
}

async function savePlayerFromForm(event) {
  event.preventDefault();
  if (!requireAdmin()) return;
  updateOverallFromPartialRatings();
  const values = {
    id: els.playerId.value || `p-${Date.now()}-${slug(els.formName.value)}`,
    name: els.formName.value.trim(),
    pace: clampRating(els.formPace.value),
    shooting: clampRating(els.formShooting.value),
    passing: clampRating(els.formPassing.value),
    dribbling: clampRating(els.formDribbling.value),
    defending: clampRating(els.formDefending.value),
    physical: clampRating(els.formPhysical.value),
    overall: clampRating(els.formOverall.value),
    photoDataUrl: pendingPhotoDataUrl || "",
    isGuest: false,
  };
  if (!values.name) return;

  const index = state.players.findIndex((p) => p.id === values.id);
  if (index >= 0) {
    state.players[index] = { ...state.players[index], ...values };
  } else {
    state.players.push(values);
  }
  clearPlayerForm();
  await persistState();
  render();
}

function editPlayer(playerId) {
  if (!requireAdmin()) return;
  const p = findPlayer(playerId);
  if (!p) return;
  els.playerId.value = p.id;
  els.formName.value = p.name;
  els.formPace.value = p.pace;
  els.formShooting.value = p.shooting;
  els.formPassing.value = p.passing;
  els.formDribbling.value = p.dribbling;
  els.formDefending.value = p.defending;
  els.formPhysical.value = p.physical;
  els.formOverall.value = p.overall;
  updateOverallFromPartialRatings();
  pendingPhotoDataUrl = p.photoDataUrl || "";
  showView("players");
}

async function deletePlayer(playerId) {
  if (!requireAdmin()) return;
  const playerData = findPlayer(playerId);
  if (!playerData) return;
  if (!confirm(`Apagar o jogador ${playerData.name}?`)) return;
  if (remoteEnabled && supabaseClient) {
    const { error } = await supabaseClient.from("players").delete().eq("id", playerId);
    if (error) {
      alert(`Nao consegui apagar jogador: ${error.message}`);
      return;
    }
  }
  state.players = state.players.filter((p) => p.id !== playerId);
  selectedIds.delete(playerId);
  state.games.forEach((game) => {
    ensureGameShape(game);
    ["teamA", "teamB", "benchA", "benchB"].forEach((group) => {
      game[group] = game[group].filter((id) => id !== playerId);
    });
  });
  saveState();
  render();
}

async function unlinkPlayerAsAdmin(playerId) {
  if (!requireAdmin()) return;
  const playerData = findPlayer(playerId);
  if (!playerData?.linkedUserId) return;
  if (!confirm(`Desassociar a conta ligada ao perfil ${playerData.name}?`)) return;
  await unlinkPlayerProfile(playerId);
}

async function unlinkPlayerProfile(playerId) {
  const index = state.players.findIndex((p) => p.id === playerId);
  if (index < 0) return;
  state.players[index].linkedUserId = null;
  if (remoteEnabled && supabaseClient) {
    const { error } = await supabaseClient
      .from("players")
      .update({ linked_user_id: null, updated_at: new Date().toISOString() })
      .eq("id", playerId);
    if (error) {
      alert(`Nao consegui desassociar perfil: ${error.message}`);
      return;
    }
  }
  await loadAccountState();
  saveState();
  updateAccessUi();
  render();
}

function clearPlayerForm() {
  if (els.playerForm) els.playerForm.reset();
  if (els.playerId) els.playerId.value = "";
  pendingPhotoDataUrl = null;
}

function renderGamesList() {
  if (!state.games.length) {
    els.gamesList.innerHTML = `<div class="empty-state">Ainda nao ha jogos confirmados.</div>`;
    return;
  }

  els.gamesList.innerHTML = state.games.map((game) => {
    const teamA = hydrate([...(game.teamA || []), ...(getBenchA(game) || [])]);
    const teamB = hydrate([...(game.teamB || []), ...(getBenchB(game) || [])]);
    const result = game.scoreA == null || game.scoreB == null ? "Resultado em aberto" : `${game.scoreA} - ${game.scoreB}`;
    const gameTitle = getGameTitle(game);
    return `
      <article class="game-card">
        <div>
          <p class="eyebrow">${escapeHtml(gameTitle)}</p>
          <strong>${formatDate(game.date)} - ${result}</strong>
          <span>A ${getTeamStats(teamA).total} vs B ${getTeamStats(teamB).total} - ${game.status === "finished" ? "finalizado" : "em aberto"}</span>
          ${renderTeamRadarChart(teamA, teamB, { compact: true, inlineOdds: true })}
        </div>
        <div class="game-actions">
          <button class="primary-btn" data-open-game="${game.id}">Abrir</button>
          <button class="danger-btn admin-only" data-delete-game="${game.id}">Apagar</button>
        </div>
      </article>
    `;
  }).join("");

  els.gamesList.querySelectorAll("[data-open-game]").forEach((button) => {
    button.addEventListener("click", () => {
      const game = state.games.find((item) => item.id === button.dataset.openGame);
      if (isFinishedGame(game)) {
        currentHistoryGameId = game.id;
        currentGameId = null;
        showView("history-game");
        renderHistoryGameDetail();
        return;
      }
      currentGameId = game?.id || button.dataset.openGame;
      currentHistoryGameId = null;
      showView("today");
      renderCurrentGame();
    });
  });
  els.gamesList.querySelectorAll("[data-delete-game]").forEach((button) => {
    button.addEventListener("click", () => deleteGame(button.dataset.deleteGame));
  });
}

function renderHistoryGameDetail() {
  if (!els.historyGameDetail) return;
  const game = state.games.find((item) => item.id === currentHistoryGameId);
  if (!game) {
    els.historyGameDetail.innerHTML = `<div class="empty-state">Escolhe um jogo finalizado no historico.</div>`;
    return;
  }
  const gameTitle = getGameTitle(game);
  els.historyGameDetail.innerHTML = `
    <div class="history-game-title">
      <p class="eyebrow">Historico de jogo</p>
      <h3>${escapeHtml(gameTitle)}</h3>
      <div class="history-game-date-edit admin-actions">
        <label class="game-date-control">
          <span>Data/hora</span>
          <input type="datetime-local" data-history-game-date="${game.id}" value="${toDateTimeLocalInput(game.date)}">
        </label>
        <button class="ghost-btn" data-save-history-game-date="${game.id}">Guardar data</button>
      </div>
    </div>
    <div class="field-card history-field-card">
      ${renderField(game, { radarPosition: "bottom", clickablePlayers: true, radarInlineOdds: true })}
    </div>
    ${renderHistoryRosterEditor(game)}
  `;
  els.historyGameDetail.querySelector("[data-save-history-game-date]")?.addEventListener("click", async (buttonEvent) => {
    const gameId = buttonEvent.currentTarget.dataset.saveHistoryGameDate;
    const input = [...els.historyGameDetail.querySelectorAll("[data-history-game-date]")]
      .find((item) => item.dataset.historyGameDate === gameId);
    const date = fromDateTimeLocalInput(input?.value);
    if (!date) {
      alert("Escolhe uma data e hora valida.");
      return;
    }
    await updateGameDate(gameId, date);
  });
  els.historyGameDetail.querySelectorAll("[data-open-field-player]").forEach((card) => {
    card.addEventListener("click", () => openPlayerProfile(card.dataset.openFieldPlayer));
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openPlayerProfile(card.dataset.openFieldPlayer);
      }
    });
  });
  bindHistoryRosterEditorActions(game);
  bindMvpPanelActions(game, els.historyGameDetail);
}

function renderHistoryRosterEditor(game) {
  if (!isAdmin) return "";
  const groups = [
    ["teamA", "Equipa A"],
    ["teamB", "Equipa B"],
    ["benchA", "Supl. A"],
    ["benchB", "Supl. B"],
  ];
  const inGame = new Set(getGamePlayerIds(game));
  const availablePlayers = state.players
    .filter((playerData) => !inGame.has(playerData.id))
    .sort((a, b) => a.name.localeCompare(b.name));

  return `
    <section class="profile-section history-roster-section admin-actions">
      <div class="finance-settings-head">
        <div>
          <h3>Editar equipas do jogo</h3>
          <p>Alterar a equipa corrige historico, forma e cartas. Pagamentos seguem os participantes atuais se nao houver override manual.</p>
        </div>
      </div>
      <div class="roster-editor history-roster-editor">
        ${groups.map(([key, label]) => {
          const players = hydrate(game[key] || []);
          return `
            <div class="roster-column">
              <h4>${label} (${players.length})</h4>
              ${players.map((playerData) => renderHistoryRosterRow(game.id, playerData, key)).join("") || `<p class="eyebrow">Vazio</p>`}
            </div>
          `;
        }).join("")}
      </div>
      <div class="history-roster-tools">
        <select data-history-add-player="${game.id}">
          <option value="">Adicionar jogador ao jogo</option>
          ${availablePlayers.map((playerData) => `<option value="${playerData.id}">${escapeHtml(playerData.name)} - ${playerData.overall}</option>`).join("")}
        </select>
        <button class="ghost-btn" data-history-add-to-team="${game.id}" data-to-group="teamA" ${availablePlayers.length ? "" : "disabled"}>Adicionar A</button>
        <button class="ghost-btn" data-history-add-to-team="${game.id}" data-to-group="teamB" ${availablePlayers.length ? "" : "disabled"}>Adicionar B</button>
        <button class="ghost-btn" data-reset-attendance-overrides="${game.id}">Recalcular presencas/pagamentos</button>
      </div>
    </section>
  `;
}

function renderHistoryRosterRow(gameId, playerData, currentGroup) {
  const actions = [
    ["teamA", "A"],
    ["teamB", "B"],
    ["benchA", "Supl. A"],
    ["benchB", "Supl. B"],
  ].filter(([key]) => key !== currentGroup);

  return `
    <div class="roster-row">
      <strong>${renderAvatar(playerData)} ${escapeHtml(playerData.name)} - ${playerData.overall}</strong>
      <div class="roster-actions">
        ${actions.map(([key, label]) => `<button class="mini-btn" data-history-move-player="${playerData.id}" data-game-id="${gameId}" data-to-group="${key}">${label}</button>`).join("")}
        <button class="mini-btn" data-history-remove-player="${playerData.id}" data-game-id="${gameId}">Remover</button>
      </div>
    </div>
  `;
}

function bindHistoryRosterEditorActions(game) {
  if (!isAdmin || !els.historyGameDetail) return;
  els.historyGameDetail.querySelectorAll("[data-history-move-player]").forEach((button) => {
    button.addEventListener("click", () => movePlayerInHistoryGame(button.dataset.gameId, button.dataset.historyMovePlayer, button.dataset.toGroup));
  });
  els.historyGameDetail.querySelectorAll("[data-history-remove-player]").forEach((button) => {
    button.addEventListener("click", () => removePlayerFromHistoryGame(button.dataset.gameId, button.dataset.historyRemovePlayer));
  });
  els.historyGameDetail.querySelectorAll("[data-history-add-to-team]").forEach((button) => {
    button.addEventListener("click", () => {
      const select = els.historyGameDetail.querySelector(`[data-history-add-player="${button.dataset.historyAddToTeam}"]`);
      addPlayerToHistoryGame(button.dataset.historyAddToTeam, select?.value, button.dataset.toGroup);
    });
  });
  els.historyGameDetail.querySelector("[data-reset-attendance-overrides]")?.addEventListener("click", () => {
    resetAttendanceOverridesForGame(game.id);
  });
}

async function mutateHistoryGame(gameId, mutation) {
  if (!requireAdmin()) return false;
  const game = state.games.find((item) => item.id === gameId);
  if (!game) return false;
  ensureGameShape(game);
  const previousGame = {
    ...game,
    teamA: [...(game.teamA || [])],
    teamB: [...(game.teamB || [])],
    benchA: [...(game.benchA || [])],
    benchB: [...(game.benchB || [])],
  };
  const previousOverrides = attendanceOverrides.map((item) => ({ ...item }));
  mutation(game);
  currentPaymentsMonth = monthKey(game.date);
  try {
    await persistState();
  } catch (error) {
    Object.assign(game, previousGame);
    attendanceOverrides = previousOverrides;
    saveState();
    alert(`Nao consegui guardar alteracao do jogo: ${error.message}`);
    return false;
  }
  render();
  return true;
}

async function movePlayerInHistoryGame(gameId, playerId, toGroup) {
  if (!["teamA", "teamB", "benchA", "benchB"].includes(toGroup)) return;
  await mutateHistoryGame(gameId, (game) => {
    ["teamA", "teamB", "benchA", "benchB"].forEach((group) => {
      game[group] = (game[group] || []).filter((id) => id !== playerId);
    });
    game[toGroup].push(playerId);
  });
}

async function removePlayerFromHistoryGame(gameId, playerId) {
  if (!confirm("Remover este jogador deste jogo? Isto pode alterar pagamentos se nao houver override manual.")) return;
  await mutateHistoryGame(gameId, (game) => {
    ["teamA", "teamB", "benchA", "benchB"].forEach((group) => {
      game[group] = (game[group] || []).filter((id) => id !== playerId);
    });
  });
}

async function addPlayerToHistoryGame(gameId, playerId, toGroup) {
  if (!playerId || !["teamA", "teamB"].includes(toGroup)) return;
  await mutateHistoryGame(gameId, (game) => {
    ["teamA", "teamB", "benchA", "benchB"].forEach((group) => {
      game[group] = (game[group] || []).filter((id) => id !== playerId);
    });
    game[toGroup].push(playerId);
  });
}

async function resetAttendanceOverridesForGame(gameId) {
  if (!confirm("Recalcular presencas deste jogo a partir das equipas atuais? Overrides manuais deste jogo serao removidos.")) return;
  await mutateHistoryGame(gameId, () => {
    attendanceOverrides = attendanceOverrides.filter((item) => item.gameId !== gameId);
  });
}

async function deleteGame(gameId) {
  if (!requireAdmin()) return;
  const game = state.games.find((item) => item.id === gameId);
  if (!game) return;
  if (!confirm(`Apagar o jogo de ${formatDate(game.date)} do historico?`)) return;

  if (remoteEnabled && supabaseClient) {
    const { error } = await supabaseClient.from("games").delete().eq("id", gameId);
    if (error) {
      alert(`Nao consegui apagar jogo: ${error.message}`);
      return;
    }
  }
  state.games = state.games.filter((item) => item.id !== gameId);
  if (currentGameId === gameId) {
    currentGameId = null;
    previewGame = null;
  }
  if (currentHistoryGameId === gameId) {
    currentHistoryGameId = null;
  }
  saveState();
  render();
}

async function exportCurrentGameImage() {
  const game = getCurrentGame();
  if (!game) return;
  await drawGameCanvas(game);
  const link = document.createElement("a");
  link.download = `jogo-5v5-${formatDateForFile(game.date)}.png`;
  link.href = els.exportCanvas.toDataURL("image/png");
  link.click();
}

async function drawGameCanvas(game) {
  const canvas = els.exportCanvas;
  const ctx = canvas.getContext("2d");
  const teamA = hydrate(game.teamA);
  const teamB = hydrate(game.teamB);
  const benchA = hydrate(getBenchA(game));
  const benchB = hydrate(getBenchB(game));
  const squadA = [...teamA, ...benchA];
  const squadB = [...teamB, ...benchB];
  const result = game.scoreA == null || game.scoreB == null ? "vs" : `${game.scoreA} - ${game.scoreB}`;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#eef2f1";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#16201d";
  ctx.font = "800 64px Segoe UI, Arial";
  ctx.fillText("Jogo 5v5", 90, 105);
  ctx.font = "500 32px Segoe UI, Arial";
  ctx.fillStyle = "#697571";
  ctx.fillText(formatDate(game.date), 90, 150);

  ctx.fillStyle = "#ffffff";
  roundRect(ctx, 90, 200, 1420, 170, 24);
  ctx.fill();

  drawTeamHeader(ctx, "Equipa A", 140, 300, "#1f7a4d");
  drawTeamHeader(ctx, "Equipa B", 1460, 300, "#c86422", "right");
  ctx.textAlign = "center";
  ctx.fillStyle = "#16201d";
  ctx.font = "800 28px Segoe UI, Arial";
  ctx.fillText(formatDate(game.date), 800, 270);
  ctx.font = "900 62px Segoe UI, Arial";
  ctx.fillText(result, 800, 330);
  ctx.textAlign = "left";

  const pitch = { x: 90, y: 410, w: 1420, h: 1230 };
  drawPitch(ctx, pitch);
  for (const [i, p] of orderTeamForField(squadA).entries()) {
    await drawPlayerDot(ctx, p, getCanvasPos(pitch, getPosition("a", i, squadA.length)), "#1f7a4d", game);
  }
  for (const [i, p] of orderTeamForField(squadB).entries()) {
    await drawPlayerDot(ctx, p, getCanvasPos(pitch, getPosition("b", i, squadB.length)), "#c86422", game);
  }
}

function drawTeamHeader(ctx, label, x, y, color, align = "left") {
  ctx.fillStyle = color;
  ctx.font = "900 38px Segoe UI, Arial";
  ctx.textAlign = align;
  ctx.fillText(label, x, y);
  ctx.textAlign = "left";
}

function drawPitch(ctx, pitch) {
  ctx.fillStyle = "#1f7a4d";
  roundRect(ctx, pitch.x, pitch.y, pitch.w, pitch.h, 18);
  ctx.fill();

  ctx.strokeStyle = "rgba(255,255,255,.8)";
  ctx.lineWidth = 5;
  ctx.strokeRect(pitch.x + 18, pitch.y + 18, pitch.w - 36, pitch.h - 36);
  ctx.beginPath();
  ctx.moveTo(pitch.x + pitch.w / 2, pitch.y + 18);
  ctx.lineTo(pitch.x + pitch.w / 2, pitch.y + pitch.h - 18);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(pitch.x + pitch.w / 2, pitch.y + pitch.h / 2, 140, 0, Math.PI * 2);
  ctx.stroke();
}

function getCanvasPos(pitch, pos) {
  return {
    x: pitch.x + pitch.w * (pos.x / 100) + (pos.offsetXPx || 0) * 2,
    y: pitch.y + pitch.h * (pos.y / 100),
  };
}

async function drawPlayerDot(ctx, playerData, pos, color, game = null) {
  const width = pos.cardWidth || 188;
  const height = pos.cardHeight || 258;
  const x = pos.x - width / 2;
  const y = pos.y - height / 2;
  const form = getPlayerForm(playerData);
  const variant = getPlayerCardVariant(playerData, form, game);

  try {
    const cardImg = await loadCardAsset(variant.asset);
    ctx.drawImage(cardImg, x, y, width, height);
  } catch (error) {
    const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
    gradient.addColorStop(0, "#fff2b8");
    gradient.addColorStop(0.52, "#d6aa45");
    gradient.addColorStop(1, "#8a6420");
    ctx.save();
    cardPath(ctx, x, y, width, height);
    ctx.clip();
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, width, height);
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.18;
    ctx.fillRect(x, y, width, height);
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  const photo = getCardPhotoRect(x, y, width, height);
  ctx.save();
  roundRect(ctx, photo.x, photo.y, photo.w, photo.h, Math.max(6, width * 0.05));
  ctx.clip();
  if (playerData.photoDataUrl) {
    try {
      const img = await loadPhoto(playerData.photoDataUrl);
      drawSoftImageCover(ctx, img, photo.x, photo.y, photo.w, photo.h, 6);
    } catch (error) {
      drawInitials(ctx, playerData.name, photo.x + photo.w / 2, photo.y + photo.h / 2, Math.min(photo.w, photo.h));
    }
  } else {
    drawInitials(ctx, playerData.name, photo.x + photo.w / 2, photo.y + photo.h / 2, Math.min(photo.w, photo.h));
  }
  ctx.restore();

  ctx.fillStyle = getCardTextColor(variant);
  ctx.shadowColor = isLightTextCardVariant(variant) ? "rgba(0,0,0,.62)" : "rgba(255,255,255,.58)";
  ctx.shadowBlur = Math.max(2, width * 0.018);
  ctx.shadowOffsetY = Math.max(1, width * 0.004);
  ctx.textAlign = "left";
  ctx.font = `900 ${Math.round(width * 0.086)}px Bahnschrift Condensed, Arial Narrow, Segoe UI, Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(canSeeCurrentRatings() ? form.currentRating : playerData.overall), x + width * 0.1820, y + height * 0.2482);

  const nameBox = {
    x: x + width * 0.12,
    y: y + height * 0.592,
    w: width * 0.76,
    h: height * 0.105,
  };
  ctx.save();
  roundRect(ctx, nameBox.x, nameBox.y, nameBox.w, nameBox.h, Math.max(8, width * 0.035));
  ctx.fillStyle = isLightTextCardVariant(variant) ? "rgba(14, 20, 22, .38)" : "rgba(255, 241, 208, .45)";
  ctx.fill();
  ctx.restore();

  ctx.textAlign = "center";
  ctx.font = `900 ${Math.round(width * 0.092)}px Bahnschrift Condensed, Arial Narrow, Segoe UI, Arial`;
  ctx.fillStyle = getCardTextColor(variant);
  ctx.fillText(shortName(playerData.name, 12).toUpperCase(), x + width * 0.5, y + height * 0.645);

  drawFutStats(ctx, playerData, x, y, width, height, variant);
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
}

function drawFutStats(ctx, playerData, x, y, width, height, variant = PLAYER_CARD_VARIANTS.base) {
  const left = [
    ["PAC", playerData.pace],
    ["SHO", playerData.shooting],
    ["PAS", playerData.passing],
  ];
  const right = [
    ["DRI", playerData.dribbling],
    ["DEF", playerData.defending],
    ["PHY", playerData.physical],
  ];
  const startY = y + height * 0.735;
  const rowGap = height * 0.055;
  ctx.fillStyle = getCardTextColor(variant);
  ctx.font = `800 ${Math.round(width * 0.027)}px Bahnschrift Condensed, Arial Narrow, Segoe UI, Arial`;
  left.forEach(([label, value], index) => {
    ctx.textAlign = "left";
    ctx.fillText(`${value} ${label}`, x + width * 0.19, startY + index * rowGap);
  });
  right.forEach(([label, value], index) => {
    ctx.textAlign = "left";
    ctx.fillText(`${value} ${label}`, x + width * 0.555, startY + index * rowGap);
  });
}

function getCardPhotoRect(x, y, width, height) {
  const photoW = width * 0.49335;
  const photoH = height * 0.426075;
  return {
    x: x + width * 0.3155 - 5,
    y: y + height * 0.66 - photoH,
    w: photoW,
    h: photoH,
  };
}

function cardPath(ctx, x, y, width, height) {
  roundRect(ctx, x, y, width, height, Math.min(22, width * 0.12));
}

function drawImageCover(ctx, img, x, y, width, height) {
  const scale = Math.max(width / img.width, height / img.height);
  const drawWidth = img.width * scale;
  const drawHeight = img.height * scale;
  const dx = x + (width - drawWidth) / 2;
  const dy = y + (height - drawHeight) * 0.38;
  ctx.drawImage(img, dx, dy, drawWidth, drawHeight);
}

function drawSoftImageCover(ctx, img, x, y, width, height, fadePx = 20) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  const softCtx = canvas.getContext("2d");
  const scale = Math.max(width / img.width, height / img.height);
  const drawWidth = img.width * scale;
  const drawHeight = img.height * scale;
  const dx = (width - drawWidth) / 2;
  const dy = (height - drawHeight) * 0.38;
  softCtx.drawImage(img, dx, dy, drawWidth, drawHeight);

  const fade = Math.min(fadePx, width / 4, height / 4);
  softCtx.globalCompositeOperation = "destination-in";
  const horizontal = softCtx.createLinearGradient(0, 0, width, 0);
  horizontal.addColorStop(0, "rgba(0,0,0,0)");
  horizontal.addColorStop(fade / width, "rgba(0,0,0,1)");
  horizontal.addColorStop(1 - fade / width, "rgba(0,0,0,1)");
  horizontal.addColorStop(1, "rgba(0,0,0,0)");
  softCtx.fillStyle = horizontal;
  softCtx.fillRect(0, 0, width, height);

  const vertical = softCtx.createLinearGradient(0, 0, 0, height);
  vertical.addColorStop(0, "rgba(0,0,0,0)");
  vertical.addColorStop(fade / height, "rgba(0,0,0,1)");
  vertical.addColorStop(1 - fade / height, "rgba(0,0,0,1)");
  vertical.addColorStop(1, "rgba(0,0,0,0)");
  softCtx.fillStyle = vertical;
  softCtx.fillRect(0, 0, width, height);
  softCtx.globalCompositeOperation = "source-over";

  ctx.drawImage(canvas, x, y, width, height);
}

async function drawBenchGroup(ctx, label, players, x, y, color, game = null) {
  if (!players.length) {
    ctx.fillStyle = "#fff4d7";
    roundRect(ctx, x, y + 95, 130, 42, 20);
    ctx.fill();
    ctx.fillStyle = "#16201d";
    ctx.font = "700 22px Segoe UI, Arial";
    ctx.fillText(`${label}: vazio`, x + 14, y + 123);
    return;
  }

  for (const [index, playerData] of players.entries()) {
    const cardWidth = 188;
    const cardHeight = 258;
    const centerX = x + cardWidth / 2 + index * (cardWidth + 28);
    const centerY = y + cardHeight / 2;
    await drawPlayerDot(ctx, playerData, { x: centerX, y: centerY, cardWidth, cardHeight }, color, game);
    ctx.fillStyle = "#fff4d7";
    roundRect(ctx, centerX - 70, y + cardHeight + 18, 140, 46, 22);
    ctx.fill();
    ctx.fillStyle = "#16201d";
    ctx.textAlign = "center";
    ctx.font = "900 25px Segoe UI, Arial";
    ctx.fillText(label, centerX, y + cardHeight + 49);
    ctx.textAlign = "left";
  }
}

async function drawPlayerPhoto(ctx, playerData, x, y, size) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, size / 2, 0, Math.PI * 2);
  ctx.clip();

  if (playerData.photoDataUrl) {
    try {
      const img = await loadPhoto(playerData.photoDataUrl);
      ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
    } catch (error) {
      drawInitials(ctx, playerData.name, x, y, size);
    }
  } else {
    drawInitials(ctx, playerData.name, x, y, size);
  }

  ctx.restore();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = Math.max(3, size / 16);
  ctx.beginPath();
  ctx.arc(x, y, size / 2, 0, Math.PI * 2);
  ctx.stroke();
}

function drawInitials(ctx, name, x, y, size) {
  ctx.fillStyle = "#dce6e2";
  ctx.fillRect(x - size / 2, y - size / 2, size, size);
  ctx.fillStyle = "#16201d";
  ctx.font = `900 ${Math.round(size * 0.34)}px Segoe UI, Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(initials(name), x, y + 1);
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
}

function loadPhoto(src) {
  if (photoCache.has(src)) return photoCache.get(src);
  const promise = new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
  photoCache.set(src, promise);
  return promise;
}

function loadCardAsset(src) {
  if (cardAssetCache.has(src)) return cardAssetCache.get(src);
  const promise = new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
  cardAssetCache.set(src, promise);
  return promise;
}

function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `equilibrador-5v5-${formatDateForFile(new Date().toISOString())}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function importData(event) {
  if (!requireAdmin()) return;
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(reader.result);
      if (!Array.isArray(imported.players) || !Array.isArray(imported.games)) {
        throw new Error("Invalid file");
      }
      const migrated = migrateState(imported);
      state.players = migrated.players;
      state.games = migrated.games;
      state.events = migrated.events;
      payments = migrated.payments;
      attendanceOverrides = migrated.attendanceOverrides;
      gameFinanceOverrides = migrated.gameFinanceOverrides;
      financeSettings = migrated.financeSettings;
      selectedIds.clear();
      currentGameId = null;
      persistState();
      render();
    } catch (error) {
      alert("Nao consegui importar esse ficheiro JSON.");
    }
  };
  reader.readAsText(file);
  event.target.value = "";
}

async function resetData() {
  if (!requireAdmin()) return;
  state.players = samplePlayers.map((p) => ({ ...p }));
  state.games = [];
  state.events = [];
  payments = [];
  attendanceOverrides = [];
  gameFinanceOverrides = [];
  financeSettings = { ...defaultFinanceSettings, playerBalances: { ...defaultFinanceSettings.playerBalances } };
  selectedIds.clear();
  currentSuggestions = [];
  currentGameId = null;
  await persistState();
  render();
}

function getSelectedPlayers() {
  return [...selectedIds].map(findPlayer).filter(Boolean);
}

function getCurrentGame() {
  if (previewGame) return ensureGameShape(previewGame);
  const game = state.games.find((item) => item.id === currentGameId) || null;
  return game ? ensureGameShape(game) : null;
}

function isFinishedGame(game) {
  return Boolean(game && (game.status === "finished" || (game.scoreA != null && game.scoreB != null)));
}

function getPlayerForm(playerData, games = state.games) {
  const baseOverall = clampRating(playerData?.overall ?? 0);
  const finishedAppearances = [...games]
    .filter(isFinishedGame)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .map((game) => {
      const participation = getPlayerParticipation(game, playerData.id);
      if (!participation) return null;
      return { game, outcome: getPlayerOutcome(game, participation.side) };
    })
    .filter(Boolean);

  const recent = finishedAppearances.slice(0, FORM_LOOKBACK_GAMES);
  const wins = recent.filter((item) => item.outcome === "win").length;
  const losses = recent.filter((item) => item.outcome === "loss").length;
  const draws = recent.filter((item) => item.outcome === "draw").length;
  const winStreak = countConsecutiveTeamOutcomeStreak(playerData.id, games, "win");
  const lossStreak = countConsecutiveTeamOutcomeStreak(playerData.id, games, "loss");
  const absenceCount = countRecentAbsences(playerData.id, games);

  let adjustment = 0;
  adjustment += wins - losses;
  adjustment += Math.min(2, winStreak);
  adjustment -= Math.min(3, lossStreak);
  if (draws >= 2) adjustment += 1;
  if (absenceCount >= 3) adjustment -= 1;
  adjustment = clampNumber(adjustment, -FORM_RATING_CAP, FORM_RATING_CAP);

  const currentRating = clampRating(baseOverall + adjustment);
  const levelKey = formLevelForAdjustment(adjustment);

  return {
    baseOverall,
    currentRating,
    adjustment,
    levelKey,
    level: FORM_LEVELS[levelKey].label,
    className: FORM_LEVELS[levelKey].className,
    recentGamesCount: recent.length,
    wins,
    draws,
    losses,
    winStreak,
    lossStreak,
    absenceCount,
    recentRecord: recent.map((item) => item.outcome),
  };
}

function countConsecutiveTeamOutcomeStreak(playerId, games, outcome) {
  let streak = 0;
  const finishedGames = [...games]
    .filter(isFinishedGame)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  for (const game of finishedGames) {
    const participation = getPlayerParticipation(game, playerId);
    if (!participation) break;
    if (getPlayerOutcome(game, participation.side) !== outcome) break;
    streak += 1;
  }
  return streak;
}

function countRecentAbsences(playerId, games) {
  return [...games]
    .filter(isFinishedGame)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, FORM_LOOKBACK_GAMES)
    .filter((game) => !getPlayerParticipation(game, playerId))
    .length;
}

function formLevelForAdjustment(adjustment) {
  if (adjustment >= 5) return "hot";
  if (adjustment >= 2) return "good";
  if (adjustment <= -5) return "recovery";
  if (adjustment <= -2) return "bad";
  return "normal";
}

function getPlayerRatingForBalance(playerData) {
  return getPlayerForm(playerData).currentRating;
}

function clampNumber(value, min, max) {
  const number = Number(value);
  if (Number.isNaN(number)) return min;
  return Math.min(max, Math.max(min, number));
}

function findPlayer(id) {
  return state.players.find((p) => p.id === id);
}

function hydrate(ids) {
  return (ids || []).map(findPlayer).filter(Boolean);
}

function ensureGameShape(game) {
  game.teamA = game.teamA || [];
  game.teamB = game.teamB || [];
  game.benchA = game.benchA || [];
  game.benchB = game.benchB || [];
  game.scoreSavedAt = game.scoreSavedAt || null;

  if (Array.isArray(game.bench) && game.bench.length && !game.benchA.length && !game.benchB.length) {
    game.bench.forEach((id, index) => {
      (index % 2 === 0 ? game.benchA : game.benchB).push(id);
    });
  }
  delete game.bench;
  return game;
}

function getBenchA(game) {
  return ensureGameShape(game).benchA;
}

function getBenchB(game) {
  return ensureGameShape(game).benchB;
}

function getGamePlayerIds(game) {
  ensureGameShape(game);
  return [...game.teamA, ...game.teamB, ...game.benchA, ...game.benchB];
}

function getTeamRadarStats(players) {
  return TEAM_RADAR_STATS.map((stat) => ({
    ...stat,
    value: aggregateTeamRadarStat(players, stat.key),
  }));
}

function aggregateTeamRadarStat(players, key) {
  if (!players.length) return 0;
  if (TEAM_RADAR_AGGREGATION !== "power") return avg(players, key);
  const power = TEAM_RADAR_POWER;
  const poweredAverage = players.reduce((sum, playerData) => {
    return sum + Math.pow(Number(playerData[key] || 0), power);
  }, 0) / players.length;
  return Math.round(Math.pow(poweredAverage, 1 / power));
}

function getTeamRadarMax(statsA, statsB) {
  if (!TEAM_RADAR_DYNAMIC_MAX) return TEAM_RADAR_MAX;
  const highestStat = Math.max(
    TEAM_RADAR_MIN,
    ...statsA.map((item) => item.value),
    ...statsB.map((item) => item.value)
  );
  return clampNumber(Math.ceil(highestStat * 1.05), TEAM_RADAR_MIN + 1, 100);
}

function getTeamRadarGridRings(maxValue) {
  const range = Math.max(1, maxValue - TEAM_RADAR_MIN);
  return [0, 0.25, 0.5, 0.75, 1].map((step) => Math.round(TEAM_RADAR_MIN + range * step));
}

function radarPoint(centerX, centerY, radius, index, total, value = 100, maxValue = TEAM_RADAR_MAX) {
  const angle = -Math.PI / 2 + (Math.PI * 2 * index) / total;
  const scaleMax = Math.max(TEAM_RADAR_MIN + 1, maxValue);
  const normalizedValue = (clampNumber(value, TEAM_RADAR_MIN, scaleMax) - TEAM_RADAR_MIN) / (scaleMax - TEAM_RADAR_MIN);
  const scaledRadius = radius * normalizedValue;
  return {
    x: centerX + Math.cos(angle) * scaledRadius,
    y: centerY + Math.sin(angle) * scaledRadius,
  };
}

function radarPolygonPoints(values, centerX, centerY, radius, maxValue) {
  return values.map((item, index) => {
    const point = radarPoint(centerX, centerY, radius, index, values.length, item.value, maxValue);
    return `${point.x.toFixed(1)},${point.y.toFixed(1)}`;
  }).join(" ");
}

function renderTeamRadarChart(teamA, teamB, options = {}) {
  const compact = Boolean(options.compact);
  const inlineOdds = Boolean(options.inlineOdds);
  const statsA = getTeamRadarStats(teamA);
  const statsB = getTeamRadarStats(teamB);
  const odds = getTeamWinProbabilities(statsA, statsB);
  const centerX = 110;
  const centerY = compact ? 88 : 98;
  const radius = compact ? 44 : 56;
  const radarMax = getTeamRadarMax(statsA, statsB);
  const gridRings = getTeamRadarGridRings(radarMax);
  const labels = TEAM_RADAR_STATS.map((stat, index) => {
    const point = radarPoint(centerX, centerY, radius + (compact ? 24 : 30), index, TEAM_RADAR_STATS.length, radarMax, radarMax);
    const valueA = statsA[index]?.value ?? 0;
    const valueB = statsB[index]?.value ?? 0;
    return `
      <text class="team-radar-axis-label" x="${point.x.toFixed(1)}" y="${point.y.toFixed(1)}" text-anchor="middle" dominant-baseline="middle">
        <tspan class="axis-name" x="${point.x.toFixed(1)}" dy="-0.65em">${stat.label}</tspan>
        <tspan class="team-a-value" x="${point.x.toFixed(1)}" dy="1.25em">${valueA}</tspan>
        <tspan class="team-b-value" dx="5">${valueB}</tspan>
      </text>
    `;
  }).join("");
  const axes = TEAM_RADAR_STATS.map((stat, index) => {
    const point = radarPoint(centerX, centerY, radius, index, TEAM_RADAR_STATS.length, radarMax, radarMax);
    return `<line x1="${centerX}" y1="${centerY}" x2="${point.x.toFixed(1)}" y2="${point.y.toFixed(1)}" />`;
  }).join("");
  const rings = gridRings.map((ring) => {
    const points = TEAM_RADAR_STATS.map((stat, index) => {
      const point = radarPoint(centerX, centerY, radius, index, TEAM_RADAR_STATS.length, ring, radarMax);
      return `${point.x.toFixed(1)},${point.y.toFixed(1)}`;
    }).join(" ");
    return `<polygon points="${points}" />`;
  }).join("");
  const aAverage = Math.round(statsA.reduce((sum, item) => sum + item.value, 0) / TEAM_RADAR_STATS.length);
  const bAverage = Math.round(statsB.reduce((sum, item) => sum + item.value, 0) / TEAM_RADAR_STATS.length);

  return `
    <div class="team-radar ${compact ? "team-radar-compact" : ""} ${inlineOdds ? "team-radar-inline-odds" : ""}" aria-label="Radar das equipas">
      <div class="team-radar-legend">
        <span class="team-a">Equipa A ${aAverage}${inlineOdds ? ` <em>Prob. A ${odds.teamA}%</em>` : ""}</span>
        <span class="team-b">Equipa B ${bAverage}${inlineOdds ? ` <em>Prob. B ${odds.teamB}%</em>` : ""}</span>
      </div>
      ${inlineOdds ? "" : `<div class="team-radar-odds">
        <span class="team-a">Prob. A ${odds.teamA}%</span>
        <span class="team-b">Prob. B ${odds.teamB}%</span>
      </div>`}
      <svg viewBox="0 0 220 ${compact ? 176 : 204}" role="img" aria-label="Comparacao PAC SHO PAS DRI DEF PHY">
        <g class="team-radar-grid">
          ${rings}
          ${axes}
        </g>
        <polygon class="team-radar-area team-a" points="${radarPolygonPoints(statsA, centerX, centerY, radius, radarMax)}" />
        <polygon class="team-radar-area team-b" points="${radarPolygonPoints(statsB, centerX, centerY, radius, radarMax)}" />
        <g class="team-radar-labels">${labels}</g>
      </svg>
    </div>
  `;
}

function getTeamWinProbabilities(statsA, statsB) {
  const averageA = statsA.reduce((sum, item) => sum + item.value, 0) / TEAM_RADAR_STATS.length;
  const averageB = statsB.reduce((sum, item) => sum + item.value, 0) / TEAM_RADAR_STATS.length;
  const diff = averageA - averageB;
  const teamA = clampNumber(Math.round(50 + diff * 3), 8, 92);
  return { teamA, teamB: 100 - teamA };
}

function getTeamStats(players, options = {}) {
  const count = Math.max(players.length, 1);
  const ratingFor = options.ratingFor || ((p) => p.overall);
  const total = players.reduce((sum, p) => sum + ratingFor(p), 0);
  const average = Math.round(total / count);
  return {
    total,
    average,
    pace: avg(players, "pace"),
    attack: Math.round((avg(players, "shooting") + avg(players, "passing") + avg(players, "dribbling")) / 3),
    defense: avg(players, "defending"),
    physical: avg(players, "physical"),
  };
}

function avg(players, key) {
  if (!players.length) return 0;
  return Math.round(players.reduce((sum, p) => sum + Number(p[key] || 0), 0) / players.length);
}

function combinations(items, size) {
  if (size === 0) return [[]];
  const result = [];
  const walk = (start, combo) => {
    if (combo.length === size) {
      result.push(combo);
      return;
    }
    for (let i = start; i <= items.length - (size - combo.length); i += 1) {
      walk(i + 1, combo.concat(items[i]));
    }
  };
  walk(0, []);
  return result;
}

function buildPairHistory(games) {
  const map = new Map();
  games.forEach((game) => {
    ensureGameShape(game);
    [[...game.teamA, ...game.benchA], [...game.teamB, ...game.benchB]].forEach((team) => {
      combinations(team, 2).forEach(([a, b]) => {
        const key = [a, b].sort().join("|");
        map.set(key, (map.get(key) || 0) + 1);
      });
    });
  });
  return map;
}

function buildTeamHistory(games) {
  const map = new Map();
  games.forEach((game) => {
    [game.teamA, game.teamB].forEach((team) => {
      const key = keyForIds(team);
      map.set(key, (map.get(key) || 0) + 1);
    });
  });
  return map;
}

function buildBenchHistory(games) {
  const map = new Map();
  games.forEach((game) => {
    [...getBenchA(game), ...getBenchB(game)].forEach((id) => map.set(id, (map.get(id) || 0) + 1));
  });
  return map;
}

function sameTeamPairPenalty(team, pairHistory) {
  return combinations(team.map((p) => p.id), 2).reduce((total, [a, b]) => {
    const key = [a, b].sort().join("|");
    return total + (pairHistory.get(key) || 0) * 2;
  }, 0);
}

function keyForIds(items) {
  return items.map((item) => typeof item === "string" ? item : item.id).sort().join(",");
}

function shortName(name, max = 10) {
  const clean = name.trim();
  if (clean.length <= max) return clean;
  const parts = clean.split(/\s+/);
  if (parts.length > 1) return `${parts[0]} ${parts[1][0]}.`;
  return clean.slice(0, max - 1) + ".";
}

function roleFromPlayer(playerData) {
  const attack = (Number(playerData.shooting) + Number(playerData.dribbling)) / 2;
  const control = (Number(playerData.passing) + Number(playerData.dribbling)) / 2;
  const defense = (Number(playerData.defending) + Number(playerData.physical)) / 2;
  if (defense >= attack + 6 && defense >= control) return "DEF";
  if (attack >= defense + 7 && attack >= control) return "ATT";
  if (control >= defense && control >= attack) return "MID";
  return "5V5";
}

function initials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "?";
  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function slug(value) {
  return normalize(value).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "jogador";
}

function createUuid() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (char) =>
    (Number(char) ^ window.crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> Number(char) / 4).toString(16)
  );
}

function normalizeUsername(value) {
  return normalize(value).replace(/[^a-z0-9_.-]+/g, "").slice(0, 32);
}

function clampRating(value) {
  const number = Math.round(Number(value));
  if (Number.isNaN(number)) return 0;
  return Math.min(100, Math.max(0, number));
}

function formatDate(value) {
  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function monthKey(value) {
  const date = new Date(value);
  const pad = (number) => String(number).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

function formatMonthLabel(month) {
  const [year, monthNumber] = String(month || monthKey(new Date())).split("-").map(Number);
  return new Intl.DateTimeFormat("pt-PT", { month: "long", year: "numeric" }).format(new Date(year, monthNumber - 1, 1));
}

function todayInputDate() {
  const date = new Date();
  const pad = (number) => String(number).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function dayOfMonth(value) {
  return new Intl.DateTimeFormat("pt-PT", { day: "2-digit" }).format(new Date(value));
}

function euro(value) {
  const number = Number(value) || 0;
  const formatted = new Intl.NumberFormat("pt-PT", {
    minimumFractionDigits: Number.isInteger(number) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(number);
  return `${formatted}€`;
}

function defaultEventDate() {
  const date = new Date();
  date.setDate(date.getDate() + ((2 + 7 - date.getDay()) % 7 || 7));
  date.setHours(21, 0, 0, 0);
  return date;
}

function toDateTimeLocalInput(value) {
  const date = new Date(value);
  const pad = (number) => String(number).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromDateTimeLocalInput(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function formatDateForFile(value) {
  return new Date(value).toISOString().slice(0, 16).replace(/[:T]/g, "-");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function roundRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}
