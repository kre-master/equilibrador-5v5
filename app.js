const STORAGE_KEY = "five-a-side-balancer-state-v1";
const PAYMENT_RULES = {
  playerFeePerGame: 4,
  monthlyCap: 15,
  fieldCostPerGame: 38,
};

const FORM_LEVELS = {
  hot: { label: "Em grande forma", className: "form-hot" },
  good: { label: "Boa forma", className: "form-good" },
  normal: { label: "Normal", className: "form-normal" },
  bad: { label: "Ma fase", className: "form-bad" },
  recovery: { label: "A recuperar", className: "form-recovery" },
};

const FORM_LOOKBACK_GAMES = 5;
const FORM_RATING_CAP = 7;

const INITIAL_FINANCE_BALANCES = {
  "p-amandio": -12,
  "p-bilo": 0,
  "p-marques": 23,
  "p-messi": 7,
  "p-cunha": 8,
  "p-filipe-m": -2,
  "p-xt": 20,
  "p-joao-mai": 8,
  "p-lipao": 7,
  "p-migo": -17,
  "p-ramos": -7,
  "p-tiago-f": -2,
  "p-tiaguito": -4,
  "p-ze": 18,
};

const defaultFinanceSettings = {
  startMonth: "2026-05",
  cashBalance: 0,
  playerBalances: { ...INITIAL_FINANCE_BALANCES },
};

