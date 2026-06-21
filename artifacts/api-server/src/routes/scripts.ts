import { Router, type IRouter } from "express";
import { eq, ilike, and } from "drizzle-orm";
import { randomUUID } from "crypto";
import { getAuth } from "@clerk/express";
import { db, scriptsTable, sessionsTable } from "@workspace/db";
import { obfuscateLua } from "../lib/obfuscator";
import {
  ListScriptsQueryParams,
  CreateScriptBody,
  GetScriptParams,
  UpdateScriptParams,
  UpdateScriptBody,
  DeleteScriptParams,
  ObfuscateScriptParams,
  ToggleScriptParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function buildTelemetryHeader(pingUrl: string): string {
  return `-- Xeioa Telemetry
local __lh_uid, __lh_cid, __lh_exec, __lh_place, __lh_job = "0", "", "unknown", "0", ""
pcall(function()
    local lp = game:GetService("Players").LocalPlayer
    if lp then __lh_uid = tostring(lp.UserId) end
end)
pcall(function() __lh_cid = game:GetService("RbxAnalyticsService"):GetClientId() end)
pcall(function() if identifyexecutor then __lh_exec = identifyexecutor() end end)
pcall(function() __lh_place = tostring(game.PlaceId); __lh_job = tostring(game.JobId) end)
local function __lh_enc(s)
    return (tostring(s):gsub("[^%w%-_%.~]", function(c) return string.format("%%%02X", string.byte(c)) end))
end
local function __lh_ping()
    local url = "${pingUrl}?rbxuid=" .. __lh_uid .. "&rbxclientid=" .. __lh_enc(__lh_cid) .. "&rbxexecutor=" .. __lh_enc(__lh_exec) .. "&rbxplaceid=" .. __lh_place .. "&rbxjobid=" .. __lh_job
    local resp = ""
    local ok = pcall(function() resp = game:HttpGet(url) end)
    if not ok then pcall(function() resp = game:GetService("HttpService"):GetAsync(url) end) end
    pcall(function()
        local data = game:GetService("HttpService"):JSONDecode(resp)
        if data then
            if data.kick and tostring(data.kick) ~= "" then
                pcall(function() game:GetService("Players").LocalPlayer:Kick(tostring(data.kick)) end)
            end
            if data.n and data.n ~= "" then
                game:GetService("StarterGui"):SetCore("SendNotification", {
                    Title = "Xeioa",
                    Text = tostring(data.n),
                    Duration = 10
                })
            end
        end
    end)
end
__lh_ping()
pcall(function()
    task.spawn(function() while task.wait(5) do __lh_ping() end end)
end)
pcall(function()
    if not task then spawn(function() while true do wait(5) __lh_ping() end end) end
end)
-- End Xeioa Telemetry

`;
}

function buildPingUrl(key: string): string {
  const domains = process.env.REPLIT_DOMAINS?.split(",") ?? [];
  const devDomain = process.env.REPLIT_DEV_DOMAIN ?? "";
  const domain = (domains[0] ?? devDomain ?? "").trim();
  if (!domain) throw new Error("No domain available to build ping URL");
  return `https://${domain}/api/ping/${key}`;
}

function requireAuth(req: any, res: any, next: any) {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  req.userId = userId;
  next();
}

function mapScript(s: typeof scriptsTable.$inferSelect) {
  return {
    id: s.id,
    name: s.name,
    description: s.description ?? null,
    code: s.code ?? null,
    obfuscatedCode: s.obfuscatedCode ?? null,
    scriptKey: s.scriptKey ?? null,
    service: s.service ?? null,
    provider: s.provider ?? null,
    checkpointUrl: s.checkpointUrl ?? null,
    status: s.status,
    obfuscationStatus: s.obfuscationStatus,
    executions: s.executions,
    successCount: s.successCount,
    failureCount: s.failureCount,
    webhookUrl: s.webhookUrl ?? null,
    webhookLogsEnabled: s.webhookLogsEnabled,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}

router.get("/scripts", requireAuth, async (req, res): Promise<void> => {
  const parsed = ListScriptsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { search, status } = parsed.data;
  const conditions: ReturnType<typeof eq>[] = [
    eq(scriptsTable.userId, (req as any).userId),
  ];

  if (search) conditions.push(ilike(scriptsTable.name, `%${search}%`));
  if (status) conditions.push(eq(scriptsTable.status, status));

  const scripts = await db
    .select()
    .from(scriptsTable)
    .where(and(...conditions))
    .orderBy(scriptsTable.createdAt);

  res.json(scripts.map(mapScript));
});

router.post("/scripts", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateScriptBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [script] = await db
    .insert(scriptsTable)
    .values({
      userId: (req as any).userId,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      code: parsed.data.code ?? null,
      service: parsed.data.service ?? null,
      provider: parsed.data.provider ?? null,
      checkpointUrl: (parsed.data as any).checkpointUrl ?? null,
      webhookUrl: (parsed.data as any).webhookUrl ?? null,
      webhookLogsEnabled: (parsed.data as any).webhookLogsEnabled ?? false,
      obfuscationStatus: "pending",
      status: "active",
    })
    .returning();

  // Auto-obfuscate immediately if code was provided
  if (parsed.data.code) {
    const key = randomUUID();
    const domains = process.env.REPLIT_DOMAINS?.split(",") ?? [];
    const devDomain = process.env.REPLIT_DEV_DOMAIN ?? "";
    const domain = (domains[0] ?? devDomain ?? "").trim();
    if (domain) {
      const pingUrl = `https://${domain}/api/ping/${key}`;
      const telemetryHeader = buildTelemetryHeader(pingUrl);
      try {
        const protected_code = obfuscateLua(telemetryHeader + parsed.data.code);
        const [updated] = await db
          .update(scriptsTable)
          .set({ scriptKey: key, obfuscatedCode: protected_code, obfuscationStatus: "complete" })
          .where(eq(scriptsTable.id, script.id))
          .returning();
        res.status(201).json(mapScript(updated)); return;
      } catch {
        // Non-fatal: script created but not yet protected
      }
    }
  }

  res.status(201).json(mapScript(script));
});

router.get("/scripts/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetScriptParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [script] = await db
    .select()
    .from(scriptsTable)
    .where(and(eq(scriptsTable.id, params.data.id), eq(scriptsTable.userId, (req as any).userId)));

  if (!script) {
    res.status(404).json({ error: "Script not found" });
    return;
  }

  res.json(mapScript(script));
});

