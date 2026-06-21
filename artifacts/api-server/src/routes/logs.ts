import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, executionLogsTable, scriptsTable } from "@workspace/db";
import {
  GetScriptLogsParams,
  ListLogsQueryParams,
  RecordExecutionBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/scripts/:id/logs", async (req, res): Promise<void> => {
  const params = GetScriptLogsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const logs = await db
    .select({
      id: executionLogsTable.id,
      scriptId: executionLogsTable.scriptId,
      scriptName: scriptsTable.name,
      status: executionLogsTable.status,
      executorId: executionLogsTable.executorId,
      robloxUsername: executionLogsTable.robloxUsername,
      robloxUserId: executionLogsTable.robloxUserId,
      robloxClientId: executionLogsTable.robloxClientId,
      robloxThumbnailUrl: executionLogsTable.robloxThumbnailUrl,
      robloxExecutor: executionLogsTable.robloxExecutor,
      duration: executionLogsTable.duration,
      createdAt: executionLogsTable.createdAt,
    })
    .from(executionLogsTable)
    .leftJoin(scriptsTable, eq(executionLogsTable.scriptId, scriptsTable.id))
    .where(eq(executionLogsTable.scriptId, params.data.id))
    .orderBy(desc(executionLogsTable.createdAt))
    .limit(50);

  res.json(
    logs.map((l) => ({
      id: l.id,
      scriptId: l.scriptId,
      scriptName: l.scriptName ?? "Unknown",
      status: l.status,
      executorId: l.executorId,
      robloxUsername: l.robloxUsername ?? null,
      robloxUserId: l.robloxUserId ?? null,
      robloxClientId: l.robloxClientId ?? null,
      robloxThumbnailUrl: l.robloxThumbnailUrl ?? null,
      robloxExecutor: l.robloxExecutor ?? null,
      duration: l.duration ?? null,
      createdAt: l.createdAt.toISOString(),
    }))
  );
});

router.get("/logs", async (req, res): Promise<void> => {
  const parsed = ListLogsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { status, limit } = parsed.data;

  let query = db
    .select({
      id: executionLogsTable.id,
      scriptId: executionLogsTable.scriptId,
      scriptName: scriptsTable.name,
      status: executionLogsTable.status,
      executorId: executionLogsTable.executorId,
      robloxUsername: executionLogsTable.robloxUsername,
      robloxUserId: executionLogsTable.robloxUserId,
      robloxClientId: executionLogsTable.robloxClientId,
      robloxThumbnailUrl: executionLogsTable.robloxThumbnailUrl,
      robloxExecutor: executionLogsTable.robloxExecutor,
      duration: executionLogsTable.duration,
      createdAt: executionLogsTable.createdAt,
    })
    .from(executionLogsTable)
    .leftJoin(scriptsTable, eq(executionLogsTable.scriptId, scriptsTable.id))
    .orderBy(desc(executionLogsTable.createdAt))
    .$dynamic();

  if (status) {
    query = query.where(eq(executionLogsTable.status, status));
  }

  const logs = await query.limit(limit ?? 100);

  res.json(
    logs.map((l) => ({
      id: l.id,
      scriptId: l.scriptId,
      scriptName: l.scriptName ?? "Unknown",
      status: l.status,
      executorId: l.executorId,
      robloxUsername: l.robloxUsername ?? null,
      robloxUserId: l.robloxUserId ?? null,
      robloxClientId: l.robloxClientId ?? null,
      robloxThumbnailUrl: l.robloxThumbnailUrl ?? null,
      robloxExecutor: l.robloxExecutor ?? null,
      duration: l.duration ?? null,
      createdAt: l.createdAt.toISOString(),
    }))
  );
});

router.post("/logs", async (req, res): Promise<void> => {
  const parsed = RecordExecutionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [script] = await db
    .select()
    .from(scriptsTable)
    .where(eq(scriptsTable.id, parsed.data.scriptId));

  if (!script) {
    res.status(404).json({ error: "Script not found" });
    return;
  }

  const [log] = await db
    .insert(executionLogsTable)
    .values({
      scriptId: parsed.data.scriptId,
      status: parsed.data.status,
      executorId: parsed.data.executorId,
      duration: parsed.data.duration ?? null,
    })
    .returning();

  const successDelta = parsed.data.status === "success" ? 1 : 0;
  const failureDelta = parsed.data.status === "failed" ? 1 : 0;

  await db
    .update(scriptsTable)
    .set({
      executions: script.executions + 1,
      successCount: script.successCount + successDelta,
      failureCount: script.failureCount + failureDelta,
    })
    .where(eq(scriptsTable.id, parsed.data.scriptId));

  res.status(201).json({
    id: log.id,
    scriptId: log.scriptId,
    scriptName: script.name,
    status: log.status,
    executorId: log.executorId,
    duration: log.duration ?? null,
    createdAt: log.createdAt.toISOString(),
  });
});

export default router;
