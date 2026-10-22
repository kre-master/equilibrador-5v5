(function exposeNotifications(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.FooterNotifications = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createNotificationsApi() {
  // Versao da app: MAJOR.MINOR.PATCH.
  // MAJOR: mudanca grande na forma de usar a app. MINOR: novidade visivel para os jogadores. PATCH: correcoes e afinacoes.
  // Cada push com mudancas para os jogadores acrescenta uma entrada no topo, em linguagem simples.
  const CHANGELOG = [
    {
      version: "1.0.0",
      date: "2026-10-22",
      title: "O teu perfil passa a ser a casa da app",
      items: [
        "Novo separador Jogador na barra de baixo: a app abre logo no teu perfil.",
        "Os teus números têm agora ícones para se lerem num relance.",
        "Cartas mais limpas: só a foto, o nome e a média.",
        "Toca no símbolo do Footer para veres novidades: convocatórias, vídeos, momentos e MVP.",
      ],
    },
  ];

  const APP_VERSION = CHANGELOG[0].version;
  const FEED_LIMIT = 30;
  const FIRST_RUN_LOOKBACK_DAYS = 7;

  function time(value) {
    const t = new Date(value).getTime();
    return Number.isFinite(t) ? t : null;
  }

  // Junta as fontes (ja em formato { id, kind, at, text }) por ordem cronologica inversa.
  function buildFeed(items, now = Date.now()) {
    return items
      .filter((item) => item && time(item.at) != null && time(item.at) <= now)
      .sort((a, b) => time(b.at) - time(a.at))
      .slice(0, FEED_LIMIT);
  }

  // Sem registo (primeira vez neste dispositivo) so conta a ultima semana, para nao aparecer o historico todo.
  function defaultSeenAt(now = Date.now()) {
    return new Date(now - FIRST_RUN_LOOKBACK_DAYS * 24 * 60 * 60 * 1000).toISOString();
  }

  function countUnseen(feed, seenAt) {
    const seen = time(seenAt);
    if (seen == null) return feed.length;
    return feed.filter((item) => time(item.at) > seen).length;
  }

  function compareVersions(a, b) {
    const pa = String(a || "0").split(".").map(Number);
    const pb = String(b || "0").split(".").map(Number);
    for (let i = 0; i < 3; i += 1) {
      const diff = (pa[i] || 0) - (pb[i] || 0);
      if (diff) return diff;
    }
    return 0;
  }

  // Versoes ainda nao vistas: todas as mais recentes do que a ultima vista (so a atual na primeira vez).
  function unseenReleases(lastSeenVersion, changelog = CHANGELOG) {
    if (!lastSeenVersion) return changelog.slice(0, 1);
    return changelog.filter((release) => compareVersions(release.version, lastSeenVersion) > 0);
  }

  return { CHANGELOG, APP_VERSION, buildFeed, defaultSeenAt, countUnseen, compareVersions, unseenReleases };
});
