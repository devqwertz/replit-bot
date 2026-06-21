import { Router, type IRouter } from "express";
import { eq, and, or, sql } from "drizzle-orm";
import { db, scriptsTable, executionLogsTable, scriptBansTable, sessionsTable } from "@workspace/db";

const router: IRouter = Router();

const BAN_MESSAGE = "You have been permanently banned from this script. Contact the owner to get unbanned.";
const KICK_PREFIX = "__kick__:";

async function fetchRobloxUsername(userId: string): Promise<string | null> {
  try {
    const res = await fetch(`https://users.roblox.com/v1/users/${userId}`, {
      headers: { "Accept": "application/json" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = await res.json() as { name?: string };
    return data.name ?? null;
  } catch { return null; }
}

async function fetchRobloxThumbnail(userId: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=420x420&format=Png`,
      { headers: { "Accept": "application/json" }, signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return null;
    const data = await res.json() as { data?: { imageUrl?: string }[] };
    return data.data?.[0]?.imageUrl ?? null;
  } catch { return null; }
}

async function lookupCountry(ip: string): Promise<{ country: string; countryCode: string } | null> {
  if (!ip || ip === "unknown" || ip.startsWith("127.") || ip.startsWith("10.") || ip.startsWith("192.168.") || ip === "::1") return null;
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=country,countryCode`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return null;
    const data = await res.json() as { country?: string; countryCode?: string };
    if (!data.country || !data.countryCode) return null;
    return { country: data.country, countryCode: data.countryCode };
  } catch { return null; }
}

async function fireWebhook(webhookUrl: string, payload: {
  scriptName: string; status: string; executorId: string;
  robloxUsername: string | null; robloxUserId: string | null;
  robloxClientId: string | null; robloxExecutor: string | null;
  country: string | null; duration: number | null;
}): Promise<void> {
  try {
    const isDiscord = webhookUrl.includes("discord.com/api/webhooks") || webhookUrl.includes("discordapp.com/api/webhooks");
    let body: string;

    if (isDiscord) {
      const color = payload.status === "success" ? 0x22c55e : 0xef4444;
      const fields = [
        { name: "Script", value: payload.scriptName, inline: true },
        { name: "Status", value: payload.status === "success" ? "✅ Success" : "❌ Failed", inline: true },
        { name: "IP", value: payload.executorId || "—", inline: true },
      ];
      if (payload.robloxUsername) fields.push({ name: "Roblox User", value: payload.robloxUsername, inline: true });
      if (payload.robloxUserId) fields.push({ name: "Roblox ID", value: payload.robloxUserId, inline: true });
      if (payload.robloxClientId) fields.push({ name: "Client ID", value: payload.robloxClientId, inline: true });
      if (payload.robloxExecutor) fields.push({ name: "Executor", value: payload.robloxExecutor, inline: true });
      if (payload.country) fields.push({ name: "Country", value: payload.country, inline: true });

      body = JSON.stringify({
        embeds: [{
          title: "Script Execution",
          color,
          fields,
          timestamp: new Date().toISOString(),
          footer: { text: "Xeioa" },
        }],
      });
    } else {
      body = JSON.stringify({ event: "execution", ...payload, timestamp: new Date().toISOString() });
    }

    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      signal: AbortSignal.timeout(8000),
    });
  } catch { /* non-fatal */ }
}

