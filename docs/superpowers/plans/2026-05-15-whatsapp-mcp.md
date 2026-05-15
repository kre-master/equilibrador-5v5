# WhatsApp MCP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local MCP server for WhatsApp Cloud API with outbound messaging, local inbox reads from webhooks, SQLite persistence, media download support, and setup documentation.

**Architecture:** Create a new isolated `mcp-whatsapp/` Node.js project beside the existing 5v5 app. Run the MCP stdio server and webhook HTTP server as separate commands that share a local SQLite database through `sql.js`.

**Tech Stack:** Node.js ESM, `@modelcontextprotocol/sdk`, `zod`, `dotenv`, `sql.js`, Node built-in `node:test`, Meta WhatsApp Cloud API, local HTTPS tunnel via Cloudflare Tunnel or ngrok.

---

## File Structure

- Create `mcp-whatsapp/package.json`: scripts, dependencies, and Node test setup.
- Create `mcp-whatsapp/.env.example`: all supported WhatsApp and local runtime variables without secrets.
- Create `mcp-whatsapp/.gitignore`: ignore `.env`, SQLite files, media, logs, and dependencies.
- Create `mcp-whatsapp/README.md`: Meta setup checklist, tunnel instructions, MCP client config, and tool reference.
- Create `mcp-whatsapp/data/.gitkeep`: keep the data directory in git.
- Create `mcp-whatsapp/src/config.mjs`: environment loading, validation, secret redaction, and path resolution.
- Create `mcp-whatsapp/src/store.mjs`: SQLite lifecycle, schema, inserts, queries, and updates.
- Create `mcp-whatsapp/src/whatsapp-api.mjs`: Graph API wrapper and structured API errors.
- Create `mcp-whatsapp/src/webhook-parser.mjs`: pure parsing helpers for WhatsApp webhook payloads.
- Create `mcp-whatsapp/src/webhook-server.mjs`: HTTP webhook server, verification challenge, signature checks, and persistence.
- Create `mcp-whatsapp/src/mcp-server.mjs`: MCP tool registration over stdio.
- Create `mcp-whatsapp/src/cli.mjs`: command dispatcher for `mcp`, `webhook`, and `health`.
- Create `mcp-whatsapp/test/*.test.mjs`: focused unit tests for config, store, API request shaping, webhook parsing, webhook HTTP behavior, and MCP tool handlers.

## Task 1: Scaffold Project And Runtime Config

**Files:**
- Create: `mcp-whatsapp/package.json`
- Create: `mcp-whatsapp/.env.example`
- Create: `mcp-whatsapp/.gitignore`
- Create: `mcp-whatsapp/data/.gitkeep`
- Create: `mcp-whatsapp/src/config.mjs`
- Test: `mcp-whatsapp/test/config.test.mjs`

- [ ] **Step 1: Write config tests**

Create `mcp-whatsapp/test/config.test.mjs`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { loadConfig, redactSecret } from "../src/config.mjs";

test("loadConfig reports missing required WhatsApp variables", () => {
  assert.throws(
    () => loadConfig({ env: {}, cwd: "/repo/mcp-whatsapp" }),
    /Missing required environment variables: WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_BUSINESS_ACCOUNT_ID, WHATSAPP_VERIFY_TOKEN/
  );
});

test("loadConfig applies defaults and resolves local paths", () => {
  const config = loadConfig({
    cwd: "/repo/mcp-whatsapp",
    env: {
      WHATSAPP_ACCESS_TOKEN: "secret-token",
      WHATSAPP_PHONE_NUMBER_ID: "12345",
      WHATSAPP_BUSINESS_ACCOUNT_ID: "67890",
      WHATSAPP_VERIFY_TOKEN: "verify-me",
    },
  });

  assert.equal(config.graphApiVersion, "v23.0");
  assert.equal(config.webhookPort, 8787);
  assert.equal(config.sqlitePath, "/repo/mcp-whatsapp/data/whatsapp.sqlite");
  assert.equal(config.mediaDir, "/repo/mcp-whatsapp/data/media");
  assert.equal(config.graphBaseUrl, "https://graph.facebook.com/v23.0");
});

