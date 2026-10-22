Limits turns the dead-end messages an agent leaves when it cannot work into a card you can act on: a hit usage limit ("You've hit your weekly limit · resets 1pm"), an expired or invalid login, or a dropped connection to the model API.

## What the card does

- **Retry** sends `continue` to the agent, so the turn that failed picks up where it stopped.
- **Log in** opens a terminal named "Log in" in the agent's workspace and runs `claude auth login` (Claude) or `codex login` (Codex) there. Use it to sign in to another account when one hits its limit. After you log in, the button reads **Retry on new login**: it restarts the agent's process so it uses the new credentials, then continues. Restarting stops any background shells the agent had running.

The buttons show only on the latest error, while the agent is idle. Connection errors get Retry only.

## Limits

- Detection matches the error texts Claude Code and Codex print. A reply that only mentions a limit is left alone. A provider that words its errors differently is not recognised.
- Log in runs on the daemon machine. On a phone, finish the browser sign-in on that machine, or paste the code the CLI asks for.
- Nothing is stored or sent anywhere; the plugin only reads the chat it is shown in.
