import { Router, type IRouter } from "express";
import { eq, and, gt } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import { db, scriptsTable, sessionsTable } from "@workspace/db";

const router: IRouter = Router();

function requireAuth(req: any, res: any, next: any) {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  req.userId = userId;
  next();
}

// Live players = sessions with lastPingAt in the last 5 minutes
router.get("/scripts/:id/sessions", requireAuth, async (req, res): Promise<void> => {
  const scriptId = Number(req.params.id);
  if (isNaN(scriptId)) { res.status(400).json({ error: "Invalid script id" }); return; }

  const [script] = await db.select().from(scriptsTable).where(
    and(eq(scriptsTable.id, scriptId), eq(scriptsTable.userId, (req as any).userId))
  );
  if (!script) { res.status(404).json({ error: "Script not found" }); return; }

  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
  const sessions = await db.select().from(sessionsTable).where(
    and(eq(sessionsTable.scriptId, scriptId), gt(sessionsTable.lastPingAt, fiveMinAgo))
  );

  res.json(sessions.map(s => ({
    id: s.id,
    executorId: s.executorId,
    robloxUserId: s.robloxUserId ?? null,
    robloxUsername: s.robloxUsername ?? null,
    robloxClientId: s.robloxClientId ?? null,
    robloxThumbnailUrl: s.robloxThumbnailUrl ?? null,
    robloxPlaceId: s.robloxPlaceId ?? null,
    robloxJobId: s.robloxJobId ?? null,
    robloxExecutor: s.robloxExecutor ?? null,
    country: s.country ?? null,
    lastPingAt: s.lastPingAt.toISOString(),
  })));
});

// Send notification to a live player (delivered on their next ping)
router.post("/scripts/:id/sessions/:sessionId/notify", requireAuth, async (req, res): Promise<void> => {
  const scriptId = Number(req.params.id);
  const sessionId = Number(req.params.sessionId);
  const { message } = req.body as { message?: string };

  if (isNaN(scriptId) || isNaN(sessionId)) { res.status(400).json({ error: "Invalid id" }); return; }
  if (!message || typeof message !== "string" || message.trim().length === 0) {
    res.status(400).json({ error: "message is required" }); return;
  }
  if (message.length > 200) { res.status(400).json({ error: "message too long (max 200 chars)" }); return; }

  // Verify script ownership
  const [script] = await db.select().from(scriptsTable).where(
    and(eq(scriptsTable.id, scriptId), eq(scriptsTable.userId, (req as any).userId))
  );
  if (!script) { res.status(404).json({ error: "Script not found" }); return; }

  // Verify session belongs to this script
  const [session] = await db.select().from(sessionsTable).where(
    and(eq(sessionsTable.id, sessionId), eq(sessionsTable.scriptId, scriptId))
  );
  if (!session) { res.status(404).json({ error: "Session not found" }); return; }

  // Set pending notification — delivered on their next ping
  await db.update(sessionsTable)
    .set({ pendingNotification: message.trim() })
    .where(eq(sessionsTable.id, sessionId));

  res.json({ ok: true, message: "Notification queued — will be delivered on their next ping (≤30s)." });
});

// Broadcast notification to all currently active sessions for a script
router.post("/scripts/:id/notify-all", requireAuth, async (req, res): Promise<void> => {
  const scriptId = Number(req.params.id);
  const { message } = req.body as { message?: string };

  if (isNaN(scriptId)) { res.status(400).json({ error: "Invalid id" }); return; }
  if (!message || typeof message !== "string" || message.trim().length === 0) {
    res.status(400).json({ error: "message is required" }); return;
  }
  if (message.length > 200) { res.status(400).json({ error: "message too long (max 200 chars)" }); return; }

  const [script] = await db.select().from(scriptsTable).where(
    and(eq(scriptsTable.id, scriptId), eq(scriptsTable.userId, (req as any).userId))
  );
  if (!script) { res.status(404).json({ error: "Script not found" }); return; }

  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
  const activeSessions = await db.select({ id: sessionsTable.id })
    .from(sessionsTable)
    .where(and(eq(sessionsTable.scriptId, scriptId), gt(sessionsTable.lastPingAt, fiveMinAgo)));

  if (activeSessions.length === 0) {
    res.json({ ok: true, count: 0, message: "No active players to notify." });
    return;
  }

  await Promise.all(
    activeSessions.map(s =>
      db.update(sessionsTable).set({ pendingNotification: message.trim() }).where(eq(sessionsTable.id, s.id))
    )
  );

  res.json({ ok: true, count: activeSessions.length });
});

export default router;
