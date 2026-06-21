import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, userKeysTable, scriptsTable } from "@workspace/db";

const router: IRouter = Router();

// List all generated user keys (with script name)
router.get("/user-keys", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      id: userKeysTable.id,
      keyValue: userKeysTable.keyValue,
      scriptKey: userKeysTable.scriptKey,
      scriptId: userKeysTable.scriptId,
      scriptName: scriptsTable.name,
      hwid: userKeysTable.hwid,
      hwidLocked: userKeysTable.hwidLocked,
      expiresAt: userKeysTable.expiresAt,
      lastUsedAt: userKeysTable.lastUsedAt,
      createdAt: userKeysTable.createdAt,
    })
    .from(userKeysTable)
    .leftJoin(scriptsTable, eq(userKeysTable.scriptId, scriptsTable.id))
    .orderBy(desc(userKeysTable.createdAt))
    .limit(500);

  res.json(rows);
});

// Delete a generated key
router.delete("/user-keys/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(userKeysTable).where(eq(userKeysTable.id, id));
  res.json({ ok: true });
});

export default router;
