import { checkBotId } from "botid/server";

/**
 * The brief from the home's contact form, sent to my inbox with Resend.
 * Every check runs here on the server, cheapest first, so the form's own
 * checks in the browser are only a courtesy:
 *   1. only from this site's pages, as JSON, and small
 *   2. the hidden field bots fill in, and a minimum time on the form
 *   3. a few sends per IP every 10 minutes
 *   4. Vercel BotID
 *   5. lengths and a real-looking email
 * What the visitor wrote goes out as plain text, never HTML, and their
 * email only as Reply-To: the sender is always mine.
 */

const TO = process.env.CONTACT_TO || "josepelaez0218@gmail.com";
// Once josepelaez.es is verified in Resend: "Jose Peláez <hello@josepelaez.es>"
const FROM = process.env.CONTACT_FROM || "Portfolio <onboarding@resend.dev>";

const SITE = ["https://www.josepelaez.es", "https://josepelaez.es"];
const MAX_BODY = 10_000;
const MIN_MS = 3_000; // nobody reads three questions and answers them faster
const LIMIT = { name: 100, email: 200, message: 5_000 };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const json = (body: object, status = 200) => Response.json(body, { status, headers: { "cache-control": "no-store" } });

// This site's own pages: production, this deployment's previews, and local dev
const fromSite = (origin: string | null) => {
  if (!origin) return false;
  const own = [...SITE, process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL].filter(Boolean).map((u) => (u!.startsWith("http") ? u : `https://${u}`));
  if (own.includes(origin)) return true;
  return !process.env.VERCEL && /^http:\/\/localhost:\d+$/.test(origin);
};

// Sends per IP in the last 10 minutes. Kept in this instance's memory, so it
// slows down a burst but isn't shared between instances.
const WINDOW = 10 * 60_000, MAX_SENDS = 5;
const sends = new Map<string, number[]>();
const tooMany = (ip: string) => {
  const now = Date.now();
  const recent = (sends.get(ip) || []).filter((t) => now - t < WINDOW);
  recent.push(now);
  if (sends.size > 5_000) sends.clear();
  sends.set(ip, recent);
  return recent.length > MAX_SENDS;
};

// One line, no control characters, so nothing can be slipped into the subject or headers
const oneLine = (v: unknown) => String(v ?? "").replace(/[\u0000-\u001f\u007f]+/g, " ").trim();
// The message keeps its line breaks and loses every other control character
const plain = (v: unknown) => String(v ?? "").replace(/\r\n?/g, "\n").replace(/[\u0000-\u0009\u000b-\u001f\u007f]+/g, " ").trim();

export async function POST(req: Request) {
  if (!fromSite(req.headers.get("origin"))) return json({ error: "forbidden" }, 403);
  if (!req.headers.get("content-type")?.includes("application/json")) return json({ error: "bad request" }, 415);
  const raw = await req.text();
  if (raw.length > MAX_BODY) return json({ error: "too large" }, 413);
  let b: Record<string, unknown>;
  try {
    b = JSON.parse(raw);
  } catch {
    return json({ error: "bad request" }, 400);
  }

  // Bots: told it went fine, so they don't learn what gave them away
  if (b.website) return json({ ok: true });
  if (typeof b.elapsed !== "number" || b.elapsed < MIN_MS) return json({ ok: true });

  const ip = req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  if (tooMany(ip)) return json({ error: "too many" }, 429);

  // A browser on the site carries BotID's token; a script calling the API directly doesn't
  if (process.env.VERCEL && !req.headers.get("x-is-human")) return json({ error: "forbidden" }, 403);
  try {
    const { isBot } = await checkBotId();
    if (isBot) return json({ error: "forbidden" }, 403);
  } catch (e) {
    // BotID not reachable: the other checks still stand, and a real brief isn't lost
    console.error("BotID check failed", e);
  }

  const name = oneLine(b.name), email = oneLine(b.email), message = plain(b.message);
  if (!name || !message || !EMAIL_RE.test(email) || name.length > LIMIT.name || email.length > LIMIT.email || message.length > LIMIT.message) {
    return json({ error: "invalid" }, 400);
  }

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.error("RESEND_API_KEY is not set");
    return json({ error: "unavailable" }, 503);
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({
      from: FROM,
      to: [TO],
      reply_to: email,
      subject: `New project — ${name}`,
      text: `${message}\n\n— ${name} · ${email}\n\nSent from the contact form on josepelaez.es`,
    }),
  });
  if (!res.ok) {
    console.error("Resend refused the email", res.status, await res.text().catch(() => ""));
    return json({ error: "unavailable" }, 502);
  }
  return json({ ok: true });
}
