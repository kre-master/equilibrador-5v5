import { readFileSync } from "node:fs";

const app = readFileSync("app.js", "utf8");

const checks = [
  {
    name: "stats has an explicit finance visibility guard",
    pass: app.includes("function canShowDebtStats()") && app.includes("return isAdmin;"),
  },
  {
    name: "debt rows are only calculated when finance stats are allowed",
    pass: app.includes("const showDebtStats = canShowDebtStats();") &&
      app.includes("showDebtStats ? getCurrentDebtRows().slice(0, 5) : []"),
  },
  {
    name: "stats render an unavailable finance card for non-admin users",
    pass: app.includes("renderDebtRankingUnavailable()") &&
      app.includes("Ranking financeiro disponivel so para admins."),
  },
  {
    name: "stats do not render debt ranking unconditionally",
    pass: !app.includes("${renderDebtRanking(currentDebts)}"),
  },
];

const failed = checks.filter((check) => !check.pass);
if (failed.length) {
  console.error("Stats finance visibility checks failed:");
  failed.forEach((check) => console.error(`- ${check.name}`));
  process.exit(1);
}

console.log("Stats finance visibility checks passed.");
