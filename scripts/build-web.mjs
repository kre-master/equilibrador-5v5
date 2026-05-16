import { cp, mkdir, rm } from "node:fs/promises";

const files = [
  "index.html",
  "styles.css",
  "app.js",
  "app-config.js",
  "manifest.webmanifest"
];

await rm("www", { recursive: true, force: true });
await mkdir("www", { recursive: true });

for (const file of files) {
  await cp(file, `www/${file}`, { recursive: true });
}

await cp("assets", "www/assets", { recursive: true, force: true }).catch(() => {});