router.patch("/scripts/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateScriptParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpdateScriptBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const updateData: Partial<typeof scriptsTable.$inferInsert> = {};
  if (body.data.name !== undefined) updateData.name = body.data.name;
  if (body.data.description !== undefined) updateData.description = body.data.description;
  if (body.data.code !== undefined) {
    updateData.code = body.data.code;
    updateData.obfuscationStatus = "pending";
    updateData.scriptKey = null;
    updateData.obfuscatedCode = null;
  }
  if (body.data.service !== undefined) updateData.service = body.data.service;
  if (body.data.provider !== undefined) updateData.provider = body.data.provider;
  if ((body.data as any).checkpointUrl !== undefined) updateData.checkpointUrl = (body.data as any).checkpointUrl || null;
  if (body.data.status !== undefined) updateData.status = body.data.status;

  const [script] = await db
    .update(scriptsTable)
    .set(updateData)
    .where(and(eq(scriptsTable.id, params.data.id), eq(scriptsTable.userId, (req as any).userId)))
    .returning();

  if (!script) {
    res.status(404).json({ error: "Script not found" });
    return;
  }

  res.json(mapScript(script));
});

router.delete("/scripts/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteScriptParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [script] = await db
    .delete(scriptsTable)
    .where(and(eq(scriptsTable.id, params.data.id), eq(scriptsTable.userId, (req as any).userId)))
    .returning();

  if (!script) {
    res.status(404).json({ error: "Script not found" });
    return;
  }

  res.sendStatus(204);
});

