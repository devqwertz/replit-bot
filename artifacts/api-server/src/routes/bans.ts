import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import { db, scriptBansTable, scriptsTable } from "@workspace/db";

const router: IRouter = Router();

function requireAuth(req: any, res: any, next: any) {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  req.userId = userId;
  next();
}

router.get("/bans", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;

  const bans = await db
    .select({
      id: scriptBansTable.id,
      scriptId: scriptBansTable.scriptId,
      scriptName: scriptsTable.name,
      executorId: scriptBansTable.executorId,
      reason: scriptBansTable.reason,
      createdAt: scriptBansTable.createdAt,
    })
    .from(scriptBansTable)
    .innerJoin(
      scriptsTable,
      and(eq(scriptBansTable.scriptId, scriptsTable.id), eq(scriptsTable.userId, userId))
    )
    .orderBy(desc(scriptBansTable.createdAt));

  res.json(
    bans.map((b) => ({
      id: b.id,
      scriptId: b.scriptId,
      scriptName: b.scriptName ?? "Unknown",
      executorId: b.executorId,
      banType: b.executorId.startsWith("cid:") ? "clientid" : "ip",
      reason: b.reason ?? null,
      createdAt: b.createdAt.toISOString(),
    }))
  );
});

router.post("/bans", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;
  const { scriptId, banType, value, reason } = req.body as {
    scriptId?: number;
    banType?: string;
    value?: string;
    reason?: string;
  };

  if (!scriptId || !banType || !value) {
    res.status(400).json({ error: "scriptId, banType, and value are required" });
    return;
  }

  const [script] = await db.select().from(scriptsTable).where(
    and(eq(scriptsTable.id, scriptId), eq(scriptsTable.userId, userId))
  );
  if (!script) { res.status(404).json({ error: "Script not found" }); return; }

  const executorId = banType === "clientid" ? `cid:${value}` : value;

  const [ban] = await db.insert(scriptBansTable).values({
    scriptId,
    executorId,
    reason: reason ?? null,
  }).onConflictDoNothing().returning();

  if (!ban) {
    res.status(409).json({ error: "Already banned" });
    return;
  }

  res.status(201).json({
    id: ban.id,
    scriptId: ban.scriptId,
    executorId: ban.executorId,
    banType: banType === "clientid" ? "clientid" : "ip",
    reason: ban.reason ?? null,
    createdAt: ban.createdAt.toISOString(),
  });
});

router.get("/scripts/:id/bans", requireAuth, async (req, res): Promise<void> => {
  const scriptId = Number(req.params.id);
  if (isNaN(scriptId)) { res.status(400).json({ error: "Invalid script id" }); return; }

  const [script] = await db.select().from(scriptsTable).where(
    and(eq(scriptsTable.id, scriptId), eq(scriptsTable.userId, (req as any).userId))
  );
  if (!script) { res.status(404).json({ error: "Script not found" }); return; }

  const bans = await db.select().from(scriptBansTable).where(eq(scriptBansTable.scriptId, scriptId));
  res.json(bans.map(b => ({
    id: b.id,
    scriptId: b.scriptId,
    executorId: b.executorId,
    reason: b.reason ?? null,
    createdAt: b.createdAt.toISOString(),
  })));
});

router.post("/scripts/:id/bans", requireAuth, async (req, res): Promise<void> => {
  const scriptId = Number(req.params.id);
  if (isNaN(scriptId)) { res.status(400).json({ error: "Invalid script id" }); return; }

  const { executorId, reason } = req.body as { executorId?: string; reason?: string };
  if (!executorId) { res.status(400).json({ error: "executorId is required" }); return; }

  const [script] = await db.select().from(scriptsTable).where(
    and(eq(scriptsTable.id, scriptId), eq(scriptsTable.userId, (req as any).userId))
  );
  if (!script) { res.status(404).json({ error: "Script not found" }); return; }

  const [ban] = await db.insert(scriptBansTable).values({
    scriptId,
    executorId,
    reason: reason ?? null,
  }).onConflictDoNothing().returning();

  if (!ban) {
    res.status(409).json({ error: "Already banned" });
    return;
  }

  res.status(201).json({
    id: ban.id,
    scriptId: ban.scriptId,
    executorId: ban.executorId,
    reason: ban.reason ?? null,
    createdAt: ban.createdAt.toISOString(),
  });
});

router.delete("/scripts/:id/bans/:executorId", requireAuth, async (req, res): Promise<void> => {
  const scriptId = Number(req.params.id);
  const executorId = decodeURIComponent(req.params.executorId);
  if (isNaN(scriptId)) { res.status(400).json({ error: "Invalid script id" }); return; }

  const [script] = await db.select().from(scriptsTable).where(
    and(eq(scriptsTable.id, scriptId), eq(scriptsTable.userId, (req as any).userId))
  );
  if (!script) { res.status(404).json({ error: "Script not found" }); return; }

  await db.delete(scriptBansTable).where(
    and(eq(scriptBansTable.scriptId, scriptId), eq(scriptBansTable.executorId, executorId))
  );

  res.sendStatus(204);
});

export default router;
