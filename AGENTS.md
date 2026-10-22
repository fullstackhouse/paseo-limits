# paseo-limits

Paseo plugin: a usage-limit, login or connection error in an agent's chat becomes a card with **Retry** and **Log in**.

## Layout

- `shared/notice.ts`: `noticeFor(text)` classifies a reply/error as `limit`, `auth` or `transient` (anchored patterns, ≤400 chars, so an agent *talking* about limits keeps its reply); `loginCommand(provider)`; the `limits.reload-agent` RPC.
- `index.client.tsx`: transformers on `assistant_message` (complete only; Claude Code reports limits as a reply) and `error` rows; renderer.
- `client/NoticeCard.tsx`: React Native only. Retry sends `continue`. Log in opens a "Log in" terminal in the workspace and types the provider's login command. After Log in, Retry first reloads the agent. Buttons hide while the agent runs or once it was active >30 s after the error.
- `server/reload.ts`: `paseo agent reload <id>` via the CLI (the plugin SDK has no reload).

## Load-bearing facts (Paseo 0.12)

- A Claude agent is one long-lived `claude` process; it keeps the credentials it started with, so a new login needs a reload (restarts the process, resumes the session, kills its background shells).
- Real texts seen: `You've hit your weekly limit · resets 1pm (Europe/Warsaw)`, `You've hit your session limit · resets …`, `API Error: Can't reach the API server — … (ENOTFOUND)`. Add a pattern + test case when a new one shows up.
- The plugin subprocess has the user's PATH and `PASEO_HOME`.

## Commands

- `npm run typecheck`, `npm test`.
- After edits: `paseo plugin reload paseo-limits`, then `paseo plugin ls` must say `running`. Never restart the daemon.
- Demo without hitting a limit: an agent whose whole reply is a limit text gets the card.
