import type { PluginServerContext } from "@getpaseo/plugin/server";
import { reloadAgent } from "./server/reload";
import { reloadAgent as reloadAgentRpc } from "./shared/notice";

export default function contribute(server: PluginServerContext) {
  server.handle(reloadAgentRpc, async ({ agentId }) => {
    await reloadAgent(agentId);
    return {};
  });
  return () => {};
}
