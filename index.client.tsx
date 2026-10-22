import type { PluginClientContext, PluginTimelineItemProps } from "@getpaseo/plugin/client";
import { NoticeCard } from "./client/NoticeCard";
import { NOTICE, NoticeSchema, noticeFor, type Notice } from "./shared/notice";

function TimelineNotice({ theme, layout, agentId, item, timestamp }: PluginTimelineItemProps<Notice>) {
  return <NoticeCard theme={theme} compact={layout.compact} agentId={agentId} timestamp={timestamp} {...item.data} />;
}

export default function contribute(client: PluginClientContext) {
  // Claude Code reports a hit limit as an assistant reply; a streaming reply is left alone until it completes.
  client.addTimelineTransformer({
    id: "limit-replies",
    query: { itemType: "assistant_message" },
    transform: ({ item, phase }) => {
      const data = phase === "complete" ? noticeFor(item.text) : undefined;
      return data && { items: [{ type: "plugin", ...NOTICE, data }] };
    },
  });
  // Failed turns land as error rows.
  client.addTimelineTransformer({
    id: "limit-errors",
    query: { itemType: "error" },
    transform: ({ item }) => {
      const data = noticeFor(item.message);
      return data && { items: [{ type: "plugin", ...NOTICE, data }] };
    },
  });
  client.addTimelineRenderer({ ...NOTICE, schema: NoticeSchema, Component: TimelineNotice });
  return () => {};
}
