import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import { db, integrationsTable } from "@workspace/db";

const router: IRouter = Router();

function requireAuth(req: import("express").Request, res: import("express").Response): string | null {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  return userId;
}

router.get("/integrations", async (req, res): Promise<void> => {
  if (!requireAuth(req, res)) return;
  const rows = await db.select().from(integrationsTable).orderBy(integrationsTable.createdAt);
  res.json(
    rows.map((r) => ({
      id: r.id.toString(),
      name: r.name,
      type: r.type,
      publisherId: r.publisherId,
      antiBypassToken: r.antiBypassToken,
      bypassProtection: r.bypassProtection,
      enabled: r.enabled,
      createdAt: r.createdAt.toISOString(),
    }))
  );
});

router.post("/integrations", async (req, res): Promise<void> => {
  if (!requireAuth(req, res)) return;
  const { name, type, publisherId = "", antiBypassToken = "", bypassProtection = false, enabled = true } = req.body as Record<string, unknown>;
  if (!name || typeof name !== "string") { res.status(400).json({ error: "name required" }); return; }
  if (!type || typeof type !== "string") { res.status(400).json({ error: "type required" }); return; }

  const [row] = await db
    .insert(integrationsTable)
    .values({
      name: name.trim(),
      type,
      publisherId: typeof publisherId === "string" ? publisherId.trim() : "",
      antiBypassToken: typeof antiBypassToken === "string" ? antiBypassToken.trim() : "",
      bypassProtection: Boolean(bypassProtection),
      enabled: Boolean(enabled),
    })
    .returning();

  res.status(201).json({
    id: row.id.toString(),
    name: row.name,
    type: row.type,
    publisherId: row.publisherId,
    antiBypassToken: row.antiBypassToken,
    bypassProtection: row.bypassProtection,
    enabled: row.enabled,
    createdAt: row.createdAt.toISOString(),
  });
});

router.patch("/integrations/:id", async (req, res): Promise<void> => {
  if (!requireAuth(req, res)) return;
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { name, type, publisherId, antiBypassToken, bypassProtection, enabled } = req.body as Record<string, unknown>;
  const patch: Partial<typeof integrationsTable.$inferInsert> = {};
  if (typeof name === "string") patch.name = name.trim();
  if (typeof type === "string") patch.type = type;
  if (typeof publisherId === "string") patch.publisherId = publisherId.trim();
  if (typeof antiBypassToken === "string") patch.antiBypassToken = antiBypassToken.trim();
  if (typeof bypassProtection === "boolean") patch.bypassProtection = bypassProtection;
  if (typeof enabled === "boolean") patch.enabled = enabled;

  const [row] = await db.update(integrationsTable).set(patch).where(eq(integrationsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }

  res.json({
    id: row.id.toString(),
    name: row.name,
    type: row.type,
    publisherId: row.publisherId,
    antiBypassToken: row.antiBypassToken,
    bypassProtection: row.bypassProtection,
    enabled: row.enabled,
    createdAt: row.createdAt.toISOString(),
  });
});

router.delete("/integrations/:id", async (req, res): Promise<void> => {
  if (!requireAuth(req, res)) return;
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  await db.delete(integrationsTable).where(eq(integrationsTable.id, id));
  res.status(204).end();
});

export default router;