test("redactSecret keeps short recognizable edges without leaking the full value", () => {
  assert.equal(redactSecret("abcdefghijklmnop"), "abcd...mnop");
  assert.equal(redactSecret("short"), "*****");
  assert.equal(redactSecret(undefined), "");
});
```

- [ ] **Step 2: Run config tests and verify they fail**

Run:

```powershell
Set-Location mcp-whatsapp
npm test -- --test-name-pattern=config
```

Expected: FAIL because `package.json` and `src/config.mjs` do not exist yet.

- [ ] **Step 3: Add project package and environment files**

Create `mcp-whatsapp/package.json`:

```json
{
  "name": "mcp-whatsapp",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "description": "Local MCP server for Meta WhatsApp Cloud API",
  "bin": {
    "mcp-whatsapp": "./src/cli.mjs"
  },
  "scripts": {
    "mcp": "node src/cli.mjs mcp",
    "webhook": "node src/cli.mjs webhook",
    "health": "node src/cli.mjs health",
    "test": "node --test test/*.test.mjs"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.17.5",
    "dotenv": "^16.4.7",
    "sql.js": "^1.12.0",
    "zod": "^3.25.0"
  },
  "devDependencies": {}
}
```

Create `mcp-whatsapp/.env.example`:

```dotenv
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_BUSINESS_ACCOUNT_ID=
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_APP_SECRET=
WHATSAPP_GRAPH_API_VERSION=v23.0
WHATSAPP_WEBHOOK_PORT=8787
WHATSAPP_SQLITE_PATH=data/whatsapp.sqlite
WHATSAPP_MEDIA_DIR=data/media
```

Create `mcp-whatsapp/.gitignore`:

```gitignore
node_modules/
.env
data/*.sqlite
data/*.sqlite-*
data/media/
*.log
```

Create `mcp-whatsapp/data/.gitkeep` as an empty file.

- [ ] **Step 4: Implement configuration loading**

Create `mcp-whatsapp/src/config.mjs`:

```js
import "dotenv/config";
import { resolve } from "node:path";

const REQUIRED_ENV = [
  "WHATSAPP_ACCESS_TOKEN",
  "WHATSAPP_PHONE_NUMBER_ID",
  "WHATSAPP_BUSINESS_ACCOUNT_ID",
  "WHATSAPP_VERIFY_TOKEN",
];

export function redactSecret(value) {
  if (!value) return "";
  if (value.length < 12) return "*****";
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

export function loadConfig({ env = process.env, cwd = process.cwd() } = {}) {
  const missing = REQUIRED_ENV.filter((name) => !env[name]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  const graphApiVersion = env.WHATSAPP_GRAPH_API_VERSION || "v23.0";
  const webhookPort = Number(env.WHATSAPP_WEBHOOK_PORT || 8787);
  if (!Number.isInteger(webhookPort) || webhookPort <= 0 || webhookPort > 65535) {
    throw new Error("WHATSAPP_WEBHOOK_PORT must be a TCP port between 1 and 65535");
  }

  const sqlitePath = resolve(cwd, env.WHATSAPP_SQLITE_PATH || "data/whatsapp.sqlite");
  const mediaDir = resolve(cwd, env.WHATSAPP_MEDIA_DIR || "data/media");

  return {
    accessToken: env.WHATSAPP_ACCESS_TOKEN,
    phoneNumberId: env.WHATSAPP_PHONE_NUMBER_ID,
    businessAccountId: env.WHATSAPP_BUSINESS_ACCOUNT_ID,
    verifyToken: env.WHATSAPP_VERIFY_TOKEN,
    appSecret: env.WHATSAPP_APP_SECRET || "",
    graphApiVersion,
    graphBaseUrl: `https://graph.facebook.com/${graphApiVersion}`,
    webhookPort,
    sqlitePath,
    mediaDir,
    redactedAccessToken: redactSecret(env.WHATSAPP_ACCESS_TOKEN),
  };
}
```

- [ ] **Step 5: Add the initial CLI used by npm scripts**

Create `mcp-whatsapp/src/cli.mjs`:

```js
#!/usr/bin/env node
import { loadConfig } from "./config.mjs";

const command = process.argv[2] || "mcp";

if (command === "health") {
  const config = loadConfig();
  console.log(JSON.stringify({
    ok: true,
    phoneNumberId: config.phoneNumberId,
    businessAccountId: config.businessAccountId,
    graphApiVersion: config.graphApiVersion,
    accessToken: config.redactedAccessToken,
  }, null, 2));
} else {
  console.error(`Command "${command}" is not available in the current scaffold.`);
  process.exitCode = 1;
}
```

- [ ] **Step 6: Install dependencies**

Run:

```powershell
Set-Location mcp-whatsapp
npm install
```

Expected: `package-lock.json` is created and dependencies install successfully.

- [ ] **Step 7: Run config tests**

Run:

```powershell
Set-Location mcp-whatsapp
npm test -- --test-name-pattern=config
```

Expected: PASS for all config tests.

- [ ] **Step 8: Commit scaffold**

Run:

```powershell
git add mcp-whatsapp
git commit -m "feat: scaffold WhatsApp MCP project"
```

## Task 2: Add SQLite Store

**Files:**
- Create: `mcp-whatsapp/src/store.mjs`
- Test: `mcp-whatsapp/test/store.test.mjs`

- [ ] **Step 1: Write store tests**

Create `mcp-whatsapp/test/store.test.mjs`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createStore } from "../src/store.mjs";

async function withStore(run) {
  const dir = await mkdtemp(join(tmpdir(), "mcp-whatsapp-store-"));
  const store = await createStore({ sqlitePath: join(dir, "test.sqlite") });
  try {
    await run(store);
  } finally {
    await store.close();
    await rm(dir, { recursive: true, force: true });
  }
}

test("store initializes and persists inbound messages", async () => {
  await withStore(async (store) => {
    const message = await store.upsertInboundMessage({
      waId: "351900000000",
      profileName: "Joao",
      messageId: "wamid.inbound1",
      timestamp: 1710000000,
      type: "text",
      textBody: "Ola",
      rawPayloadId: null,
    });

    assert.equal(message.id, "wamid.inbound1");
    const conversations = await store.listConversations({ limit: 10 });
    assert.equal(conversations.length, 1);
    assert.equal(conversations[0].wa_id, "351900000000");
    assert.equal(conversations[0].last_message_text, "Ola");

    const messages = await store.listMessages({ waId: "351900000000", limit: 10 });
    assert.equal(messages.length, 1);
    assert.equal(messages[0].direction, "inbound");
    assert.equal(messages[0].text_body, "Ola");
  });
});

test("store records outbound messages and status updates", async () => {
  await withStore(async (store) => {
    await store.insertOutboundMessage({
      waId: "351900000001",
      messageId: "wamid.out1",
      type: "text",
      textBody: "Teste",
      status: "sent",
    });
    await store.recordStatus({
      messageId: "wamid.out1",
      status: "delivered",
      timestamp: 1710000100,
      recipientId: "351900000001",
      rawPayloadId: null,
    });

    const message = await store.getMessage("wamid.out1");
    assert.equal(message.status, "delivered");
  });
});

test("store saves raw payloads for later inspection", async () => {
  await withStore(async (store) => {
    const id = await store.saveRawWebhookPayload({
      signature: "sha256=abc",
      payload: { object: "whatsapp_business_account" },
    });

    assert.equal(typeof id, "number");
    const payload = await store.getRawWebhookPayload(id);
    assert.equal(payload.signature, "sha256=abc");
    assert.equal(payload.payload.object, "whatsapp_business_account");
  });
});
```

- [ ] **Step 2: Run store tests and verify they fail**

Run:

```powershell
Set-Location mcp-whatsapp
npm test -- --test-name-pattern=store
```

Expected: FAIL because `src/store.mjs` does not exist yet.

- [ ] **Step 3: Implement the SQLite store**

Create `mcp-whatsapp/src/store.mjs`:

```js
import initSqlJs from "sql.js";
import { dirname } from "node:path";
import { mkdir, readFile, writeFile } from "node:fs/promises";

let SQL_PROMISE;

async function loadSql() {
  SQL_PROMISE ||= initSqlJs();
  return SQL_PROMISE;
}

function rowFromStatement(statement) {
  if (!statement.step()) return null;
  return statement.getAsObject();
}

function rowsFromStatement(statement) {
  const rows = [];
  while (statement.step()) rows.push(statement.getAsObject());
  return rows;
}

export async function createStore({ sqlitePath }) {
  const SQL = await loadSql();
  await mkdir(dirname(sqlitePath), { recursive: true });

  let db;
  try {
    db = new SQL.Database(await readFile(sqlitePath));
  } catch {
    db = new SQL.Database();
  }

  const persist = async () => {
    await writeFile(sqlitePath, Buffer.from(db.export()));
  };

  db.run(`
    CREATE TABLE IF NOT EXISTS contacts (
      wa_id TEXT PRIMARY KEY,
      profile_name TEXT,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS raw_webhook_payloads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      received_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      signature TEXT,
      payload_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      wa_id TEXT NOT NULL,
      direction TEXT NOT NULL CHECK(direction IN ('inbound', 'outbound')),
      type TEXT NOT NULL,
      text_body TEXT,
      media_id TEXT,
      status TEXT,
      timestamp INTEGER,
      raw_payload_id INTEGER,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS message_statuses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message_id TEXT NOT NULL,
      recipient_id TEXT,
      status TEXT NOT NULL,
      timestamp INTEGER,
      raw_payload_id INTEGER,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS media (
      media_id TEXT PRIMARY KEY,
      message_id TEXT,
      mime_type TEXT,
      sha256 TEXT,
      local_path TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await persist();

  function upsertContact({ waId, profileName }) {
    db.run(
      `INSERT INTO contacts (wa_id, profile_name, updated_at)
       VALUES (?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(wa_id) DO UPDATE SET
         profile_name = COALESCE(excluded.profile_name, contacts.profile_name),
         updated_at = CURRENT_TIMESTAMP`,
      [waId, profileName || null]
    );
  }

  return {
    async saveRawWebhookPayload({ signature, payload }) {
      db.run(
        "INSERT INTO raw_webhook_payloads (signature, payload_json) VALUES (?, ?)",
        [signature || null, JSON.stringify(payload)]
      );
      const id = db.exec("SELECT last_insert_rowid() AS id")[0].values[0][0];
      await persist();
      return id;
    },

    async getRawWebhookPayload(id) {
      const statement = db.prepare("SELECT * FROM raw_webhook_payloads WHERE id = ?");
      statement.bind([id]);
      const row = rowFromStatement(statement);
      statement.free();
      if (!row) return null;
      return { ...row, payload: JSON.parse(row.payload_json) };
    },

    async upsertInboundMessage({ waId, profileName, messageId, timestamp, type, textBody, mediaId, rawPayloadId }) {
      upsertContact({ waId, profileName });
      db.run(
        `INSERT INTO messages (id, wa_id, direction, type, text_body, media_id, status, timestamp, raw_payload_id, updated_at)
         VALUES (?, ?, 'inbound', ?, ?, ?, 'received', ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(id) DO UPDATE SET
           text_body = excluded.text_body,
           media_id = excluded.media_id,
           status = excluded.status,
           timestamp = excluded.timestamp,
           raw_payload_id = excluded.raw_payload_id,
           updated_at = CURRENT_TIMESTAMP`,
        [messageId, waId, type, textBody || null, mediaId || null, timestamp || null, rawPayloadId || null]
      );
      await persist();
      return this.getMessage(messageId);
    },

    async insertOutboundMessage({ waId, messageId, type, textBody, status }) {
      upsertContact({ waId });
      db.run(
        `INSERT INTO messages (id, wa_id, direction, type, text_body, status, updated_at)
         VALUES (?, ?, 'outbound', ?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(id) DO UPDATE SET
           status = excluded.status,
           updated_at = CURRENT_TIMESTAMP`,
        [messageId, waId, type, textBody || null, status || "sent"]
      );
      await persist();
      return this.getMessage(messageId);
    },

    async recordStatus({ messageId, status, timestamp, recipientId, rawPayloadId }) {
      db.run(
        `INSERT INTO message_statuses (message_id, recipient_id, status, timestamp, raw_payload_id)
         VALUES (?, ?, ?, ?, ?)`,
        [messageId, recipientId || null, status, timestamp || null, rawPayloadId || null]
      );
      db.run(
        "UPDATE messages SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [status, messageId]
      );
      await persist();
    },

    async listConversations({ limit = 20 } = {}) {
      const statement = db.prepare(`
        SELECT c.wa_id, c.profile_name, m.text_body AS last_message_text, m.type AS last_message_type,
               m.direction AS last_message_direction, m.timestamp AS last_message_timestamp, m.updated_at AS last_message_updated_at
        FROM contacts c
        LEFT JOIN messages m ON m.id = (
          SELECT id FROM messages WHERE wa_id = c.wa_id ORDER BY COALESCE(timestamp, 0) DESC, updated_at DESC LIMIT 1
        )
        ORDER BY COALESCE(m.timestamp, 0) DESC, c.updated_at DESC
        LIMIT ?
      `);
      statement.bind([limit]);
      const rows = rowsFromStatement(statement);
      statement.free();
      return rows;
    },

    async listMessages({ waId, limit = 50 } = {}) {
      const statement = db.prepare(`
        SELECT * FROM messages
        WHERE wa_id = ?
        ORDER BY COALESCE(timestamp, 0) DESC, updated_at DESC
        LIMIT ?
      `);
      statement.bind([waId, limit]);
      const rows = rowsFromStatement(statement);
      statement.free();
      return rows;
    },

    async getMessage(messageId) {
      const statement = db.prepare("SELECT * FROM messages WHERE id = ?");
      statement.bind([messageId]);
      const row = rowFromStatement(statement);
      statement.free();
      return row;
    },

    async close() {
      await persist();
      db.close();
    },
  };
}
```

- [ ] **Step 4: Run store tests**

Run:

```powershell
Set-Location mcp-whatsapp
npm test -- --test-name-pattern=store
```

Expected: PASS for all store tests.

- [ ] **Step 5: Commit store**

Run:

```powershell
git add mcp-whatsapp/src/store.mjs mcp-whatsapp/test/store.test.mjs
git commit -m "feat: add WhatsApp local store"
```

## Task 3: Add WhatsApp Graph API Client

**Files:**
- Create: `mcp-whatsapp/src/whatsapp-api.mjs`
- Test: `mcp-whatsapp/test/whatsapp-api.test.mjs`

- [ ] **Step 1: Write API client tests**

Create `mcp-whatsapp/test/whatsapp-api.test.mjs`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { createWhatsAppApi, WhatsAppApiError } from "../src/whatsapp-api.mjs";

const config = {
  accessToken: "secret-token",
  phoneNumberId: "12345",
  graphBaseUrl: "https://graph.facebook.com/v23.0",
};

test("sendText posts a WhatsApp text message", async () => {
  const calls = [];
  const api = createWhatsAppApi({
    config,
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return Response.json({ messages: [{ id: "wamid.out1" }] });
    },
  });

  const result = await api.sendText({ to: "351900000000", body: "Ola" });
  assert.equal(result.messageId, "wamid.out1");
  assert.equal(calls[0].url, "https://graph.facebook.com/v23.0/12345/messages");
  assert.equal(calls[0].options.headers.Authorization, "Bearer secret-token");
  assert.deepEqual(JSON.parse(calls[0].options.body), {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: "351900000000",
    type: "text",
    text: { preview_url: false, body: "Ola" },
  });
});

test("markRead sends read status for an inbound message", async () => {
  const calls = [];
  const api = createWhatsAppApi({
    config,
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return Response.json({ success: true });
    },
  });

  await api.markRead({ messageId: "wamid.in1" });
  assert.deepEqual(JSON.parse(calls[0].options.body), {
    messaging_product: "whatsapp",
    status: "read",
    message_id: "wamid.in1",
  });
});

test("Graph API errors become structured WhatsAppApiError values", async () => {
  const api = createWhatsAppApi({
    config,
    fetchImpl: async () => Response.json(
      { error: { message: "Bad token", code: 190, type: "OAuthException" } },
      { status: 401 }
    ),
  });

  await assert.rejects(
    () => api.getPhoneNumber(),
    (error) => {
      assert.equal(error instanceof WhatsAppApiError, true);
      assert.equal(error.status, 401);
      assert.equal(error.metaCode, 190);
      assert.match(error.message, /Bad token/);
      return true;
    }
  );
});
```

- [ ] **Step 2: Run API tests and verify they fail**

Run:

```powershell
Set-Location mcp-whatsapp
npm test -- --test-name-pattern="sendText|markRead|Graph API"
```

Expected: FAIL because `src/whatsapp-api.mjs` does not exist yet.

- [ ] **Step 3: Implement API client**

Create `mcp-whatsapp/src/whatsapp-api.mjs`:

```js
export class WhatsAppApiError extends Error {
  constructor({ message, status, metaCode, metaType, details }) {
    super(message);
    this.name = "WhatsAppApiError";
    this.status = status;
    this.metaCode = metaCode;
    this.metaType = metaType;
    this.details = details;
  }
}

export function createWhatsAppApi({ config, fetchImpl = fetch }) {
  async function request(path, { method = "GET", body } = {}) {
    const response = await fetchImpl(`${config.graphBaseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const meta = payload.error || {};
      throw new WhatsAppApiError({
        message: meta.message || `WhatsApp API request failed with HTTP ${response.status}`,
        status: response.status,
        metaCode: meta.code,
        metaType: meta.type,
        details: payload,
      });
    }
    return payload;
  }

  return {
    async sendText({ to, body, previewUrl = false }) {
      const payload = await request(`/${config.phoneNumberId}/messages`, {
        method: "POST",
        body: {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to,
          type: "text",
          text: { preview_url: previewUrl, body },
        },
      });
      return { messageId: payload.messages?.[0]?.id, raw: payload };
    },

    async sendTemplate({ to, name, languageCode, components = [] }) {
      const payload = await request(`/${config.phoneNumberId}/messages`, {
        method: "POST",
        body: {
          messaging_product: "whatsapp",
          to,
          type: "template",
          template: {
            name,
            language: { code: languageCode },
            ...(components.length > 0 ? { components } : {}),
          },
        },
      });
      return { messageId: payload.messages?.[0]?.id, raw: payload };
    },

    async markRead({ messageId }) {
      return request(`/${config.phoneNumberId}/messages`, {
        method: "POST",
        body: {
          messaging_product: "whatsapp",
          status: "read",
          message_id: messageId,
        },
      });
    },

    async getPhoneNumber() {
      return request(`/${config.phoneNumberId}?fields=display_phone_number,verified_name,quality_rating,platform_type,throughput`);
    },

    async getMediaMetadata({ mediaId }) {
      return request(`/${mediaId}`);
    },

    async downloadMedia({ url }) {
      const response = await fetchImpl(url, {
        headers: { Authorization: `Bearer ${config.accessToken}` },
      });
      if (!response.ok) {
        throw new WhatsAppApiError({
          message: `Media download failed with HTTP ${response.status}`,
          status: response.status,
          details: {},
        });
      }
      return Buffer.from(await response.arrayBuffer());
    },
  };
}
```

- [ ] **Step 4: Run API tests**

Run:

```powershell
Set-Location mcp-whatsapp
npm test -- --test-name-pattern="sendText|markRead|Graph API"
```

Expected: PASS for all API client tests.

- [ ] **Step 5: Commit API client**

Run:

```powershell
git add mcp-whatsapp/src/whatsapp-api.mjs mcp-whatsapp/test/whatsapp-api.test.mjs
git commit -m "feat: add WhatsApp Cloud API client"
```

## Task 4: Parse And Serve Webhooks

**Files:**
- Create: `mcp-whatsapp/src/webhook-parser.mjs`
- Create: `mcp-whatsapp/src/webhook-server.mjs`
- Test: `mcp-whatsapp/test/webhook-parser.test.mjs`
- Test: `mcp-whatsapp/test/webhook-server.test.mjs`
- Modify: `mcp-whatsapp/src/cli.mjs`

- [ ] **Step 1: Write webhook parser tests**

Create `mcp-whatsapp/test/webhook-parser.test.mjs`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { parseWebhookPayload } from "../src/webhook-parser.mjs";

test("parseWebhookPayload extracts text messages and statuses", () => {
  const result = parseWebhookPayload({
    object: "whatsapp_business_account",
    entry: [{
      changes: [{
        value: {
          contacts: [{ wa_id: "351900000000", profile: { name: "Joao" } }],
          messages: [{
            from: "351900000000",
            id: "wamid.in1",
            timestamp: "1710000000",
            type: "text",
            text: { body: "Ola" },
          }],
          statuses: [{
            id: "wamid.out1",
            recipient_id: "351900000000",
            status: "delivered",
            timestamp: "1710000100",
          }],
        },
      }],
    }],
  });

  assert.deepEqual(result.messages[0], {
    waId: "351900000000",
    profileName: "Joao",
    messageId: "wamid.in1",
    timestamp: 1710000000,
    type: "text",
    textBody: "Ola",
    mediaId: null,
  });
  assert.equal(result.statuses[0].status, "delivered");
});
```

- [ ] **Step 2: Write webhook server tests**

Create `mcp-whatsapp/test/webhook-server.test.mjs`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { createWebhookRequestHandler } from "../src/webhook-server.mjs";

function makeStore() {
  return {
    raw: [],
    messages: [],
    statuses: [],
    async saveRawWebhookPayload(payload) {
      this.raw.push(payload);
      return this.raw.length;
    },
    async upsertInboundMessage(message) {
      this.messages.push(message);
    },
    async recordStatus(status) {
      this.statuses.push(status);
    },
  };
}

test("GET /webhook verifies Meta challenge", async () => {
  const handler = createWebhookRequestHandler({
    config: { verifyToken: "verify-me", appSecret: "" },
    store: makeStore(),
  });
  const response = await handler(new Request("http://local/webhook?hub.mode=subscribe&hub.verify_token=verify-me&hub.challenge=abc123"));
  assert.equal(response.status, 200);
  assert.equal(await response.text(), "abc123");
});

test("POST /webhook validates signature when app secret is configured", async () => {
  const store = makeStore();
  const body = JSON.stringify({ object: "whatsapp_business_account", entry: [] });
  const signature = `sha256=${crypto.createHmac("sha256", "app-secret").update(body).digest("hex")}`;
  const handler = createWebhookRequestHandler({
    config: { verifyToken: "verify-me", appSecret: "app-secret" },
    store,
  });

  const response = await handler(new Request("http://local/webhook", {
    method: "POST",
    headers: { "x-hub-signature-256": signature, "content-type": "application/json" },
    body,
  }));

  assert.equal(response.status, 200);
  assert.equal(store.raw.length, 1);
});
```

- [ ] **Step 3: Run webhook tests and verify they fail**

Run:

```powershell
Set-Location mcp-whatsapp
npm test -- --test-name-pattern=webhook
```

Expected: FAIL because webhook modules do not exist yet.

- [ ] **Step 4: Implement webhook parser**

Create `mcp-whatsapp/src/webhook-parser.mjs`:

```js
export function parseWebhookPayload(payload) {
  const messages = [];
  const statuses = [];

  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      const value = change.value || {};
      const contactsByWaId = new Map((value.contacts || []).map((contact) => [
        contact.wa_id,
        contact.profile?.name || null,
      ]));

      for (const message of value.messages || []) {
        const media = message.image || message.audio || message.video || message.document || message.sticker || null;
        messages.push({
          waId: message.from,
          profileName: contactsByWaId.get(message.from) || null,
          messageId: message.id,
          timestamp: Number(message.timestamp || 0),
          type: message.type,
          textBody: message.text?.body || message.button?.text || message.interactive?.button_reply?.title || null,
          mediaId: media?.id || null,
        });
      }

      for (const status of value.statuses || []) {
        statuses.push({
          messageId: status.id,
          recipientId: status.recipient_id || null,
          status: status.status,
          timestamp: Number(status.timestamp || 0),
        });
      }
    }
  }

  return { messages, statuses };
}
```

- [ ] **Step 5: Implement webhook server**

Create `mcp-whatsapp/src/webhook-server.mjs`:

```js
import crypto from "node:crypto";
import { createServer } from "node:http";
import { parseWebhookPayload } from "./webhook-parser.mjs";

function timingSafeEqualText(left, right) {
  const leftBuffer = Buffer.from(left || "");
  const rightBuffer = Buffer.from(right || "");
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function hasValidSignature({ body, signature, appSecret }) {
  if (!appSecret) return true;
  if (!signature?.startsWith("sha256=")) return false;
  const expected = `sha256=${crypto.createHmac("sha256", appSecret).update(body).digest("hex")}`;
  return timingSafeEqualText(signature, expected);
}

export function createWebhookRequestHandler({ config, store }) {
  return async function handle(request) {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "content-type": "application/json" } });
    }

    if (url.pathname !== "/webhook") {
      return new Response("Not found", { status: 404 });
    }

    if (request.method === "GET") {
      const mode = url.searchParams.get("hub.mode");
      const token = url.searchParams.get("hub.verify_token");
      const challenge = url.searchParams.get("hub.challenge");
      if (mode === "subscribe" && token === config.verifyToken && challenge) {
        return new Response(challenge, { status: 200 });
      }
      return new Response("Forbidden", { status: 403 });
    }

    if (request.method === "POST") {
      const body = await request.text();
      const signature = request.headers.get("x-hub-signature-256") || "";
      if (!hasValidSignature({ body, signature, appSecret: config.appSecret })) {
        return new Response("Invalid signature", { status: 401 });
      }

      const payload = JSON.parse(body);
      const rawPayloadId = await store.saveRawWebhookPayload({ signature, payload });
      const parsed = parseWebhookPayload(payload);
      for (const message of parsed.messages) {
        await store.upsertInboundMessage({ ...message, rawPayloadId });
      }
      for (const status of parsed.statuses) {
        await store.recordStatus({ ...status, rawPayloadId });
      }
      return new Response("OK", { status: 200 });
    }

    return new Response("Method not allowed", { status: 405 });
  };
}

export function startWebhookServer({ config, store }) {
  const handler = createWebhookRequestHandler({ config, store });
  const server = createServer(async (req, res) => {
    const request = new Request(`http://127.0.0.1:${config.webhookPort}${req.url}`, {
      method: req.method,
      headers: req.headers,
      body: req.method === "GET" || req.method === "HEAD" ? undefined : req,
      duplex: "half",
    });
    const response = await handler(request);
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(await response.text());
  });
  server.listen(config.webhookPort, "127.0.0.1", () => {
    console.log(`WhatsApp webhook listening on http://127.0.0.1:${config.webhookPort}`);
  });
  return server;
}
```

- [ ] **Step 6: Wire webhook command**

Modify `mcp-whatsapp/src/cli.mjs` to:

```js
#!/usr/bin/env node
import { loadConfig } from "./config.mjs";
import { createStore } from "./store.mjs";
import { startWebhookServer } from "./webhook-server.mjs";

const command = process.argv[2] || "mcp";

if (command === "health") {
  const config = loadConfig();
  console.log(JSON.stringify({
    ok: true,
    phoneNumberId: config.phoneNumberId,
    businessAccountId: config.businessAccountId,
    graphApiVersion: config.graphApiVersion,
    accessToken: config.redactedAccessToken,
  }, null, 2));
} else if (command === "webhook") {
  const config = loadConfig();
  const store = await createStore({ sqlitePath: config.sqlitePath });
  startWebhookServer({ config, store });
} else if (command === "mcp") {
  console.error("MCP server is not available in this build step.");
  process.exitCode = 1;
} else {
  console.error(`Unknown command "${command}". Use one of: mcp, webhook, health.`);
  process.exitCode = 1;
}
```

- [ ] **Step 7: Run webhook tests**

Run:

```powershell
Set-Location mcp-whatsapp
npm test -- --test-name-pattern=webhook
```

Expected: PASS for webhook parser and server tests.

- [ ] **Step 8: Commit webhooks**

Run:

```powershell
git add mcp-whatsapp/src/webhook-parser.mjs mcp-whatsapp/src/webhook-server.mjs mcp-whatsapp/src/cli.mjs mcp-whatsapp/test/webhook-parser.test.mjs mcp-whatsapp/test/webhook-server.test.mjs
git commit -m "feat: receive WhatsApp webhooks locally"
```

## Task 5: Add MCP Tool Server

**Files:**
- Create: `mcp-whatsapp/src/mcp-server.mjs`
- Test: `mcp-whatsapp/test/mcp-server.test.mjs`
- Modify: `mcp-whatsapp/src/cli.mjs`

- [ ] **Step 1: Write MCP handler tests**

Create `mcp-whatsapp/test/mcp-server.test.mjs`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { createToolHandlers } from "../src/mcp-server.mjs";

test("whatsapp_send_text sends through API and persists outbound message", async () => {
  const calls = [];
  const handlers = createToolHandlers({
    api: {
      async sendText(input) {
        calls.push(input);
        return { messageId: "wamid.out1", raw: { ok: true } };
      },
    },
    store: {
      async insertOutboundMessage(message) {
        calls.push(message);
      },
    },
    config: { phoneNumberId: "12345", businessAccountId: "67890", graphApiVersion: "v23.0" },
  });

  const result = await handlers.whatsapp_send_text({ to: "351900000000", body: "Ola" });
  assert.equal(result.messageId, "wamid.out1");
  assert.equal(calls[0].to, "351900000000");
  assert.equal(calls[1].status, "sent");
});

test("whatsapp_list_messages reads from local store", async () => {
  const handlers = createToolHandlers({
    api: {},
    config: {},
    store: {
      async listMessages({ waId, limit }) {
        return [{ id: "wamid.in1", wa_id: waId, text_body: "Ola", limit }];
      },
    },
  });

  const result = await handlers.whatsapp_list_messages({ waId: "351900000000", limit: 5 });
  assert.equal(result.messages[0].text_body, "Ola");
});
```

- [ ] **Step 2: Run MCP tests and verify they fail**

Run:

```powershell
Set-Location mcp-whatsapp
npm test -- --test-name-pattern=whatsapp_
```

Expected: FAIL because `src/mcp-server.mjs` does not exist yet.

- [ ] **Step 3: Implement tool handlers and MCP server**

Create `mcp-whatsapp/src/mcp-server.mjs`:

```js
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

function asContent(payload) {
  return {
    content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
    structuredContent: payload,
  };
}

export function createToolHandlers({ api, store, config }) {
  return {
    async whatsapp_health_check() {
      const phone = await api.getPhoneNumber?.();
      return {
        ok: true,
        phoneNumberId: config.phoneNumberId,
        businessAccountId: config.businessAccountId,
        graphApiVersion: config.graphApiVersion,
        phoneNumber: phone || null,
      };
    },

    async whatsapp_get_phone_number() {
      return { phoneNumber: await api.getPhoneNumber() };
    },

    async whatsapp_send_text({ to, body, previewUrl = false }) {
      const result = await api.sendText({ to, body, previewUrl });
      await store.insertOutboundMessage({
        waId: to,
        messageId: result.messageId,
        type: "text",
        textBody: body,
        status: "sent",
      });
      return result;
    },

    async whatsapp_send_template({ to, name, languageCode, components = [] }) {
      const result = await api.sendTemplate({ to, name, languageCode, components });
      await store.insertOutboundMessage({
        waId: to,
        messageId: result.messageId,
        type: "template",
        textBody: name,
        status: "sent",
      });
      return result;
    },

    async whatsapp_list_conversations({ limit = 20 } = {}) {
      return { conversations: await store.listConversations({ limit }) };
    },

    async whatsapp_list_messages({ waId, limit = 50 }) {
      return { messages: await store.listMessages({ waId, limit }) };
    },

    async whatsapp_get_message({ messageId }) {
      return { message: await store.getMessage(messageId) };
    },

    async whatsapp_mark_read({ messageId }) {
      const result = await api.markRead({ messageId });
      await store.recordStatus({ messageId, status: "read", timestamp: Math.floor(Date.now() / 1000), recipientId: null, rawPayloadId: null });
      return { ok: true, result };
    },

    async whatsapp_download_media({ mediaId, fileName }) {
      const metadata = await api.getMediaMetadata({ mediaId });
      const bytes = await api.downloadMedia({ url: metadata.url });
      await mkdir(config.mediaDir, { recursive: true });
      const safeName = fileName || `${mediaId}.bin`;
      const localPath = join(config.mediaDir, safeName.replace(/[^\w.-]/g, "_"));
      await writeFile(localPath, bytes);
      return { mediaId, localPath, metadata };
    },
  };
}

export function createMcpServer({ handlers }) {
  const server = new McpServer({ name: "mcp-whatsapp", version: "0.1.0" });

  server.registerTool("whatsapp_health_check", {
    title: "WhatsApp Health Check",
    description: "Validate local configuration, database access, and selected Graph API connectivity.",
    inputSchema: {},
  }, async () => asContent(await handlers.whatsapp_health_check()));
  server.registerTool("whatsapp_get_phone_number", {
    title: "Get WhatsApp Phone Number",
    description: "Return metadata for the configured WhatsApp Cloud API phone number.",
    inputSchema: {},
  }, async () => asContent(await handlers.whatsapp_get_phone_number()));
  server.registerTool("whatsapp_send_text", {
    title: "Send WhatsApp Text",
    description: "Send a free-form WhatsApp text message to one recipient.",
    inputSchema: {
      to: z.string().min(5),
      body: z.string().min(1),
      previewUrl: z.boolean().optional(),
    },
  }, async (input) => asContent(await handlers.whatsapp_send_text(input)));
  server.registerTool("whatsapp_send_template", {
    title: "Send WhatsApp Template",
    description: "Send an approved WhatsApp template message.",
    inputSchema: {
      to: z.string().min(5),
      name: z.string().min(1),
      languageCode: z.string().min(2),
      components: z.array(z.unknown()).optional(),
    },
  }, async (input) => asContent(await handlers.whatsapp_send_template(input)));
  server.registerTool("whatsapp_list_conversations", {
    title: "List WhatsApp Conversations",
    description: "List conversations stored in the local SQLite inbox.",
    inputSchema: {
      limit: z.number().int().min(1).max(100).optional(),
    },
  }, async (input) => asContent(await handlers.whatsapp_list_conversations(input)));
  server.registerTool("whatsapp_list_messages", {
    title: "List WhatsApp Messages",
    description: "List stored messages for one WhatsApp ID.",
    inputSchema: {
      waId: z.string().min(5),
      limit: z.number().int().min(1).max(200).optional(),
    },
  }, async (input) => asContent(await handlers.whatsapp_list_messages(input)));
  server.registerTool("whatsapp_get_message", {
    title: "Get WhatsApp Message",
    description: "Return one locally stored WhatsApp message by message ID.",
    inputSchema: {
      messageId: z.string().min(1),
    },
  }, async (input) => asContent(await handlers.whatsapp_get_message(input)));
  server.registerTool("whatsapp_mark_read", {
    title: "Mark WhatsApp Message Read",
    description: "Mark an inbound WhatsApp message as read through the Cloud API.",
    inputSchema: {
      messageId: z.string().min(1),
    },
  }, async (input) => asContent(await handlers.whatsapp_mark_read(input)));
  server.registerTool("whatsapp_download_media", {
    title: "Download WhatsApp Media",
    description: "Download WhatsApp media by media ID into the local data directory.",
    inputSchema: {
      mediaId: z.string().min(1),
      fileName: z.string().optional(),
    },
  }, async (input) => asContent(await handlers.whatsapp_download_media(input)));

  return server;
}

export async function startMcpServer({ api, store, config }) {
  const handlers = createToolHandlers({ api, store, config });
  const server = createMcpServer({ handlers });
  await server.connect(new StdioServerTransport());
}
```

- [ ] **Step 4: Wire MCP command**

Modify `mcp-whatsapp/src/cli.mjs`:

```js
#!/usr/bin/env node
import { loadConfig } from "./config.mjs";
import { createStore } from "./store.mjs";
import { createWhatsAppApi } from "./whatsapp-api.mjs";
import { startWebhookServer } from "./webhook-server.mjs";
import { startMcpServer } from "./mcp-server.mjs";

const command = process.argv[2] || "mcp";

if (command === "health") {
  const config = loadConfig();
  console.log(JSON.stringify({
    ok: true,
    phoneNumberId: config.phoneNumberId,
    businessAccountId: config.businessAccountId,
    graphApiVersion: config.graphApiVersion,
    accessToken: config.redactedAccessToken,
  }, null, 2));
} else if (command === "webhook") {
  const config = loadConfig();
  const store = await createStore({ sqlitePath: config.sqlitePath });
  startWebhookServer({ config, store });
} else if (command === "mcp") {
  const config = loadConfig();
  const store = await createStore({ sqlitePath: config.sqlitePath });
  const api = createWhatsAppApi({ config });
  await startMcpServer({ api, store, config });
} else {
  console.error(`Unknown command "${command}". Use one of: mcp, webhook, health.`);
  process.exitCode = 1;
}
```

- [ ] **Step 5: Run MCP tests**

Run:

```powershell
Set-Location mcp-whatsapp
npm test -- --test-name-pattern=whatsapp_
```

Expected: PASS for MCP handler tests.

- [ ] **Step 6: Run the full test suite**

Run:

```powershell
Set-Location mcp-whatsapp
npm test
```

Expected: PASS for all tests.

- [ ] **Step 7: Commit MCP server**

Run:

```powershell
git add mcp-whatsapp/src/mcp-server.mjs mcp-whatsapp/src/cli.mjs mcp-whatsapp/test/mcp-server.test.mjs
git commit -m "feat: expose WhatsApp MCP tools"
```

## Task 6: Add Setup Documentation And Manual Verification Guide

**Files:**
- Create: `mcp-whatsapp/README.md`
- Modify: `mcp-whatsapp/package.json`

- [ ] **Step 1: Add README**

Create `mcp-whatsapp/README.md`:

```md
# WhatsApp MCP

Local MCP server for Meta WhatsApp Cloud API.

## What This Can And Cannot Read

This MCP reads WhatsApp messages that arrive through the configured Meta webhook while the webhook server and tunnel are running. It cannot import old WhatsApp history from the mobile app, desktop app, or WhatsApp Web.

## Setup

1. Copy `.env.example` to `.env`.
2. In Meta Developers, create or select an app.
3. Add the WhatsApp product.
4. Create or connect a WhatsApp Business Account.
5. Configure a test or production phone number.
6. Generate an access token with WhatsApp Cloud API permissions.
7. Fill these values in `.env`:
   - `WHATSAPP_ACCESS_TOKEN`
   - `WHATSAPP_PHONE_NUMBER_ID`
   - `WHATSAPP_BUSINESS_ACCOUNT_ID`
   - `WHATSAPP_VERIFY_TOKEN`
   - `WHATSAPP_APP_SECRET`
8. Install dependencies with `npm install`.
9. Start the webhook server with `npm run webhook`.
10. Start a tunnel to `http://127.0.0.1:8787`.

Cloudflare Tunnel:

```powershell
cloudflared tunnel --url http://127.0.0.1:8787
```

ngrok:

```powershell
ngrok http 8787
```

In Meta webhook settings, set the callback URL to:

```text
https://your-tunnel-url/webhook
```

Use the exact `WHATSAPP_VERIFY_TOKEN` value from `.env` as the verify token.

## MCP Client Config

Use this server command from this directory:

```powershell
npm run mcp
```

Or from another working directory:

```powershell
node C:\Users\jserr\Documents\New project\mcp-whatsapp\src\cli.mjs mcp
```

## Tools

- `whatsapp_health_check`: validates config and Graph API connectivity.
- `whatsapp_get_phone_number`: returns WhatsApp phone number metadata.
- `whatsapp_send_text`: sends a text message.
- `whatsapp_send_template`: sends an approved template message.
- `whatsapp_list_conversations`: lists local conversations stored from webhooks and outbound sends.
- `whatsapp_list_messages`: lists local messages for one WhatsApp ID.
- `whatsapp_get_message`: returns one stored message.
- `whatsapp_mark_read`: marks an inbound message as read through Cloud API.
- `whatsapp_download_media`: downloads inbound media to `data/media`.

## Manual Verification

1. Run `npm run health`.
2. Run `npm run webhook`.
3. Start the tunnel and configure Meta webhook verification.
4. Send a WhatsApp message to the configured number.
5. Call `whatsapp_list_conversations`.
6. Call `whatsapp_list_messages` for the sender WhatsApp ID.
7. Send a test text with `whatsapp_send_text`.
8. Confirm status updates arrive through the webhook.
```

- [ ] **Step 2: Add package keywords and engine**

Modify `mcp-whatsapp/package.json` to include:

```json
{
  "engines": {
    "node": ">=20"
  },
  "keywords": [
    "mcp",
    "whatsapp",
    "whatsapp-cloud-api",
    "model-context-protocol"
  ]
}
```

Keep the existing fields and insert these at top level.

- [ ] **Step 3: Run docs-adjacent smoke checks**

Run:

```powershell
Set-Location mcp-whatsapp
npm test
node src/cli.mjs health
```

Expected: tests pass. The health command prints missing environment variables unless `.env` has been filled; that is acceptable before Meta credentials exist.

- [ ] **Step 4: Commit documentation**

Run:

```powershell
git add mcp-whatsapp/README.md mcp-whatsapp/package.json
git commit -m "docs: add WhatsApp MCP setup guide"
```

## Task 7: Final Verification

**Files:**
- Modify only if previous steps reveal defects.

- [ ] **Step 1: Run full tests**

Run:

```powershell
Set-Location mcp-whatsapp
npm test
```

Expected: PASS for every test.

- [ ] **Step 2: Check git status**

Run:

```powershell
git status --short
```

Expected: no unstaged source changes except local `.env`, `node_modules`, SQLite files, or other ignored runtime files.

- [ ] **Step 3: Verify setup files are ignored**

Run:

```powershell
Set-Location mcp-whatsapp
git check-ignore .env data/whatsapp.sqlite data/media/example.bin
```

Expected: each path is printed, proving secrets and runtime data are ignored.

- [ ] **Step 4: Summarize implementation status**

Record these facts in the final handoff:

```text
Implemented: local MCP project, config, sql.js store, WhatsApp API client, webhook receiver, MCP tools, tests, setup guide.
Not completed by Codex: Meta Developer app creation, WhatsApp number configuration, access token creation, webhook callback registration.
Next manual action: fill mcp-whatsapp/.env and start npm run webhook plus a tunnel.
```

## Self-Review Notes

- Spec coverage: covered isolated project, config, API client, local store, webhook, MCP tools, setup guide, error handling, security ignores, and tests.
- Scope check: kept the first version to MCP plus webhook and avoided a web inbox UI.
- Known manual dependency: Meta account and WhatsApp Business setup remain user-owned by design.
