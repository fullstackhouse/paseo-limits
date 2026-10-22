import type { PluginTheme } from "@getpaseo/plugin";
import { useAgent, usePaseo, useRpc } from "@getpaseo/plugin/client";
import { Icon, useToast } from "@getpaseo/plugin/client/react-native";
import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { loginCommand, reloadAgent, RETRY_PROMPT, type Notice, type NoticeKind } from "../shared/notice";

const ICONS: Record<NoticeKind, string> = { limit: "Hourglass", auth: "KeyRound", transient: "WifiOff" };

// Activity this long after the error means the agent moved on: the card stays, its buttons go.
const MOVED_ON_MS = 30_000;

type Busy = "retry" | "login" | null;

export function NoticeCard(props: { theme: PluginTheme; compact: boolean; agentId: string; timestamp: Date } & Notice) {
  const { theme, compact, agentId, timestamp, kind, text } = props;
  const styles = useMemo(() => makeStyles(theme, compact), [theme, compact]);
  const paseo = usePaseo();
  const reload = useRpc(reloadAgent);
  const toast = useToast();
  const agent = useAgent(agentId, (snapshot) => ({
    provider: snapshot.provider,
    workspaceId: snapshot.workspaceId,
    running: snapshot.status === "running" || snapshot.status === "initializing",
    lastActivityAt: snapshot.lastActivityAt,
  }));
  const [busy, setBusy] = useState<Busy>(null);
  // Set once Log in opened a terminal: the next Retry restarts the agent so it picks up the new account.
  const [loggedIn, setLoggedIn] = useState(false);

  const login = agent ? loginCommand(agent.provider) : undefined;
  const movedOn = agent ? Date.parse(agent.lastActivityAt) - timestamp.getTime() > MOVED_ON_MS : false;
  const actionable = agent && !agent.running && !movedOn;

  const act = (which: Exclude<Busy, null>, action: () => Promise<void>) => async () => {
    setBusy(which);
    try {
      await action();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(null);
    }
  };

  const retry = act("retry", async () => {
    if (loggedIn) await reload({ agentId });
    await paseo.agents.ref(agentId).send(RETRY_PROMPT);
  });

  const openLogin = act("login", async () => {
    if (!agent || !login) return;
    const terminal = await paseo.terminals.create({ workspaceId: agent.workspaceId, name: "Log in" });
    // Typed into the user's shell rather than spawned, so the CLI resolves from their PATH.
    terminal.write(`${login}\r`);
    setLoggedIn(true);
    toast.show(`A "Log in" terminal in this workspace runs ${login}. Finish there, then press Retry.`, { variant: "info" });
  });

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Icon name={ICONS[kind]} size={16} color={kind === "limit" ? theme.colors.statusWarning : theme.colors.statusDanger} />
        <Text style={styles.text}>{text}</Text>
      </View>
      {actionable ? (
        <View style={styles.actions}>
          <Button
            styles={styles}
            primary
            label={busy === "retry" ? "Retrying…" : loggedIn ? "Retry on new login" : "Retry"}
            disabled={busy !== null}
            onPress={retry}
          />
          {login && kind !== "transient" ? (
            <Button
              styles={styles}
              label={busy === "login" ? "Opening…" : loggedIn ? "Log in again" : "Log in"}
              disabled={busy !== null}
              onPress={openLogin}
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function Button(props: { styles: Styles; label: string; primary?: boolean; disabled: boolean; onPress: () => void }) {
  const { styles, label, primary, disabled, onPress } = props;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.button, primary && styles.primary, disabled && styles.disabled]}
    >
      <Text style={primary ? styles.primaryLabel : styles.label}>{label}</Text>
    </Pressable>
  );
}

type Styles = ReturnType<typeof makeStyles>;

function makeStyles(theme: PluginTheme, compact: boolean) {
  return {
    card: {
      gap: 10,
      padding: compact ? 12 : 14,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface1,
    },
    header: { flexDirection: "row" as const, gap: 8, alignItems: "flex-start" as const },
    text: { flex: 1, color: theme.colors.foreground, fontSize: 14, lineHeight: 20 },
    actions: { flexDirection: "row" as const, flexWrap: "wrap" as const, gap: 8 },
    button: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface2,
    },
    primary: { borderColor: theme.colors.accent, backgroundColor: theme.colors.accent },
    disabled: { opacity: 0.5 },
    label: { color: theme.colors.foreground, fontSize: 13 },
    primaryLabel: { color: theme.colors.accentForeground, fontSize: 13 },
  };
}
