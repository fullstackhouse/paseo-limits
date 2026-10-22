# paseo-limits

A [Paseo](https://paseo.sh) plugin: when an agent hits a usage limit, loses its login, or can't reach the model API, the error in the chat becomes a card with **Retry** and **Log in** (sign in to another account) buttons.

See [OVERVIEW.md](./OVERVIEW.md) for behaviour and limits, [AGENTS.md](./AGENTS.md) for the code.

```bash
npm install && npm run typecheck && npm test
paseo plugin install "$PWD"
```