router.get("/ping/:key", async (req, res): Promise<void> => {
  const key = req.params.key as string;
  if (!key) { res.status(400).json({ ok: false }); return; }

  const rbxUserId = typeof req.query.rbxuid === "string" ? req.query.rbxuid : null;
  const rbxClientId = typeof req.query.rbxclientid === "string" ? req.query.rbxclientid : null;
  const rbxExecutor = typeof req.query.rbxexecutor === "string" ? req.query.rbxexecutor : null;
  const rbxPlaceId = typeof req.query.rbxplaceid === "string" ? req.query.rbxplaceid : null;
  const rbxJobId = typeof req.query.rbxjobid === "string" ? req.query.rbxjobid : null;

  const forwarded = req.headers["x-forwarded-for"];
  const rawIp = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(",")[0]?.trim() || req.ip || "unknown";

  const [script] = await db.select().from(scriptsTable).where(eq(scriptsTable.scriptKey, key));
  if (!script) { res.status(404).json({ ok: false }); return; }

  const banConditions: ReturnType<typeof eq>[] = [eq(scriptBansTable.executorId, rawIp)];
  if (rbxClientId) banConditions.push(eq(scriptBansTable.executorId, `cid:${rbxClientId}`));
  const [ban] = await db.select().from(scriptBansTable).where(and(eq(scriptBansTable.scriptId, script.id), or(...banConditions)));
  if (ban) {
    res.status(200).json({ ok: false, kick: BAN_MESSAGE });
    return;
  }

  // Atomically read and clear pending notification/kick before responding
  // to prevent double-delivery on rapid pings.
  const [sessionRow] = await db
    .select({ pendingNotification: sessionsTable.pendingNotification })
    .from(sessionsTable)
    .where(and(eq(sessionsTable.scriptId, script.id), eq(sessionsTable.executorId, rawIp)));

  const pending = sessionRow?.pendingNotification ?? null;

  if (pending) {
    await db.update(sessionsTable)
      .set({ pendingNotification: null })
      .where(and(eq(sessionsTable.scriptId, script.id), eq(sessionsTable.executorId, rawIp)));
  }

  // A pending kick signal (set by the kick endpoint) — return kick and bail early
  if (pending?.startsWith(KICK_PREFIX)) {
    const kickMessage = pending.slice(KICK_PREFIX.length) || "You have been kicked by the server administrator.";
    res.status(200).json({ ok: false, kick: kickMessage });
    return;
  }

  res.status(200).json({ ok: true, n: pending ?? "" });

  void (async () => {
    try {
      const [robloxUsername, robloxThumbnailUrl, geoResult] = await Promise.all([
        rbxUserId ? fetchRobloxUsername(rbxUserId) : Promise.resolve(null),
        rbxUserId ? fetchRobloxThumbnail(rbxUserId) : Promise.resolve(null),
        lookupCountry(rawIp),
      ]);

      await db.insert(sessionsTable).values({
        scriptId: script.id,
        executorId: rawIp,
        robloxUserId: rbxUserId,
        robloxUsername,
        robloxClientId: rbxClientId,
        robloxThumbnailUrl,
        robloxPlaceId: rbxPlaceId,
        robloxJobId: rbxJobId,
        robloxExecutor: rbxExecutor,
        country: geoResult?.country ?? null,
        countryCode: geoResult?.countryCode ?? null,
        lastPingAt: new Date(),
        pendingNotification: null,
      }).onConflictDoUpdate({
        target: [sessionsTable.scriptId, sessionsTable.executorId],
        set: {
          robloxUserId: rbxUserId,
          robloxUsername,
          robloxClientId: rbxClientId,
          robloxThumbnailUrl,
          robloxPlaceId: rbxPlaceId,
          robloxJobId: rbxJobId,
          robloxExecutor: rbxExecutor,
          country: geoResult?.country ?? null,
          countryCode: geoResult?.countryCode ?? null,
          lastPingAt: new Date(),
        },
      });

      await db.insert(executionLogsTable).values({
        scriptId: script.id,
        status: "success",
        executorId: rawIp,
        robloxUsername,
        robloxUserId: rbxUserId,
        robloxClientId: rbxClientId,
        robloxThumbnailUrl,
        robloxExecutor: rbxExecutor,
        duration: null,
        country: geoResult?.country ?? null,
        countryCode: geoResult?.countryCode ?? null,
      });

      await db.update(scriptsTable).set({
        executions: sql`${scriptsTable.executions} + 1`,
        successCount: sql`${scriptsTable.successCount} + 1`,
      }).where(eq(scriptsTable.id, script.id));

      if (script.webhookUrl && script.webhookLogsEnabled) {
        await fireWebhook(script.webhookUrl, {
          scriptName: script.name,
          status: "success",
          executorId: rawIp,
          robloxUsername,
          robloxUserId: rbxUserId,
          robloxClientId: rbxClientId,
          robloxExecutor: rbxExecutor,
          country: geoResult?.country ?? null,
          duration: null,
        });
      }
    } catch { /* non-fatal */ }
  })();
});

export default router;
