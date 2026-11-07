export type Bot = "announcement" | "help" | "review" | "shipped";
export const BOTS: Bot[] = ["announcement", "help", "review", "shipped"];

export const BOT_LABEL: Record<Bot, string> = {
  announcement: "Announcements",
  help: "Help",
  review: "Review",
  shipped: "Shipped",
};

const TOKEN: Record<Bot, string | undefined> = {
  announcement: process.env.SLACK_BOT_TOKEN_ANNOUNCEMENT,
  help: process.env.SLACK_BOT_TOKEN_HELP,
  review: process.env.SLACK_BOT_TOKEN_REVIEW,
  shipped: process.env.SLACK_BOT_TOKEN_SHIPPED,
};

const CHANNEL: Record<Bot, string | undefined> = {
  announcement: process.env.SLACK_CHANNEL_ID_ANNOUNCEMENT,
  help: process.env.SLACK_CHANNEL_ID_HELP,
  review: process.env.SLACK_CHANNEL_ID_REVIEW,
  shipped: process.env.SLACK_CHANNEL_ID_SHIPPED,
};

export function botStatus() {
  return BOTS.map((bot) => ({ bot, token: !!TOKEN[bot], channel: !!CHANNEL[bot] }));
}

export const escapeSlack = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export type SlackResp = { ok: boolean; error?: string; [k: string]: unknown };

async function call(bot: Bot, method: string, body: Record<string, unknown>): Promise<SlackResp> {
  const token = TOKEN[bot];
  if (!token) return { ok: false, error: "missing_token" };
  try {
    const res = await fetch(`https://slack.com/api/${method}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    return (await res.json()) as SlackResp;
  } catch {
    return { ok: false, error: "network_error" };
  }
}

export async function postToChannel(bot: Bot, text: string, ping = false) {
  const channel = CHANNEL[bot];
  if (!channel) return { ok: false, error: "missing_channel" } as SlackResp;
  return call(bot, "chat.postMessage", {
    channel,
    text: (ping ? "<!channel> " : "") + escapeSlack(text),
    unfurl_links: false,
    unfurl_media: false,
  });
}

export async function dm(bot: Bot, slackId: string, text: string) {
  return call(bot, "chat.postMessage", {
    channel: slackId,
    text: escapeSlack(text),
    unfurl_links: false,
  });
}

export async function testBot(bot: Bot) {
  return call(bot, "auth.test", {});
}

export async function lookupSlackIdByEmail(email: string) {
  const token = TOKEN.review ?? TOKEN.help ?? TOKEN.announcement;
  if (!token) return null;
  try {
    const res = await fetch("https://slack.com/api/users.lookupByEmail", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ email }),
      cache: "no-store",
    });
    const j = (await res.json()) as { ok: boolean; user?: { id: string; real_name?: string } };
    return j.ok && j.user ? { id: j.user.id, name: j.user.real_name } : null;
  } catch {
    return null;
  }
}