const STORAGE_KEY = "five-a-side-balancer-state-v1";

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
let selectedIds = new Set();
let currentSuggestions = [];
let currentGameId = state.games[0]?.id || null;
let previewGame = null;

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
  exportCanvas: document.querySelector("#export-canvas"),
  dataStatus: document.querySelector("#data-status"),
  adminLogin: document.querySelector("#admin-login"),
  accountSignup: document.querySelector("#account-signup"),
  adminLogout: document.querySelector("#admin-logout"),
  accountPanel: document.querySelector("#account-panel"),
  claimsList: document.querySelector("#claims-list"),
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
    isGuest: false,
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

function saveState() {
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
  const players = state.players.filter((p) => !p.isGuest).map(playerToRow);
  const games = state.games.map(gameToRow);

  const { error: playerDeleteError } = await supabaseClient.from("players").delete().neq("id", "__never__");
  if (playerDeleteError) throw playerDeleteError;
  if (players.length) {
    const { error } = await supabaseClient.from("players").upsert(players);
    if (error) throw error;
  }

  const { error: gameDeleteError } = await supabaseClient.from("games").delete().neq("id", "__never__");
  if (gameDeleteError) throw gameDeleteError;
  if (games.length) {
    const { error } = await supabaseClient.from("games").upsert(games);
    if (error) throw error;
  }
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
    const { data: createdProfile, error } = await supabaseClient
      .from("profiles")
      .insert({
        id: user.id,
        email: user.email,
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
  const [{ data: players, error: playerError }, { data: games, error: gameError }] = await Promise.all([
    supabaseClient.from("players").select("*").order("name", { ascending: true }),
    supabaseClient.from("games").select("*").order("date", { ascending: false }),
  ]);

  if (playerError || gameError) {
    console.warn("Remote load failed", playerError || gameError);
    remoteEnabled = false;
    updateAccessUi("Supabase indisponivel, modo local");
    return;
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
  });
  currentGameId = state.games[0]?.id || null;
  saveState();
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
  const email = prompt("Email:");
  if (!email) return;
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
  const email = prompt("Email:");
  if (!email) return;
  const password = prompt("Password:");
  if (!password) return;
  const displayName = prompt("Nome a mostrar:", email.split("@")[0]) || email.split("@")[0];
  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } },
  });
  if (error) {
    alert(`Nao consegui criar conta: ${error.message}`);
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
}

function getLinkedPlayer() {
  if (!currentSession?.user) return null;
  return state.players.find((playerData) => playerData.linkedUserId === currentSession.user.id) || null;
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
        </div>
      </div>
    `;
    els.accountPanel.querySelector("[data-account-login]")?.addEventListener("click", adminLogin);
    els.accountPanel.querySelector("[data-account-signup]")?.addEventListener("click", createAccount);
    return;
  }

  const user = currentSession.user;
  const linkedPlayer = getLinkedPlayer();
  const pendingClaim = getMyPendingClaim();
  const availablePlayers = state.players
    .filter((p) => !p.isGuest && !p.linkedUserId)
    .sort((a, b) => a.name.localeCompare(b.name));

  if (linkedPlayer) {
    els.accountPanel.innerHTML = `
      <div class="account-card good-card">
        <div>
          <p class="eyebrow">${isAdmin ? "Admin" : "Jogador"}</p>
          <h3>${escapeHtml(linkedPlayer.name)}</h3>
          <p>${escapeHtml(user.email || "")}</p>
        </div>
        <div class="profile-summary">
          ${renderAvatar(linkedPlayer)}
          <strong>${linkedPlayer.overall}</strong>
        </div>
      </div>
    `;
    return;
  }

  if (pendingClaim) {
    const playerData = findPlayer(pendingClaim.player_id);
    els.accountPanel.innerHTML = `
      <div class="account-card warn-card">
        <h3>Pedido pendente</h3>
        <p>Pediste para associar esta conta ao perfil ${escapeHtml(playerData?.name || "selecionado")}. Aguarda aprovacao do admin.</p>
      </div>
    `;
    return;
  }

  els.accountPanel.innerHTML = `
    <div class="account-card">
      <h3>Associar conta a jogador</h3>
      <p>Escolhe o teu perfil. O admin vai aprovar antes de ficares ligado oficialmente.</p>
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
      state.players[playerIndex].linkedUserId = claim.user_id;
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
        ${renderAvatar(p)}
        <span class="player-meta">
          <strong>${escapeHtml(p.name)}</strong>
          <span>${p.isGuest ? "Convidado" : "Fixo"} - PAC ${p.pace} - DEF ${p.defending} - PHY ${p.physical}</span>
        </span>
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
    const benchA = suggestion.benchA.length ? suggestion.benchA.map((p) => `${p.name} ${p.overall}`).join(", ") : "Sem suplente A";
    const benchB = suggestion.benchB.length ? suggestion.benchB.map((p) => `${p.name} ${p.overall}`).join(", ") : "Sem suplente B";
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
        </div>
      </article>
    `;
  }).join("");

  els.suggestions.querySelectorAll("[data-preview-suggestion]").forEach((button) => {
    button.addEventListener("click", () => previewSuggestion(Number(button.dataset.previewSuggestion)));
  });
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

        const teamAStats = getTeamStats(teamA);
        const teamBStats = getTeamStats(teamB);
        const squadAStats = getTeamStats([...teamA, ...split.benchA]);
        const squadBStats = getTeamStats([...teamB, ...split.benchB]);
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
        const score = diffTotal * 4 + squadDiff * 1.25 + attrDiff * 0.45 + historyPenalty;

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
  return `
    <div class="player-dot fut-card ${teamClass} ${playerData.photoDataUrl ? "has-photo" : ""}" style="left:${pos.x}%;top:${pos.y}%">
      <div class="fut-head">
        <strong>${playerData.overall}</strong>
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
      <td>${renderAvatar(p)}</td>
      <td><strong>${escapeHtml(p.name)}</strong>${p.isGuest ? " <span class=\"metric\">Guest</span>" : ""}</td>
      <td>${p.pace}</td>
      <td>${p.shooting}</td>
      <td>${p.passing}</td>
      <td>${p.dribbling}</td>
      <td>${p.defending}</td>
      <td>${p.physical}</td>
      <td><strong>${p.overall}</strong></td>
      <td>${p.linkedUserId ? "<span class=\"metric\">Ligado</span>" : "<span class=\"metric\">Livre</span>"}</td>
      <td>
        <button class="mini-btn" data-edit-player="${p.id}">Editar</button>
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

function deletePlayer(playerId) {
  if (!requireAdmin()) return;
  state.players = state.players.filter((p) => p.id !== playerId);
  selectedIds.delete(playerId);
  state.games.forEach((game) => {
    ensureGameShape(game);
    ["teamA", "teamB", "benchA", "benchB"].forEach((group) => {
      game[group] = game[group].filter((id) => id !== playerId);
    });
  });
  persistState();
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
        <button class="primary-btn" data-open-game="${game.id}">Abrir</button>
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

function getTeamStats(players) {
  const count = Math.max(players.length, 1);
  const total = players.reduce((sum, p) => sum + p.overall, 0);
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
