import { defineRpc } from "@getpaseo/plugin";
import { z } from "zod";

/** The plugin timeline item that stands in for a limit, login or connection error. */
export const NOTICE = { kind: "limit-notice", version: 1 } as const;

export const NoticeKindSchema = z.enum(["limit", "auth", "transient"]);
export type NoticeKind = z.infer<typeof NoticeKindSchema>;

export const NoticeSchema = z.object({ kind: NoticeKindSchema, text: z.string() });
export type Notice = z.infer<typeof NoticeSchema>;

// Texts as Claude Code and Codex put them in the chat, e.g.
// "You've hit your weekly limit · resets 1pm (Europe/Warsaw)",
// "API Error: Can't reach the API server — check your internet or DNS (ENOTFOUND)".
const PATTERNS: Record<NoticeKind, RegExp[]> = {
  limit: [
    /^You've hit your .*limit/i,
    /^(Claude AI )?usage limit reached/i,
    /^(5-hour|session|weekly|daily|monthly) limit reached/i,
    /^Credit balance is too low/i,
  ],
  auth: [
    /^Invalid API key/i,
    /^OAuth token (has expired|revoked)/i,
    /^Not logged in/i,
    /^API Error: 401\b/i,
    /^API Error: 403\b.*(OAuth|token|authenticat)/i,
    /^API Error:.*authentication_error/i,
    /token.*(log|sign) (out and sign )?in again/i,
  ],
  transient: [
    /^API Error: (5\d\d|429|529)\b/i,
    /^API Error: (Can't reach|Connection|Request timed out)/i,
    /overloaded_error/i,
  ],
};

// Longer than this is an agent reply that mentions a limit, not the error itself.
const MAX_LENGTH = 400;

/**
 * The notice an assistant reply or error row is, or undefined to leave it alone.
 * Assistant replies must be the error text on their own, so an agent talking about limits keeps its reply.
 */
export function noticeFor(text: string): Notice | undefined {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length > MAX_LENGTH) return undefined;
  for (const kind of NoticeKindSchema.options) {
    if (PATTERNS[kind].some((pattern) => pattern.test(trimmed))) return { kind, text: trimmed };
  }
  return undefined;
}

/** The command that signs a provider's CLI in on the daemon machine, or undefined when there is none. */
export function loginCommand(provider: string): string | undefined {
  const name = provider.split("/")[0];
  if (name === "claude") return "claude auth login";
  if (name === "codex") return "codex login";
  return undefined;
}

/** What Retry sends: the turn failed before the model saw the prompt, which is still in the session. */
export const RETRY_PROMPT = "continue";

/** Restarts the agent's provider process, so it reads the credentials a fresh login wrote. */
export const reloadAgent = defineRpc({
  name: "limits.reload-agent",
  input: z.object({ agentId: z.string() }),
  output: z.object({}),
});
