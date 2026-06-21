import { Router, type IRouter } from "express";
import { eq, sql, desc, count } from "drizzle-orm";
import { db, scriptsTable, executionLogsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/analytics/overview", async (_req, res): Promise<void> => {
  const [scriptStats] = await db
    .select({
      totalScripts: count(scriptsTable.id),
      activeScripts: sql<number>`count(case when ${scriptsTable.status} = 'active' then 1 end)`,
      obfuscatedScripts: sql<number>`count(case when ${scriptsTable.obfuscationStatus} = 'complete' then 1 end)`,
      totalExecutions: sql<number>`sum(${scriptsTable.executions})`,
      totalSuccess: sql<number>`sum(${scriptsTable.successCount})`,
    })
    .from(scriptsTable);

  const [logStats] = await db
    .select({
      uniqueExecutors: sql<number>`count(distinct ${executionLogsTable.executorId})`,
    })
    .from(executionLogsTable);

  const totalExecutions = Number(scriptStats.totalExecutions ?? 0);
  const totalSuccess = Number(scriptStats.totalSuccess ?? 0);
  const successRate = totalExecutions > 0 ? (totalSuccess / totalExecutions) * 100 : 0;

  res.json({
    totalScripts: Number(scriptStats.totalScripts ?? 0),
    totalExecutions,
    activeUsers: Number(logStats.uniqueExecutors ?? 0),
    successRate: Math.round(successRate * 10) / 10,
    activeScripts: Number(scriptStats.activeScripts ?? 0),
    obfuscatedScripts: Number(scriptStats.obfuscatedScripts ?? 0),
  });
});

router.get("/analytics/chart", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      date: sql<string>`date_trunc('day', ${executionLogsTable.createdAt})::date::text`,
      executions: count(executionLogsTable.id),
      success: sql<number>`count(case when ${executionLogsTable.status} = 'success' then 1 end)`,
      failed: sql<number>`count(case when ${executionLogsTable.status} = 'failed' then 1 end)`,
    })
    .from(executionLogsTable)
    .where(sql`${executionLogsTable.createdAt} >= now() - interval '30 days'`)
    .groupBy(sql`date_trunc('day', ${executionLogsTable.createdAt})::date::text`)
    .orderBy(sql`date_trunc('day', ${executionLogsTable.createdAt})::date::text`);

  res.json(
    rows.map((r) => ({
      date: r.date,
      executions: Number(r.executions),
      success: Number(r.success),
      failed: Number(r.failed),
    }))
  );
});

router.get("/analytics/recent-activity", async (_req, res): Promise<void> => {
  const logs = await db
    .select({
      id: executionLogsTable.id,
      scriptId: executionLogsTable.scriptId,
      scriptName: scriptsTable.name,
      status: executionLogsTable.status,
      executorId: executionLogsTable.executorId,
      duration: executionLogsTable.duration,
      createdAt: executionLogsTable.createdAt,
    })
    .from(executionLogsTable)
    .leftJoin(scriptsTable, eq(executionLogsTable.scriptId, scriptsTable.id))
    .orderBy(desc(executionLogsTable.createdAt))
    .limit(10);

  res.json(
    logs.map((l) => ({
      id: l.id,
      scriptId: l.scriptId,
      scriptName: l.scriptName ?? "Unknown",
      status: l.status,
      executorId: l.executorId,
      duration: l.duration ?? null,
      createdAt: l.createdAt.toISOString(),
    }))
  );
});

router.get("/analytics/top-scripts", async (_req, res): Promise<void> => {
  const scripts = await db
    .select()
    .from(scriptsTable)
    .orderBy(desc(scriptsTable.executions))
    .limit(5);

  res.json(
    scripts.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description ?? null,
      code: s.code ?? null,
      obfuscatedCode: s.obfuscatedCode ?? null,
      scriptKey: s.scriptKey ?? null,
      service: s.service ?? null,
      status: s.status,
      obfuscationStatus: s.obfuscationStatus,
      executions: s.executions,
      successCount: s.successCount,
      failureCount: s.failureCount,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    }))
  );
});

router.get("/analytics/top-executors", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      executorId: executionLogsTable.executorId,
      robloxUsername: executionLogsTable.robloxUsername,
      robloxClientId: executionLogsTable.robloxClientId,
      robloxThumbnailUrl: executionLogsTable.robloxThumbnailUrl,
      executions: sql<number>`count(*)`,
      successCount: sql<number>`count(case when ${executionLogsTable.status} = 'success' then 1 end)`,
    })
    .from(executionLogsTable)
    .groupBy(
      executionLogsTable.executorId,
      executionLogsTable.robloxUsername,
      executionLogsTable.robloxClientId,
      executionLogsTable.robloxThumbnailUrl,
    )
    .orderBy(sql`count(*) desc`)
    .limit(10);

  res.json(
    rows.map((r) => ({
      executorId: r.executorId,
      robloxUsername: r.robloxUsername ?? null,
      robloxClientId: r.robloxClientId ?? null,
      robloxThumbnailUrl: r.robloxThumbnailUrl ?? null,
      executions: Number(r.executions),
      successCount: Number(r.successCount),
    }))
  );
});

router.get("/analytics/top-countries", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      country: executionLogsTable.country,
      countryCode: executionLogsTable.countryCode,
      executions: sql<number>`count(*)`,
    })
    .from(executionLogsTable)
    .where(sql`${executionLogsTable.country} is not null`)
    .groupBy(executionLogsTable.country, executionLogsTable.countryCode)
    .orderBy(sql`count(*) desc`)
    .limit(50);

  res.json(
    rows.map((r) => ({
      country: r.country ?? "Unknown",
      countryCode: r.countryCode ?? "XX",
      executions: Number(r.executions),
    }))
  );
});

export default router;