router.post("/scripts/:id/obfuscate", requireAuth, async (req, res): Promise<void> => {
  const params = ObfuscateScriptParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(scriptsTable)
    .where(and(eq(scriptsTable.id, params.data.id), eq(scriptsTable.userId, (req as any).userId)));

  if (!existing) {
    res.status(404).json({ error: "Script not found" });
    return;
  }

  if (!existing.code) {
    res.status(400).json({ error: "No source code to protect. Upload code first." });
    return;
  }

  await db
    .update(scriptsTable)
    .set({ obfuscationStatus: "processing" })
    .where(eq(scriptsTable.id, params.data.id));

  const key = randomUUID();

  let pingUrl: string;
  try {
    pingUrl = buildPingUrl(key);
  } catch {
    await db.update(scriptsTable).set({ obfuscationStatus: "failed" }).where(eq(scriptsTable.id, params.data.id));
    res.status(500).json({ error: "Server domain not configured" });
    return;
  }

  const codeToProtect = buildTelemetryHeader(pingUrl) + existing.code;

  let protected_code: string;
  try {
    protected_code = obfuscateLua(codeToProtect);
  } catch {
    await db
      .update(scriptsTable)
      .set({ obfuscationStatus: "failed" })
      .where(eq(scriptsTable.id, params.data.id));
    res.status(500).json({ error: "Obfuscation failed" });
    return;
  }

  const [script] = await db
    .update(scriptsTable)
    .set({
      scriptKey: key,
      obfuscatedCode: protected_code,
      obfuscationStatus: "complete",
    })
    .where(eq(scriptsTable.id, params.data.id))
    .returning();

  res.json(mapScript(script));
});

// Secure source code endpoint — only accessible to the authenticated script owner
router.get("/scripts/:id/source", requireAuth, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [script] = await db
    .select({ code: scriptsTable.code, name: scriptsTable.name })
    .from(scriptsTable)
    .where(and(eq(scriptsTable.id, id), eq(scriptsTable.userId, (req as any).userId)));

  if (!script) { res.status(404).json({ error: "Not found" }); return; }
  if (!script.code) { res.status(404).json({ error: "No source uploaded" }); return; }

  res.type("text/plain").send(script.code);
});

// Secure obfuscated code endpoint — only accessible to the authenticated script owner
router.get("/scripts/:id/obfuscated", requireAuth, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [script] = await db
    .select({ obfuscatedCode: scriptsTable.obfuscatedCode, name: scriptsTable.name })
    .from(scriptsTable)
    .where(and(eq(scriptsTable.id, id), eq(scriptsTable.userId, (req as any).userId)));

  if (!script) { res.status(404).json({ error: "Not found" }); return; }
  if (!script.obfuscatedCode) { res.status(404).json({ error: "No obfuscated build available" }); return; }

  res.type("text/plain").send(script.obfuscatedCode);
});

router.post("/scripts/:id/sessions/:sessionId/kick", requireAuth, async (req, res): Promise<void> => {
  const scriptId = Number(req.params.id);
  const sessionId = Number(req.params.sessionId);
  if (isNaN(scriptId) || isNaN(sessionId)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [script] = await db
    .select()
    .from(scriptsTable)
    .where(and(eq(scriptsTable.id, scriptId), eq(scriptsTable.userId, (req as any).userId)));
  if (!script) {
    res.status(404).json({ error: "Script not found" });
    return;
  }

  const message: string = (req.body?.message as string)?.trim() || "You have been kicked by the server administrator.";

  const [updated] = await db
    .update(sessionsTable)
    .set({ pendingNotification: `__kick__:${message}` })
    .where(eq(sessionsTable.id, sessionId))
    .returning({ id: sessionsTable.id });

  if (!updated) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  res.json({ ok: true });
});

router.patch("/scripts/:id/toggle", requireAuth, async (req, res): Promise<void> => {
  const params = ToggleScriptParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(scriptsTable)
    .where(and(eq(scriptsTable.id, params.data.id), eq(scriptsTable.userId, (req as any).userId)));

  if (!existing) {
    res.status(404).json({ error: "Script not found" });
    return;
  }

  const [script] = await db
    .update(scriptsTable)
    .set({ status: existing.status === "active" ? "inactive" : "active" })
    .where(eq(scriptsTable.id, params.data.id))
    .returning();

  res.json(mapScript(script));
});

export default router;
