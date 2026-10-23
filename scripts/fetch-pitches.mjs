// Descarrega campos de futebol/futsal da regiao Norte a partir do OpenStreetMap (Overpass API, dados ODbL)
// e escreve data/pitches-norte.json. Correr so quando se quiser atualizar a lista:
//   node scripts/fetch-pitches.mjs
// Pede por concelho, devagar e com recuo, para nao sobrecarregar o servidor publico.

import { mkdir, writeFile } from "node:fs/promises";

const ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];
// Distritos a descarregar: argumentos da linha de comandos, ou o Norte todo.
//   node scripts/fetch-pitches.mjs Porto
const DISTRICTS = process.argv.length > 2 ? process.argv.slice(2) : ["Viana do Castelo", "Braga", "Porto", "Vila Real", "Bragança"];
const PAUSE_MS = 4000;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function overpass(query) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const endpoint = ENDPOINTS[attempt % ENDPOINTS.length];
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "FooterApp/1.0 (pitch list)" },
        body: `data=${encodeURIComponent(query)}`,
        signal: AbortSignal.timeout(150000),
      });
      const text = await response.text();
      if (response.ok && text.trim().startsWith("{")) return JSON.parse(text);
      console.warn(`${endpoint} -> ${response.status}: ${text.replace(/\s+/g, " ").slice(0, 200)}`);
    } catch (error) {
      console.warn(`${endpoint} -> ${error.message}`);
    }
    await sleep(Math.min(60000, 5000 * 2 ** attempt));
  }
  throw new Error("Overpass indisponivel");
}

const pitches = new Map();
let municipalityCount = 0;

for (const district of DISTRICTS) {
  const municipalities = await overpass(`[out:json][timeout:120];
    area["ISO3166-1"="PT"]["admin_level"="2"]->.pt;
    rel(area.pt)["boundary"="administrative"]["admin_level"="6"]["name"="${district}"]->.d;
    .d map_to_area->.da;
    rel(area.da)["boundary"="administrative"]["admin_level"="7"];
    out tags;`);
  const list = municipalities.elements.map((item) => ({ id: item.id, name: item.tags.name })).filter((item) => item.name);
  console.log(`${district}: ${list.length} concelhos`);
  for (const municipality of list) {
    await sleep(PAUSE_MS);
    const data = await overpass(`[out:json][timeout:120];
      rel(${municipality.id});
      map_to_area->.m;
      (
        nwr(area.m)["leisure"="pitch"]["sport"~"^(soccer|futsal|football|5-a-side)(;|$)"];
        nwr(area.m)["leisure"~"^(sports_centre|sports_hall)$"]["sport"~"(soccer|futsal|football)"];
      );
      out center tags;`);
    municipalityCount += 1;
    for (const element of data.elements) {
      const lat = element.lat ?? element.center?.lat;
      const lon = element.lon ?? element.center?.lon;
      if (lat == null || lon == null) continue;
      const tags = element.tags || {};
      const key = `${element.type}/${element.id}`;
      pitches.set(key, {
        id: key,
        name: tags.name || "",
        district,
        municipality: municipality.name,
        lat: Number(lat.toFixed(5)),
        lon: Number(lon.toFixed(5)),
        sport: String(tags.sport || ""),
        surface: tags.surface || "",
        kind: tags.leisure === "pitch" ? "campo" : "pavilhao",
        access: tags.access || "",
      });
    }
    console.log(`  ${municipality.name}: ${data.elements.length}`);
  }
}

// So entram campos com nome e pavilhoes: os campos sem nome nao se distinguem numa lista.
const rows = [...pitches.values()].filter((pitch) => pitch.name || pitch.kind === "pavilhao").sort((a, b) =>
  a.district.localeCompare(b.district, "pt") || a.municipality.localeCompare(b.municipality, "pt") || a.name.localeCompare(b.name, "pt"));
await mkdir("data", { recursive: true });
await writeFile("data/pitches-norte.json", JSON.stringify({
  source: "OpenStreetMap contributors (ODbL)",
  fetchedAt: new Date().toISOString(),
  pitches: rows,
}));
console.log(`${rows.length} campos em ${municipalityCount} concelhos`);
