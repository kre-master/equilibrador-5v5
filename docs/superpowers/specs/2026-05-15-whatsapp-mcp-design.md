# WhatsApp MCP Local Design

## Goal

Create a local Model Context Protocol server for WhatsApp Business Platform using Meta's official WhatsApp Cloud API. The MCP should let an agent send messages, read newly received messages, inspect local conversation history, manage message status, and perform basic account health checks.

The server runs on the user's PC. Inbound WhatsApp events arrive through a public HTTPS tunnel that forwards Meta webhooks to the local webhook server.

## Non-Goals

- Import old WhatsApp history from the mobile or desktop app.
- Bypass Meta's WhatsApp Business Platform policies.
- Automate an unofficial WhatsApp Web session.
- Build a full web inbox UI in the first version.
- Store Meta credentials in source control.

## Constraints

- The official Cloud API has no endpoint for fetching arbitrary past chat history. The local inbox starts when the webhook is configured and running.
- Free-form replies are subject to Meta's customer service window rules. Business-initiated messages outside that window generally require approved templates.
- Inbound reading requires a public HTTPS webhook URL. For local-only use, that means a temporary tunnel such as Cloudflare Tunnel or ngrok.
- Some setup steps cannot be automated by Codex because they require the user's Meta account, WhatsApp Business account, phone number ownership, app approval choices, and token generation.

## Recommended Architecture

Build a new project folder named `mcp-whatsapp/` beside the existing app files. Keep it isolated from the current 5v5 web app.

```text
mcp-whatsapp/
  package.json
  README.md
  .env.example
  src/
    config.mjs
    mcp-server.mjs
    whatsapp-api.mjs
    webhook-server.mjs
    store.mjs
  data/
    .gitkeep
```

The MCP server exposes tools over stdio for Codex or another MCP client. The webhook server listens on a local HTTP port and receives requests forwarded by the tunnel. Both share a SQLite database under `mcp-whatsapp/data/`.

## Components

### Configuration

`src/config.mjs` reads environment variables, validates required values, and keeps secrets out of logs.

Required values:

- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_BUSINESS_ACCOUNT_ID`
- `WHATSAPP_VERIFY_TOKEN`

Optional but recommended values:

- `WHATSAPP_APP_SECRET`
- `WHATSAPP_GRAPH_API_VERSION`, defaulting to a current supported Graph API version chosen during implementation
- `WHATSAPP_WEBHOOK_PORT`, defaulting to `8787`
- `WHATSAPP_SQLITE_PATH`, defaulting to `data/whatsapp.sqlite`

### WhatsApp API Client

`src/whatsapp-api.mjs` wraps Meta Graph API calls:

- send text messages
- send template messages
- mark inbound messages as read
- fetch phone number metadata
- fetch media metadata and download media

The client should return normalized errors with the HTTP status, Meta error code, message, and request context.

### Local Store

`src/store.mjs` owns SQLite schema and queries. It stores:

- contacts
- conversations keyed by WhatsApp ID
- inbound and outbound messages
- message statuses
- media metadata
- raw webhook payloads for debugging

The database should be initialized automatically on startup.

### Webhook Server

`src/webhook-server.mjs` provides:

- `GET /webhook` for Meta verification using `hub.mode`, `hub.verify_token`, and `hub.challenge`
- `POST /webhook` for inbound event processing
- `GET /health` for local tunnel checks

When `WHATSAPP_APP_SECRET` is set, POST requests should validate `X-Hub-Signature-256`. The handler should persist the raw payload, extract messages/statuses/contacts, then respond quickly with `200 OK`.

### MCP Server

`src/mcp-server.mjs` exposes the first tool set:

- `whatsapp_health_check`: validate configuration, database, and selected Graph API connectivity
- `whatsapp_get_phone_number`: show phone number metadata
- `whatsapp_send_text`: send a text message to a WhatsApp number
- `whatsapp_send_template`: send an approved template message
- `whatsapp_list_conversations`: list local conversations from SQLite
- `whatsapp_list_messages`: list stored messages for one conversation
- `whatsapp_get_message`: inspect one stored message and its raw payload reference
- `whatsapp_mark_read`: mark an inbound message as read through Cloud API and update local status
- `whatsapp_download_media`: download media referenced by an inbound message

## Data Flow

### Sending a Text Message

1. MCP client calls `whatsapp_send_text`.
2. The MCP server validates input.
3. `whatsapp-api.mjs` sends a `POST /{PHONE_NUMBER_ID}/messages` request to the Graph API.
4. The outbound message is stored locally with the returned WhatsApp message ID.
5. Delivery/read/failure status updates arrive later through the webhook and update the local row.

### Receiving a Message

1. Meta calls the public tunnel URL.
2. The tunnel forwards the request to `http://127.0.0.1:{WHATSAPP_WEBHOOK_PORT}/webhook`.
3. The webhook server verifies the request.
4. Raw payload and parsed message records are written to SQLite.
5. MCP tools can list and inspect the new message from the local store.

## Setup Experience

Codex can create the MCP code, environment template, and setup guide. The user must still complete Meta-side setup:

1. Create or select a Meta Developer app.
2. Add WhatsApp product.
3. Create or connect a WhatsApp Business account.
4. Configure a test or production phone number.
5. Generate an access token with the required WhatsApp permissions.
6. Choose a verify token and put it in `.env`.
7. Start the local webhook server.
8. Start a tunnel and copy its HTTPS URL.
9. Configure Meta webhook callback URL as `{tunnel-url}/webhook`.
10. Subscribe the app to WhatsApp webhook fields for messages and status updates.

The README should include both Cloudflare Tunnel and ngrok options, with Cloudflare Tunnel as the preferred local default if available.

## Error Handling

- Configuration errors should fail startup with a clear missing-variable list.
- Graph API errors should be returned as structured MCP errors.
- Webhook signature failures should return `401` and avoid storing parsed events.
- Webhook parse failures should store the raw payload and return `200` only when the event was safely recorded or intentionally ignored.
- SQLite failures should surface clearly and avoid claiming messages were sent or persisted when they were not.

## Security

- `.env` and `data/*.sqlite` must be ignored by git.
- Access tokens must never be printed in full.
- Webhook verification token should be treated as a secret.
- App secret signature validation should be supported from the first version, even if optional for initial local testing.
- Downloaded media should stay under the MCP project data directory.

## Testing

Initial verification should cover:

- config validation with missing and present variables
- SQLite initialization
- webhook verification challenge handling
- webhook POST parsing for representative message and status payloads
- API client request shaping using mocked fetch
- MCP tool input validation

Manual end-to-end testing should confirm:

- `whatsapp_health_check` reports useful setup status
- a text message can be sent to an allowed test number
- a message sent to the WhatsApp number appears in `whatsapp_list_messages`
- message status updates modify the local stored message
- `whatsapp_mark_read` calls the expected Cloud API endpoint

## Open Implementation Choices

- Pick the MCP SDK/package after checking current Node MCP conventions in the implementation phase.
- Pick the SQLite package based on install compatibility on Windows.
- Pick the exact Graph API version during implementation and make it configurable.
- Decide whether to run MCP and webhook as one process with two modes or separate commands. The design prefers separate commands for clarity.

## References

- Meta WhatsApp Cloud API: https://developers.facebook.com/docs/whatsapp/cloud-api/
- Meta WhatsApp Cloud API Webhooks: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/
- Meta WhatsApp Messages API: https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages
