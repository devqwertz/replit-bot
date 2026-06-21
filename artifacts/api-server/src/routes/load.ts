import { Router, type IRouter } from "express";
import { eq, and, or } from "drizzle-orm";
import { db, scriptsTable, scriptBansTable } from "@workspace/db";
import { buildKeySystemLua } from "../lua-template";

const router: IRouter = Router();

router.get("/load/:key", async (req, res): Promise<void> => {
  const userAgent = req.headers["user-agent"] ?? "";
  const isRoblox =
    userAgent.toLowerCase().includes("roblox") ||
    !!req.headers["roblox-id"] ||
    !!req.headers["roblox-game-id"];

  if (!isRoblox) {
    res.status(403).type("text/html").send(
      "<!DOCTYPE html><html><head><title>403 Forbidden</title></head><body>" +
      "<h1>403 Forbidden</h1><p>This endpoint is restricted to Roblox executors only.</p>" +
      "</body></html>"
    );
    return;
  }

  const key = Array.isArray(req.params.key) ? req.params.key[0] : req.params.key;
  if (!key) { res.status(400).type("text/plain").send("-- Xeioa: missing key"); return; }

  const forwarded = req.headers["x-forwarded-for"];
  const rawIp = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(",")[0]?.trim() || req.ip || "unknown";

  const [script] = await db.select().from(scriptsTable).where(eq(scriptsTable.scriptKey, key));
  if (!script) { res.status(404).type("text/plain").send("-- Xeioa: invalid or expired key"); return; }
  if (script.status !== "active") { res.status(403).type("text/plain").send("-- Xeioa: script is disabled"); return; }
  if (!script.obfuscatedCode) { res.status(404).type("text/plain").send("-- Xeioa: no protected build available, re-generate key"); return; }

  // Ban check
  const rbxClientId = typeof req.query.rbxclientid === "string" ? req.query.rbxclientid : null;
  const banConditions: ReturnType<typeof eq>[] = [eq(scriptBansTable.executorId, rawIp)];
  if (rbxClientId) banConditions.push(eq(scriptBansTable.executorId, `cid:${rbxClientId}`));

  const [ban] = await db.select().from(scriptBansTable).where(
    and(eq(scriptBansTable.scriptId, script.id), or(...banConditions))
  );
  if (ban) {
    res.status(200).type("text/plain").send(
      'pcall(function() game:GetService("Players").LocalPlayer:Kick("You have been permanently banned from this script. Contact the owner to get unbanned.") end)'
    );
    return;
  }

  // Determine API base URL from request headers (works behind proxy)
  const host = req.headers["x-forwarded-host"] || req.get("host") || "localhost";
  const proto = (req.headers["x-forwarded-proto"] as string || req.protocol || "https").split(",")[0].trim();
  const apiBase = `${proto}://${host}`;
  const keyUrl = `${apiBase}/api/getkey/${encodeURIComponent(key)}`;
  const displayName = script.service || script.name;

  const lua = buildKeySystemLua({ scriptKey: key, apiBase, displayName, keyUrl });
  res.type("text/plain").send(lua);
});

export default router;
