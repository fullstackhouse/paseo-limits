import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { promisify } from "node:util";

const run = promisify(execFile);

// The plugin subprocess may not have the user's PATH; the macOS app ships the CLI here.
const BUNDLED = "/Applications/Paseo.app/Contents/Resources/bin/paseo";

/**
 * Restarts an agent's provider process through the CLI, which a new login needs:
 * a running Claude or Codex process keeps the credentials it started with.
 * The SDK handed to plugins has no reload, so this is the one place the plugin shells out.
 */
export async function reloadAgent(agentId: string): Promise<void> {
  const home = process.env.PASEO_HOME ? ["--home", process.env.PASEO_HOME] : [];
  const args = ["agent", "reload", agentId, ...home];
  try {
    await run("paseo", args, { timeout: 30_000 });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT" || !existsSync(BUNDLED)) throw error;
    await run(BUNDLED, args, { timeout: 30_000 });
  }
}
