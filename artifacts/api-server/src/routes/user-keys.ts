import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, userKeysTable, scriptsTable } from "@workspace/db";
import { genKey } from "./keycheck";

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

// Manually create a key for a specific script (admin action)
router.post("/user-keys", async (req, res): Promise<void> => {
  const scriptId = typeof req.body.scriptId === "number" ? req.body.scriptId : parseInt(req.body.scriptId);
  const hwid = typeof req.body.hwid === "string" && req.body.hwid.trim() ? req.body.hwid.trim() : null;
  const validityMinutes = typeof req.body.validityMinutes === "number" ? req.body.validityMinutes : parseInt(req.body.validityMinutes) || 1440;

  if (!scriptId || isNaN(scriptId)) {
    res.status(400).json({ error: "scriptId is required" });
    return;
  }

  const [script] = await db
    .select({ id: scriptsTable.id, name: scriptsTable.name, scriptKey: scriptsTable.scriptKey, status: scriptsTable.status, obfuscatedCode: scriptsTable.obfuscatedCode })
    .from(scriptsTable)
    .where(eq(scriptsTable.id, scriptId));

  if (!script) {
    res.status(404).json({ error: "Script not found" });
    return;
  }

  if (!script.scriptKey || !script.obfuscatedCode) {
    res.status(400).json({ error: "Script has no key system. Generate a key for it first from the dashboard." });
    return;
  }

  const keyValue = genKey();
  const expiresAt = new Date(Date.now() + validityMinutes * 60_000);

  const [created] = await db
    .insert(userKeysTable)
    .values({ scriptId: script.id, scriptKey: script.scriptKey, keyValue, expiresAt, hwid })
    .returning();

  res.status(201).json({
    id: created.id,
    keyValue: created.keyValue,
    scriptKey: created.scriptKey,
    scriptId: created.scriptId,
    scriptName: script.name,
    hwid: created.hwid,
    hwidLocked: created.hwidLocked,
    expiresAt: created.expiresAt,
    lastUsedAt: created.lastUsedAt,
    createdAt: created.createdAt,
  });
});

// Delete a generated key
router.delete("/user-keys/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(userKeysTable).where(eq(userKeysTable.id, id));
  res.json({ ok: true });
});

export default router;
