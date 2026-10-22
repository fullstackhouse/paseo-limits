import { describe, expect, it } from "vitest";
import { loginCommand, noticeFor } from "../shared/notice";

describe("noticeFor", () => {
  it.each([
    ["You've hit your weekly limit · resets 1pm (Europe/Warsaw)", "limit"],
    ["You've hit your session limit · resets 5:10pm (Europe/Warsaw)", "limit"],
    ["Claude AI usage limit reached|1761170400", "limit"],
    ["You've hit your usage limit. Upgrade to Pro (https://chatgpt.com/explore/pro) or try again at 3:05 PM.", "limit"],
    ["Credit balance is too low", "limit"],
    ["Invalid API key · Please run /login", "auth"],
    ["OAuth token has expired. Please obtain a new token or refresh your existing token.", "auth"],
    ['API Error: 401 {"type":"error","error":{"type":"authentication_error","message":"Invalid bearer token"}}', "auth"],
    ["Your access token could not be refreshed because your refresh token was already used. Please log out and sign in again.", "auth"],
    ["API Error: Can't reach the API server — check your internet or DNS (ENOTFOUND)", "transient"],
    ["API Error: Connection refused — a firewall or proxy may be blocking it (ECONNREFUSED)", "transient"],
    ['API Error: 529 {"type":"error","error":{"type":"overloaded_error","message":"Overloaded"}}', "transient"],
  ])("%s → %s", (text, kind) => {
    expect(noticeFor(text)?.kind).toBe(kind);
  });

  it.each([
    "",
    "Done — the weekly report is in docs/report.md.",
    "If you hit your weekly limit, the plugin shows a Retry button.",
    `You've hit your weekly limit · resets 1pm. ${"Long explanation. ".repeat(40)}`,
    "Please log in again to the staging admin to check the order.",
  ])("leaves %j alone", (text) => {
    expect(noticeFor(text)).toBeUndefined();
  });
});

describe("loginCommand", () => {
  it("knows Claude and Codex, with or without a model", () => {
    expect(loginCommand("claude")).toBe("claude auth login");
    expect(loginCommand("claude/opus")).toBe("claude auth login");
    expect(loginCommand("codex")).toBe("codex login");
    expect(loginCommand("opencode")).toBeUndefined();
  });
});