const samplePlayers = [
  player("p-amandio", "Amandio", 49, 46, 47, 39, 52, 45, 46),
  player("p-bilo", "Bilo", 76, 81, 78, 83, 77, 78, 79),
  player("p-marques", "Marques", 74, 81, 73, 78, 74, 80, 77),
  player("p-messi", "Messi", 60, 69, 67, 71, 52, 56, 62),
  player("p-cunha", "Cunha", 58, 58, 62, 53, 67, 61, 60),
  player("p-filipe-m", "Filipe M", 63, 59, 60, 57, 65, 66, 62),
  player("p-filipe-or", "Filipe Or", 66, 71, 73, 72, 75, 74, 72),
  player("p-xt", "XT", 59, 58, 60, 51, 63, 46, 56),
  player("p-joao-mai", "Joao Mai", 58, 58, 58, 51, 64, 64, 59),
  player("p-lipao", "Lipao", 50, 73, 69, 75, 52, 56, 62),
  player("p-migo", "Migo", 48, 52, 53, 46, 52, 43, 49),
  player("p-ramos", "Ramos", 74, 62, 60, 63, 70, 79, 68),
  player("p-tiago-f", "Tiago F", 72, 88, 83, 82, 70, 70, 77),
  player("p-tiaguito", "Tiaguito", 85, 78, 73, 70, 78, 70, 76),
  player("p-ze", "Ze", 68, 82, 83, 91, 70, 68, 77),
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
let payments = state.payments || [];
let attendanceOverrides = state.attendanceOverrides || [];
let gameFinanceOverrides = state.gameFinanceOverrides || [];
let financeSettings = state.financeSettings || { ...defaultFinanceSettings, playerBalances: { ...defaultFinanceSettings.playerBalances } };
let currentEventId = null;
let currentPaymentsMonth = monthKey(new Date());
let selectedIds = new Set();
let currentSuggestions = [];
let currentGameId = state.games[0]?.id || null;
let previewGame = null;
let authActionBusy = false;
let currentPlayerProfileId = null;

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
  playerProfile: document.querySelector("#player-profile"),
  exportCanvas: document.querySelector("#export-canvas"),
  dataStatus: document.querySelector("#data-status"),
  adminLogin: document.querySelector("#admin-login"),
  accountSignup: document.querySelector("#account-signup"),
  adminLogout: document.querySelector("#admin-logout"),
  accountPanel: document.querySelector("#account-panel"),
  claimsList: document.querySelector("#claims-list"),
  accountsList: document.querySelector("#accounts-list"),
  paymentsPanel: document.querySelector("#payments-panel"),
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
    payments: [],
    attendanceOverrides: [],
    gameFinanceOverrides: [],
    financeSettings: { ...defaultFinanceSettings, playerBalances: { ...defaultFinanceSettings.playerBalances } },
  });
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
    maxPlayers: Number(record.maxPlayers ?? record.max_players ?? 13),
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
  return {
    id: String(record.id || gameFinanceOverrideId(gameId)),
    gameId: String(gameId),
    fieldPaid: record.fieldPaid ?? record.field_paid ?? true,
    chargePlayers: record.chargePlayers ?? record.charge_players ?? true,
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
    if (error) throw error;
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
  on(els.generateTeams, "click", generateAndRenderSuggestions);
  on(els.confirmGame, "click", confirmPreviewGame);
  on(els.exportImage, "click", exportCurrentGameImage);
  on(els.saveScore, "click", saveCurrentScore);
  on(els.addPlayerGameBtn, "click", addSelectedPlayerToGame);
  on(els.playerForm, "submit", savePlayerFromForm);
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
  render();
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
    const role = profileRows.length === 0 ? "admin" : "player";
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
  const [
    { data: players, error: playerError },
    { data: games, error: gameError },
    { data: events, error: eventError },
    { data: responses, error: responseError },
  ] = await Promise.all([
    supabaseClient.from("players").select("*").order("name", { ascending: true }),
    supabaseClient.from("games").select("*").order("date", { ascending: false }),
    supabaseClient.from("events").select("*").order("starts_at", { ascending: true }),
    supabaseClient.from("event_responses").select("*").order("updated_at", { ascending: false }),
  ]);

  if (playerError || gameError || eventError || responseError) {
    console.warn("Remote load failed", playerError || gameError || eventError || responseError);
    remoteEnabled = false;
    updateAccessUi("Supabase indisponivel, modo local");
    return;
  }

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
    payments: (remotePayments || []).map(paymentFromRow).filter(Boolean),
    attendanceOverrides: (remoteAttendanceOverrides || []).map(attendanceOverrideFromRow).filter(Boolean),
    gameFinanceOverrides: (remoteGameFinanceOverrides || []).map(gameFinanceOverrideFromRow).filter(Boolean),
    financeSettings,
  });
  await repairDuplicatePlayerLinks();
  eventResponses = (responses || []).map(responseFromRow);
  payments = state.payments || [];
  attendanceOverrides = state.attendanceOverrides || [];
  gameFinanceOverrides = state.gameFinanceOverrides || [];
  financeSettings = state.financeSettings || financeSettings;
  currentEventId = getNextEvent()?.id || state.events[0]?.id || null;
  currentGameId = state.games[0]?.id || null;
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
  if (!login) return;
  const email = await resolveLoginEmail(login);
  if (!email) {
    alert("Nao encontrei esse email/username.");
    return;
  }
  const password = prompt("Password:");
  if (!password) return;
  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) {
    alert(`Login falhou: ${error.message}`);
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
  const existingEmail = await resolveLoginEmail(username);
  if (existingEmail) {
    alert("Esse username ja esta em uso.");
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
  if (!login) return;
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
  const existingEmail = await resolveLoginEmail(username);
  if (existingEmail && existingEmail !== currentSession.user.email) {
    alert("Esse username ja esta em uso.");
    return;
  }
  const { data, error } = await supabaseClient
    .from("profiles")
    .update({ username, updated_at: new Date().toISOString() })
    .eq("id", currentSession.user.id)
    .select()
    .single();
  if (error) {
    alert(`Nao consegui guardar username: ${error.message}`);
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

function showView(viewName) {
  if (viewName !== "today") {
    previewGame = null;
  }
  els.tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.view === viewName));
  els.views.forEach((view) => view.classList.toggle("active", view.id === `view-${viewName}`));
}

function render() {
  renderPlayerList();
  renderPlayersTable();
  renderCurrentGame();
  renderGamesList();
  renderAccountPanel();
  renderClaimsList();
  renderAccountsList();
  renderPaymentsPanel();
  renderEventsList();
  renderPlayerProfile();
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
          <strong>${form.currentRating}</strong>
          <span>${renderFormChip(form)}</span>
        </div>
        ${renderSecurityActions()}
      </div>
    `;
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
  const canSeePrivateForm = isAdmin || getLinkedPlayer()?.id === playerData.id;

  els.playerProfile.innerHTML = `
    <div class="player-profile-head">
      <button class="ghost-btn" data-player-profile-back>Voltar</button>
      <div class="player-hero">
        ${renderAvatar(playerData)}
        <div>
          <p class="eyebrow">${playerData.isGuest ? "Convidado" : account ? "Perfil ligado" : "Jogador"}</p>
          <h2>${escapeHtml(playerData.name)}</h2>
          ${account ? `<p>${escapeHtml(account.email || account.username || "")}</p>` : ""}
        </div>
        <div class="player-rating-stack">
          <strong class="player-ovr">${canSeePrivateForm ? form.currentRating : playerData.overall}</strong>
          ${canSeePrivateForm ? `<span>Base ${playerData.overall}</span>${renderFormChip(form)}` : `<span>OVR base</span>`}
        </div>
      </div>
    </div>

    <div class="profile-grid">
      <section class="profile-section">
        <h3>Stats</h3>
        <div class="stats-grid">
          ${renderProfileStat("PAC", playerData.pace)}
          ${renderProfileStat("SHO", playerData.shooting)}
          ${renderProfileStat("PAS", playerData.passing)}
          ${renderProfileStat("DRI", playerData.dribbling)}
          ${renderProfileStat("DEF", playerData.defending)}
          ${renderProfileStat("PHY", playerData.physical)}
        </div>
      </section>

      <section class="profile-section">
        <h3>Historico</h3>
        <div class="summary-grid">
          ${renderSummaryCard("Jogos", summary.appearances)}
          ${renderSummaryCard("Vitorias", summary.wins)}
          ${renderSummaryCard("Empates", summary.draws)}
          ${renderSummaryCard("Derrotas", summary.losses)}
          ${renderSummaryCard("Win rate", `${winRate}%`)}
          ${canSeePrivateForm ? renderSummaryCard("Forma", form.level) : ""}
          ${canSeePrivateForm ? renderSummaryCard("Ultimos 5", renderRecordDots(form.recentRecord)) : ""}
        </div>
      </section>
    </div>

    <section class="profile-section">
      <h3>Ultimos jogos</h3>
      ${summary.games.length ? `
        <div class="profile-games">
          ${summary.games.map((item) => renderPlayerGameRow(item)).join("")}
        </div>
      ` : `<div class="empty-state">Ainda nao ha jogos registados para este jogador.</div>`}
    </section>
  `;

  els.playerProfile.querySelector("[data-player-profile-back]")?.addEventListener("click", () => {
    showView("players");
  });
  els.playerProfile.querySelectorAll("[data-profile-open-game]").forEach((button) => {
    button.addEventListener("click", () => {
      currentGameId = button.dataset.profileOpenGame;
      showView("today");
      renderCurrentGame();
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

function renderSummaryCard(label, value) {
  return `
    <div class="summary-card">
      <span>${label}</span>
      <strong>${value}</strong>
    </div>
  `;
}

function renderFormChip(form) {
  return `<span class="form-chip ${form.className}">${form.level} ${formatSigned(form.adjustment)}</span>`;
}

function formatSigned(value) {
  const number = Number(value) || 0;
  return number > 0 ? `+${number}` : String(number);
}

function renderRecordDots(record) {
  if (!record.length) return `<span class="record-empty">Sem jogos</span>`;
  const labels = { win: "V", draw: "E", loss: "D" };
  return record.map((outcome) => `<span class="record-dot ${outcome}">${labels[outcome] || "-"}</span>`).join("");
}

function renderPlayerGameRow(item) {
  const resultText = item.game.scoreA == null || item.game.scoreB == null ? "Resultado em aberto" : `${item.game.scoreA} - ${item.game.scoreB}`;
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
        <strong>Registar pagamento</strong>
        <span>O saldo atual aparece no dropdown para escolheres mais rapido.</span>
      </div>
      <select data-payment-player>
        <option value="">Jogador</option>
        ${paymentOptions}
      </select>
      <input data-payment-amount type="number" min="0" step="0.5" placeholder="Valor pago">
      <input data-payment-date type="date" value="${escapeHtml(todayInputDate())}">
      <input data-payment-note placeholder="Nota">
      <button class="primary-btn" data-add-payment>Registar</button>
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
      ${renderSummaryCard("Pago", euro(report.totalPaidMonth))}
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
            <th>Pago</th>
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
  els.paymentsPanel.querySelector("[data-add-payment]")?.addEventListener("click", addManualPayment);
  els.paymentsPanel.querySelectorAll("[data-open-payment-player]").forEach((button) => {
    button.addEventListener("click", () => openPlayerProfile(button.dataset.openPaymentPlayer));
  });
  els.paymentsPanel.querySelectorAll("[data-attendance-game]").forEach((input) => {
    input.addEventListener("change", () => updateAttendanceOverride(input.dataset.attendanceGame, input.dataset.attendancePlayer, input.checked));
  });
  els.paymentsPanel.querySelectorAll("[data-game-finance-toggle]").forEach((input) => {
    input.addEventListener("change", () => updateGameFinanceOverride(input.dataset.gameFinanceToggle, input.dataset.gameFinanceField, input.checked));
  });
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
            </article>
          `;
        }).join("")}
      </div>
    </section>
  `;
}

function renderPaymentsHistory(monthPayments) {
  if (!monthPayments.length) return `<div class="empty-state">Ainda nao ha pagamentos registados neste mes.</div>`;
  return `
    <div class="profile-games">
      ${monthPayments.map((payment) => {
        const playerData = findPlayer(payment.playerId);
        return `
          <article class="profile-game-row">
            <div>
              <strong>${escapeHtml(playerData?.name || "Jogador removido")} - ${euro(payment.amount)}</strong>
              <span>${formatDate(payment.paidAt)}${payment.note ? ` - ${escapeHtml(payment.note)}` : ""}</span>
            </div>
          </article>
        `;
      }).join("")}
    </div>
  `;
}

async function addManualPayment() {
  if (!requireAdmin()) return;
  const playerId = els.paymentsPanel.querySelector("[data-payment-player]")?.value;
  const amount = Number(els.paymentsPanel.querySelector("[data-payment-amount]")?.value);
  const paidAtValue = els.paymentsPanel.querySelector("[data-payment-date]")?.value;
  const note = els.paymentsPanel.querySelector("[data-payment-note]")?.value.trim() || "";
  if (!playerId || Number.isNaN(amount) || amount <= 0 || !paidAtValue) {
    alert("Escolhe jogador, valor e data do pagamento.");
    return;
  }
  const payment = {
    id: `pay-${Date.now()}-${slug(playerId)}`,
    playerId,
    amount,
    paidAt: new Date(`${paidAtValue}T12:00:00`).toISOString(),
    note,
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
  if (!["fieldPaid", "chargePlayers"].includes(field)) return;
  const existing = gameFinanceOverrides.find((item) => item.gameId === gameId) || getGameFinanceSettings({ id: gameId });
  const next = {
    ...existing,
    id: gameFinanceOverrideId(gameId),
    gameId,
    [field]: value,
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
    const paidMonth = getPlayerPaymentsInMonth(playerData.id, month).reduce((sum, payment) => sum + payment.amount, 0);
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
  const fieldCost = fieldPaidGames.length * PAYMENT_RULES.fieldCostPerGame;
  const totalPaidMonth = rows.reduce((sum, row) => sum + row.paidMonth, 0);
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
    const paid = getPlayerPaymentsInMonth(playerId, key).reduce((sum, payment) => sum + payment.amount, 0);
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

function renderEventsList() {
  if (!els.eventsList) return;
  if (els.eventDate && !els.eventDate.value) {
    els.eventDate.value = toDateTimeLocalInput(defaultEventDate());
  }

  document.body.classList.toggle("player-linked", Boolean(getLinkedPlayer()));
  const events = [...(state.events || [])].sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
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
      loadCurrentEventGoingPlayers();
    });
  });
  els.eventsList.querySelectorAll("[data-event-cancel]").forEach((button) => {
    button.addEventListener("click", () => updateEventStatus(button.dataset.eventCancel, "cancelled"));
  });
  els.eventsList.querySelectorAll("[data-event-delete]").forEach((button) => {
    button.addEventListener("click", () => deleteEvent(button.dataset.eventDelete));
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
        <span class="metric ${missing ? "warn-pill" : "good-pill"}">${missing ? `Faltam ${missing}` : "Pronto"}</span>
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
          <button class="primary-btn" data-event-generate="${eventData.id}" ${going.length < 10 || going.length > 13 ? "disabled" : ""}>Gerar com confirmados</button>
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
  return `
    <div class="response-row">
      <button class="ghost-btn ${status === "going" ? "selected" : ""}" data-event-id="${eventData.id}" data-event-response="going">Vou</button>
      <button class="ghost-btn ${status === "maybe" ? "selected" : ""}" data-event-id="${eventData.id}" data-event-response="maybe">Talvez</button>
      <button class="ghost-btn ${status === "not_going" ? "selected" : ""}" data-event-id="${eventData.id}" data-event-response="not_going">Nao vou</button>
    </div>
  `;
}

function renderRosterMini(label, players) {
  const roster = players.length
    ? players.map((p) => `
      <button class="roster-player-chip" data-open-player="${p.id}" type="button">
        ${renderAvatar(p)}
        <span>${escapeHtml(p.name)}</span>
      </button>
    `).join("")
    : `<span>-</span>`;
  return `<div><strong>${label}</strong><span class="roster-player-list">${roster}</span></div>`;
}

function renderEventAdminAdds(eventData) {
  if (!isAdmin || eventData.status === "cancelled") return "";
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
        <button class="ghost-btn" data-event-add-existing-btn="${eventData.id}">Adicionar como Vou</button>
      </div>
      <div class="add-guest-row">
        <input data-event-guest-name="${eventData.id}" placeholder="Amigo novo">
        <input data-event-guest-score="${eventData.id}" type="number" min="0" max="10" step="0.5" placeholder="0-10">
        <button class="ghost-btn" data-event-add-guest-btn="${eventData.id}">Adicionar convidado</button>
      </div>
    </div>
  `;
}

