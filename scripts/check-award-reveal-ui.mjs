import { readFileSync } from "node:fs";

const app = readFileSync("app.js", "utf8");
const css = readFileSync("styles.css", "utf8");

const checks = [
  {
    name: "award reveal renders a numeric unlocked-card count",
    pass: app.includes("data-award-reveal-count") && app.includes("${awards.length} cartas desbloqueadas"),
  },
  {
    name: "award reveal renders card label and description",
    pass: app.includes("award-reveal-title") && app.includes("award-reveal-description"),
  },
  {
    name: "award reveal uses a horizontal draggable track",
    pass: app.includes("award-reveal-track") && css.includes("overflow-x: auto") && css.includes("scroll-snap-type: x mandatory"),
  },
  {
    name: "award reveal keeps each card as a swipe snap item",
    pass: css.includes(".award-reveal-item") && css.includes("scroll-snap-align: center"),
  },
];

const failed = checks.filter((check) => !check.pass);
if (failed.length) {
  console.error("Award reveal UI checks failed:");
  failed.forEach((check) => console.error(`- ${check.name}`));
  process.exit(1);
}

console.log("Award reveal UI checks passed.");