async function saveEventFromForm(event) {
  event.preventDefault();
  if (!requireAdmin()) return;
  const title = els.eventTitle.value.trim();
  const startsAt = fromDateTimeLocalInput(els.eventDate.value);
  const location = els.eventLocation.value.trim();
  const maxPlayers = Number(els.eventMaxPlayers.value || 13);
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
    alert(`Nao consegui guardar resposta: ${error.message}`);
    return;
  }
  currentEventId = eventId;
  render();
}

async function saveEventResponseForPlayer(eventId, playerId, status, userId = null) {
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

  const existing = getResponseForPlayer(eventId, playerId);
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
    alert(`Nao consegui adicionar jogador: ${error.message}`);
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
    alert(`Nao consegui adicionar convidado: ${error.message}`);
  }
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

function loadCurrentEventGoingPlayers() {
  const eventData = getCurrentEvent();
  if (!eventData) {
    setHint("Ainda nao ha convocatoria para carregar.", "warn");
    showView("today");
    return;
  }
  const goingPlayers = getEventPlayers(eventData.id, "going");
  selectedIds = new Set(goingPlayers.map((p) => p.id));
  currentEventId = eventData.id;
  showView("today");
  render();
  setHint(`${goingPlayers.length} confirmados carregados da convocatoria "${eventData.title}".`, goingPlayers.length >= 10 && goingPlayers.length <= 13 ? "good" : "warn");
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
    return `
      <label class="player-chip ${selected ? "selected" : ""}">
        <input type="checkbox" data-select-player="${p.id}" ${selected ? "checked" : ""}>
        <button class="player-open-link" data-open-player="${p.id}" type="button">${renderAvatar(p)}</button>
        <button class="player-meta player-open-link" data-open-player="${p.id}" type="button">
          <strong>${escapeHtml(p.name)}</strong>
          <span>${p.isGuest ? "Convidado" : "Fixo"} - PAC ${p.pace} - DEF ${p.defending} - PHY ${p.physical}</span>
        </button>
        <span class="rating-badge">${p.overall}</span>
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

function generateAndRenderSuggestions() {
  const selected = getSelectedPlayers();
  if (selected.length < 10 || selected.length > 13) {
    setHint("Seleciona entre 10 e 13 jogadores antes de gerar.", "warn");
    return;
  }

  currentSuggestions = generateSuggestions(selected, state.games).slice(0, 6);
  renderSuggestions();
}

function renderSuggestions() {
  if (!currentSuggestions.length) {
    els.suggestions.innerHTML = `<div class="empty-state">Nao encontrei uma combinacao valida.</div>`;
    return;
  }

  els.suggestions.innerHTML = currentSuggestions.map((suggestion, index) => {
    const teamA = suggestion.teamA.map((p) => p.name).join(", ");
    const teamB = suggestion.teamB.map((p) => p.name).join(", ");
    const benchA = suggestion.benchA.length ? suggestion.benchA.map((p) => `${p.name} ${getPlayerRatingForBalance(p)}`).join(", ") : "Sem suplente A";
    const benchB = suggestion.benchB.length ? suggestion.benchB.map((p) => `${p.name} ${getPlayerRatingForBalance(p)}`).join(", ") : "Sem suplente B";
    return `
      <article class="suggestion-card">
        <div class="suggestion-top">
          <strong>Sugestao ${index + 1}</strong>
          <button class="primary-btn" data-preview-suggestion="${index}">Ver no campo</button>
        </div>
        <div class="team-preview">
          <div class="team-line"><strong>A ${suggestion.teamAStats.total}</strong> - ${escapeHtml(teamA)}</div>
          <div class="team-line blue"><strong>B ${suggestion.teamBStats.total}</strong> - ${escapeHtml(teamB)}</div>
          <div class="team-line bench"><strong>Supl. A</strong> - ${escapeHtml(benchA)}</div>
          <div class="team-line bench"><strong>Supl. B</strong> - ${escapeHtml(benchB)}</div>
        </div>
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
  const benchSize = players.length - 10;
  const pairHistory = buildPairHistory(games);
  const teamHistory = buildTeamHistory(games);
  const benchHistory = buildBenchHistory(games);
  const suggestions = [];
  const seen = new Set();

  const requiredBench = benchSize > 0 ? getThirdWorstPlayer(players) : null;
  const benchCombos = benchSize === 0
    ? [[]]
    : combinations(players, benchSize).filter((bench) => bench.some((p) => p.id === requiredBench.id));
  for (const bench of benchCombos) {
    const benchIds = new Set(bench.map((p) => p.id));
    const starters = players.filter((p) => !benchIds.has(p.id));
    const teamCombos = combinations(starters, 5);
    const benchSplits = getBenchSplits(bench);

    for (const teamA of teamCombos) {
      const teamAIds = new Set(teamA.map((p) => p.id));
      const teamB = starters.filter((p) => !teamAIds.has(p.id));
      const keyA = keyForIds(teamA);
      const keyB = keyForIds(teamB);

      for (const split of benchSplits) {
        const divisionKey = [keyA, keyB].sort().join("|") + `|benchA:${keyForIds(split.benchA)}|benchB:${keyForIds(split.benchB)}`;
        if (seen.has(divisionKey)) continue;
        seen.add(divisionKey);

        const ratingOptions = { ratingFor: getPlayerRatingForBalance };
        const teamAStats = getTeamStats(teamA, ratingOptions);
        const teamBStats = getTeamStats(teamB, ratingOptions);
        const squadAStats = getTeamStats([...teamA, ...split.benchA], ratingOptions);
        const squadBStats = getTeamStats([...teamB, ...split.benchB], ratingOptions);
        const diffTotal = Math.abs(teamAStats.total - teamBStats.total);
        const squadDiff = Math.abs(squadAStats.average - squadBStats.average);
        const attrDiff =
          Math.abs(teamAStats.attack - teamBStats.attack) +
          Math.abs(teamAStats.defense - teamBStats.defense) * 1.25 +
          Math.abs(teamAStats.physical - teamBStats.physical) +
          Math.abs(teamAStats.pace - teamBStats.pace) * 0.7;
        const pairPenalty = sameTeamPairPenalty([...teamA, ...split.benchA], pairHistory) + sameTeamPairPenalty([...teamB, ...split.benchB], pairHistory);
        const exactPenalty = (teamHistory.get(keyA) || 0) * 12 + (teamHistory.get(keyB) || 0) * 12;
        const benchPenalty = bench.reduce((total, p) => total + (benchHistory.get(p.id) || 0) * 4 + p.overall / 60, 0);
        const unevenBenchPenalty = Math.abs(split.benchA.length - split.benchB.length) * 2;
        const historyPenalty = Math.round(pairPenalty + exactPenalty + benchPenalty + unevenBenchPenalty);
        const formPenalty = getFormBalancePenalty([...teamA, ...split.benchA], [...teamB, ...split.benchB]);
        const score = diffTotal * 4 + squadDiff * 1.25 + attrDiff * 0.45 + historyPenalty + formPenalty;

        suggestions.push({
          teamA,
          teamB,
          benchA: split.benchA,
          benchB: split.benchB,
          teamAStats,
          teamBStats,
          squadAStats,
          squadBStats,
          diffTotal,
          squadDiff,
          historyPenalty,
          formPenalty: Number(formPenalty.toFixed(2)),
          score: Number(score.toFixed(2)),
        });
      }
    }
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
    date: options.date || new Date().toISOString(),
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

  previewGame = createGameFromSuggestion(suggestion);
  currentGameId = null;
  renderCurrentGame();
  els.suggestions.innerHTML = `<div class="hint good">Sugestao no campo. Exporta o PNG e confirma so quando estiver certo.</div>`;
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

  els.scoreA.value = game.scoreA ?? "";
  els.scoreB.value = game.scoreB ?? "";
  els.fieldCard.innerHTML = renderField(game);
  renderRosterEditor(game);
  renderAddPlayerSelect(game);
}

function renderField(game) {
  const teamA = hydrate(game.teamA);
  const teamB = hydrate(game.teamB);
  const benchA = hydrate(getBenchA(game));
  const benchB = hydrate(getBenchB(game));
  const statsA = getTeamStats(teamA);
  const statsB = getTeamStats(teamB);
  const squadAStats = getTeamStats([...teamA, ...benchA]);
  const squadBStats = getTeamStats([...teamB, ...benchB]);
  const result = game.scoreA == null || game.scoreB == null ? "vs" : `${game.scoreA} - ${game.scoreB}`;
  const date = formatDate(game.date);

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
    <div class="pitch">
      ${orderTeamForField(teamA).map((p, i) => renderDot(p, "team-a", getPosition("a", i))).join("")}
      ${orderTeamForField(teamB).map((p, i) => renderDot(p, "team-b", getPosition("b", i))).join("")}
    </div>
    <div class="bench-strip">
      <div class="bench-side bench-left">${renderBenchCards("Supl. A", benchA, "team-a")}</div>
      <div class="bench-side bench-right">${renderBenchCards("Supl. B", benchB, "team-b")}</div>
    </div>
  `;
}

function renderDot(playerData, teamClass, pos) {
  const form = getPlayerForm(playerData);
  return `
    <div class="player-dot fut-card ${teamClass} ${playerData.photoDataUrl ? "has-photo" : ""}" style="left:${pos.x}%;top:${pos.y}%">
      <div class="fut-head">
        <strong>${form.currentRating}</strong>
        <small>${formatSigned(form.adjustment)}</small>
      </div>
      <div class="fut-photo">
        ${playerData.photoDataUrl ? `<img src="${escapeHtml(playerData.photoDataUrl)}" alt="">` : renderAvatar(playerData)}
      </div>
      <strong class="fut-name">${escapeHtml(shortName(playerData.name, 11))}</strong>
      <div class="fut-stats">
        ${renderFutStats(playerData)}
      </div>
    </div>
  `;
}

function renderFutStats(playerData) {
  return [
    ["PAC", playerData.pace],
    ["SHO", playerData.shooting],
    ["PAS", playerData.passing],
    ["DRI", playerData.dribbling],
    ["DEF", playerData.defending],
    ["PHY", playerData.physical],
  ].map(([label, value]) => `<span><b>${value}</b> ${label}</span>`).join("");
}

function orderTeamForField(players) {
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

function renderBenchCards(label, players, teamClass) {
  if (!players.length) return `<span class="bench-empty">${label}: sem suplente</span>`;
  return players.map((p) => `
    <div class="bench-card">
      ${renderDot(p, teamClass, { x: 50, y: 50 }).replace("player-dot", "player-dot bench-dot")}
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

function getPosition(side, index) {
  const left = [
    { x: 11, y: 50 },
    { x: 27, y: 18 },
    { x: 27, y: 82 },
    { x: 41, y: 38 },
    { x: 41, y: 62 },
  ];
  const right = left.map((p) => ({ x: 100 - p.x, y: p.y }));
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

function saveCurrentScore() {
  if (!requireAdmin()) return;
  const game = getCurrentGame();
  if (!game) return;
  const scoreA = els.scoreA.value === "" ? null : Number(els.scoreA.value);
  const scoreB = els.scoreB.value === "" ? null : Number(els.scoreB.value);
  game.scoreA = Number.isNaN(scoreA) ? null : scoreA;
  game.scoreB = Number.isNaN(scoreB) ? null : scoreB;
  game.status = game.scoreA == null || game.scoreB == null ? "open" : "finished";
  if (game.status !== "preview") persistState();
  render();
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
  els.playersTable.innerHTML = players.map((p) => `
    <tr>
      <td><button class="player-open-link" data-open-player="${p.id}" type="button">${renderAvatar(p)}</button></td>
      <td><button class="player-name-link" data-open-player="${p.id}" type="button"><strong>${escapeHtml(p.name)}</strong>${p.isGuest ? " <span class=\"metric\">Guest</span>" : ""}</button></td>
      <td>${p.pace}</td>
      <td>${p.shooting}</td>
      <td>${p.passing}</td>
      <td>${p.dribbling}</td>
      <td>${p.defending}</td>
      <td>${p.physical}</td>
      <td><strong>${p.overall}</strong></td>
      <td>${renderLinkedAccountCell(p)}</td>
      <td>
        <button class="mini-btn" data-edit-player="${p.id}">Editar</button>
        ${p.linkedUserId ? `<button class="mini-btn" data-unlink-player="${p.id}">Desassociar</button>` : ""}
        <button class="mini-btn" data-delete-player="${p.id}">Apagar</button>
      </td>
    </tr>
  `).join("");

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

async function savePlayerFromForm(event) {
  event.preventDefault();
  if (!requireAdmin()) return;
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
    const teamA = hydrate(game.teamA);
    const teamB = hydrate(game.teamB);
    const result = game.scoreA == null || game.scoreB == null ? "Resultado em aberto" : `${game.scoreA} - ${game.scoreB}`;
    return `
      <article class="game-card">
        <div>
          <strong>${formatDate(game.date)} - ${result}</strong>
          <span>A ${getTeamStats(teamA).total} vs B ${getTeamStats(teamB).total} - ${game.status === "finished" ? "finalizado" : "em aberto"}</span>
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
      currentGameId = button.dataset.openGame;
      showView("today");
      renderCurrentGame();
    });
  });
  els.gamesList.querySelectorAll("[data-delete-game]").forEach((button) => {
    button.addEventListener("click", () => deleteGame(button.dataset.deleteGame));
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
    currentGameId = state.games[0]?.id || null;
    previewGame = null;
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
  for (const [i, p] of orderTeamForField(teamA).entries()) {
    await drawPlayerDot(ctx, p, getCanvasPos(pitch, getPosition("a", i)), "#1f7a4d");
  }
  for (const [i, p] of orderTeamForField(teamB).entries()) {
    await drawPlayerDot(ctx, p, getCanvasPos(pitch, getPosition("b", i)), "#c86422");
  }

  await drawBenchGroup(ctx, "Supl. A", benchA, 120, 1800, "#1f7a4d");
  await drawBenchGroup(ctx, "Supl. B", benchB, 1160, 1800, "#c86422");
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
    x: pitch.x + pitch.w * (pos.x / 100),
    y: pitch.y + pitch.h * (pos.y / 100),
  };
}

async function drawPlayerDot(ctx, playerData, pos, color) {
  const width = pos.cardWidth || 188;
  const height = pos.cardHeight || 258;
  const x = pos.x - width / 2;
  const y = pos.y - height / 2;

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

  ctx.fillStyle = "rgba(255,255,255,.25)";
  ctx.beginPath();
  ctx.moveTo(x + width * 0.18, y + 12);
  ctx.lineTo(x + width * 0.92, y + height * 0.18);
  ctx.lineTo(x + width * 0.42, y + height * 0.86);
  ctx.lineTo(x + width * 0.08, y + height * 0.62);
  ctx.closePath();
  ctx.fill();

  const photo = getCardPhotoRect(x, y, width, height);
  if (playerData.photoDataUrl) {
    try {
      const img = await loadPhoto(playerData.photoDataUrl);
      drawImageCover(ctx, img, photo.x, photo.y, photo.w, photo.h);
    } catch (error) {
      drawInitials(ctx, playerData.name, photo.x + photo.w / 2, photo.y + photo.h / 2, Math.min(photo.w, photo.h));
    }
  } else {
    drawInitials(ctx, playerData.name, photo.x + photo.w / 2, photo.y + photo.h / 2, Math.min(photo.w, photo.h));
  }

  ctx.restore();
  ctx.strokeStyle = "#f8e7a8";
  ctx.lineWidth = 5;
  cardPath(ctx, x, y, width, height);
  ctx.stroke();
  ctx.strokeStyle = "rgba(62,42,8,.62)";
  ctx.lineWidth = 2;
  cardPath(ctx, x + 5, y + 5, width - 10, height - 10);
  ctx.stroke();

  ctx.fillStyle = "#2c2615";
  ctx.textAlign = "left";
  ctx.font = `900 ${Math.round(width * 0.18)}px Segoe UI, Arial`;
  ctx.fillText(String(playerData.overall), x + width * 0.09, y + height * 0.16);

  ctx.textAlign = "center";
  ctx.font = `900 ${Math.round(width * 0.095)}px Segoe UI, Arial`;
  ctx.fillText(shortName(playerData.name, 12).toUpperCase(), pos.x, y + height * 0.59);
  ctx.strokeStyle = "rgba(90,64,12,.45)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + width * 0.17, y + height * 0.62);
  ctx.lineTo(x + width * 0.83, y + height * 0.62);
  ctx.stroke();

  drawFutStats(ctx, playerData, x, y, width, height);
  ctx.textAlign = "left";
}

function drawFutStats(ctx, playerData, x, y, width, height) {
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
  const startY = y + height * 0.70;
  const rowGap = height * 0.088;
  ctx.fillStyle = "#2c2615";
  ctx.font = `800 ${Math.round(width * 0.068)}px Segoe UI, Arial`;
  left.forEach(([label, value], index) => {
    ctx.textAlign = "left";
    ctx.fillText(`${value} ${label}`, x + width * 0.14, startY + index * rowGap);
  });
  right.forEach(([label, value], index) => {
    ctx.textAlign = "left";
    ctx.fillText(`${value} ${label}`, x + width * 0.57, startY + index * rowGap);
  });
  ctx.strokeStyle = "rgba(90,64,12,.35)";
  ctx.beginPath();
  ctx.moveTo(x + width * 0.50, y + height * 0.66);
  ctx.lineTo(x + width * 0.50, y + height * 0.90);
  ctx.stroke();
}

function getCardPhotoRect(x, y, width, height) {
  return {
    x: x + width * 0.31,
    y: y + height * 0.18,
    w: width * 0.61,
    h: height * 0.34,
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

async function drawBenchGroup(ctx, label, players, x, y, color) {
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
    await drawPlayerDot(ctx, playerData, { x: centerX, y: centerY, cardWidth, cardHeight }, color);
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
      currentGameId = state.games[0]?.id || null;
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

function getPlayerForm(playerData, games = state.games) {
  const baseOverall = clampRating(playerData?.overall ?? 0);
  const finishedAppearances = [...games]
    .filter((game) => game?.status === "finished" || (game?.scoreA != null && game?.scoreB != null))
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
  const winStreak = countCurrentStreak(finishedAppearances, "win");
  const lossStreak = countCurrentStreak(finishedAppearances, "loss");
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

function countCurrentStreak(items, outcome) {
  let streak = 0;
  for (const item of items) {
    if (item.outcome !== outcome) break;
    streak += 1;
  }
  return streak;
}

function countRecentAbsences(playerId, games) {
  return [...games]
    .filter((game) => game?.status === "finished" || (game?.scoreA != null && game?.scoreB != null))
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
