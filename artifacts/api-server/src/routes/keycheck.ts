import { Router, type IRouter } from "express";
import { eq, and, gt } from "drizzle-orm";
import { db, scriptsTable, userKeysTable } from "@workspace/db";
import { createCheckpointSession, consumeCheckpointSession } from "../key-store";

const router: IRouter = Router();

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const seg = () => Array.from({ length: 4 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join("");
const genKey = () => `XEIOA-${seg()}-${seg()}-${seg()}`;

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function getOrigin(req: import("express").Request): string {
  const host = (req.headers["x-forwarded-host"] ?? req.get("host") ?? "localhost") as string;
  const proto = ((req.headers["x-forwarded-proto"] as string | undefined) ?? req.protocol ?? "https").split(",")[0].trim();
  return `${proto}://${host}`;
}

// ── Step 1: User visits /api/getkey/:scriptKey ──────────────────────────────
router.get("/getkey/:scriptKey", async (req, res): Promise<void> => {
  const scriptKey = Array.isArray(req.params.scriptKey) ? req.params.scriptKey[0] : req.params.scriptKey;

  const [script] = await db
    .select({ id: scriptsTable.id, name: scriptsTable.name, service: scriptsTable.service, status: scriptsTable.status, obfuscatedCode: scriptsTable.obfuscatedCode })
    .from(scriptsTable)
    .where(eq(scriptsTable.scriptKey, scriptKey));

  if (!script || script.status !== "active" || !script.obfuscatedCode) {
    res.status(404).type("text/html").send(errorPage("Script not found or has no key system enabled."));
    return;
  }

  const origin = getOrigin(req);
  const checkpointUrl = process.env["CHECKPOINT_URL"] ?? process.env["LINKVERTISE_URL"] ?? "";
  const session = createCheckpointSession(scriptKey);
  const verifyUrl = `${origin}/api/getkey/verify?session=${session}&scriptKey=${encodeURIComponent(scriptKey)}`;

  if (checkpointUrl) {
    // Redirect through the checkpoint
    const encoded = Buffer.from(verifyUrl).toString("base64url");
    const redirect = checkpointUrl.includes("{url}")
      ? checkpointUrl.replace("{url}", encodeURIComponent(verifyUrl))
      : `${checkpointUrl}${encoded}`;
    res.redirect(302, redirect);
  } else {
    // Dev mode: skip checkpoint, go straight to verify
    res.redirect(302, verifyUrl);
  }
});

// ── Step 2: User returns from checkpoint ─────────────────────────────────────
router.get("/getkey/verify", async (req, res): Promise<void> => {
  const token = typeof req.query.session === "string" ? req.query.session : "";
  const scriptKey = typeof req.query.scriptKey === "string" ? req.query.scriptKey : "";

  if (!token || !scriptKey) {
    res.status(400).type("text/html").send(errorPage("Missing session or scriptKey."));
    return;
  }

  // In dev mode (no checkpoint URL) bypass the anti-timing check
  const bypassTiming = !process.env["CHECKPOINT_URL"] && !process.env["LINKVERTISE_URL"];
  const result = consumeCheckpointSession(token, scriptKey, bypassTiming ? 0 : 5_000);
  if (!result.ok) {
    res.status(400).type("text/html").send(errorPage(result.reason));
    return;
  }

  const [script] = await db
    .select({ id: scriptsTable.id, name: scriptsTable.name, service: scriptsTable.service, status: scriptsTable.status, obfuscatedCode: scriptsTable.obfuscatedCode })
    .from(scriptsTable)
    .where(eq(scriptsTable.scriptKey, scriptKey));

  if (!script || script.status !== "active" || !script.obfuscatedCode) {
    res.status(404).type("text/html").send(errorPage("Script not available."));
    return;
  }

  const keyValue = genKey();
  const expiresAt = new Date(Date.now() + 24 * 3_600_000); // 24h default

  await db.insert(userKeysTable).values({
    scriptId: script.id,
    scriptKey,
    keyValue,
    expiresAt,
  });

  const displayName = escapeHtml(script.service || script.name);

  res.type("text/html").send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${displayName} — Key System</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #080812;
      color: #e2e2f0;
      font-family: system-ui, -apple-system, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }
    .card {
      background: linear-gradient(145deg, #12121e, #0d0d18);
      border: 1px solid rgba(99,102,241,.3);
      border-radius: 1.25rem;
      padding: 2.5rem 2rem;
      max-width: 420px;
      width: 100%;
      text-align: center;
      box-shadow: 0 0 60px -10px rgba(99,102,241,.35), 0 25px 50px -12px rgba(0,0,0,.7);
    }
    .shield {
      width: 72px; height: 72px;
      background: rgba(99,102,241,.15);
      border: 1.5px solid rgba(99,102,241,.45);
      border-radius: 1.1rem;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 1.5rem;
      font-size: 2rem;
      box-shadow: 0 0 30px -5px rgba(99,102,241,.4);
    }
    h1 { font-size: 1.35rem; font-weight: 700; margin-bottom: .35rem; }
    .sub { color: #888; font-size: .875rem; margin-bottom: 1.75rem; }
    .key-box {
      background: #08080f;
      border: 1px solid rgba(99,102,241,.25);
      border-radius: .75rem;
      padding: 1rem 1.25rem;
      margin-bottom: 1.25rem;
    }
    .key-label { font-size: .7rem; color: #666; text-transform: uppercase; letter-spacing: .1em; margin-bottom: .5rem; }
    .key-val {
      font-family: 'Courier New', monospace;
      font-size: 1.05rem; font-weight: 700;
      color: #a5b4fc; letter-spacing: .12em; word-break: break-all;
    }
    .copy-btn {
      width: 100%; padding: .75rem;
      background: linear-gradient(135deg, #4f46e5, #4338ca);
      color: #fff; border: none; border-radius: .75rem;
      font-size: .95rem; font-weight: 600; cursor: pointer;
      transition: opacity .15s, transform .1s; margin-bottom: .75rem;
    }
    .copy-btn:hover { opacity: .9; }
    .copy-btn:active { transform: scale(.98); }
    .copy-btn.ok { background: linear-gradient(135deg, #16a34a, #15803d); }
    .info { font-size: .78rem; color: #555; margin-top: 1rem; }
    .steps { margin-top: 1.5rem; }
    .step {
      display: flex; align-items: flex-start; gap: .75rem;
      text-align: left; font-size: .82rem; color: #888;
      padding: .6rem 0; border-top: 1px solid rgba(255,255,255,.05);
    }
    .num {
      background: rgba(99,102,241,.2); border: 1px solid rgba(99,102,241,.35);
      border-radius: 50%; width: 20px; height: 20px; min-width: 20px;
      display: flex; align-items: center; justify-content: center;
      font-size: .7rem; font-weight: 700; color: #a5b4fc;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="shield">🛡️</div>
    <h1>Your Verification Key</h1>
    <p class="sub">Copy this key and paste it into Roblox</p>

    <div class="key-box">
      <div class="key-label">Key — valid 24 hours</div>
      <div class="key-val" id="kv">${escapeHtml(keyValue)}</div>
    </div>

    <button class="copy-btn" id="cb" onclick="copy()">Copy Key</button>

    <div class="steps">
      <div class="step"><div class="num">1</div><span>Copy the key above</span></div>
      <div class="step"><div class="num">2</div><span>Return to Roblox</span></div>
      <div class="step"><div class="num">3</div><span>Paste it into the key field and click <strong>Verify Key</strong></span></div>
    </div>

    <p class="info">This key expires in 24 hours. It saves automatically after first use — you won't need to enter it again.</p>
  </div>
  <script>
    function copy() {
      const k = document.getElementById('kv').textContent;
      const b = document.getElementById('cb');
      navigator.clipboard.writeText(k).then(function() {
        b.textContent = '✓ Copied!'; b.classList.add('ok');
        setTimeout(function() { b.textContent = 'Copy Key'; b.classList.remove('ok'); }, 2500);
      });
    }
  </script>
</body>
</html>`);
});

// ── Key check (called from Roblox GUI) ───────────────────────────────────────
router.get("/key/check", async (req, res): Promise<void> => {
  const userKey = typeof req.query.userKey === "string" ? req.query.userKey.trim() : null;
  const scriptKey = typeof req.query.scriptKey === "string" ? req.query.scriptKey.trim() : null;
  const hwid = typeof req.query.hwid === "string" ? req.query.hwid.trim() : null;

  if (!userKey || !scriptKey) {
    res.json({ valid: false, error: "Missing parameters" });
    return;
  }

  const now = new Date();
  const [entry] = await db
    .select()
    .from(userKeysTable)
    .where(
      and(
        eq(userKeysTable.keyValue, userKey),
        eq(userKeysTable.scriptKey, scriptKey),
        gt(userKeysTable.expiresAt, now)
      )
    );

  if (!entry) {
    res.json({ valid: false, error: "Key not found or expired — get a new one" });
    return;
  }

  // HWID locking
  if (entry.hwidLocked && entry.hwid && hwid && entry.hwid !== hwid) {
    res.json({ valid: false, error: "Key is locked to a different device" });
    return;
  }

  // Lock HWID on first use
  if (!entry.hwidLocked && hwid) {
    await db
      .update(userKeysTable)
      .set({ hwid, hwidLocked: true, lastUsedAt: now })
      .where(eq(userKeysTable.id, entry.id));
  } else {
    await db
      .update(userKeysTable)
      .set({ lastUsedAt: now })
      .where(eq(userKeysTable.id, entry.id));
  }

  const [script] = await db
    .select({ obfuscatedCode: scriptsTable.obfuscatedCode, status: scriptsTable.status })
    .from(scriptsTable)
    .where(eq(scriptsTable.scriptKey, scriptKey));

  if (!script || !script.obfuscatedCode || script.status !== "active") {
    res.json({ valid: false, error: "Script not available" });
    return;
  }

  res.json({ valid: true, script: script.obfuscatedCode });
});

function errorPage(msg: string) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Error</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{background:#080812;color:#e2e2f0;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;}
.c{text-align:center;padding:2rem;background:#12121e;border:1px solid rgba(239,68,68,.3);border-radius:1rem;max-width:400px;}
h2{color:#ef4444;margin-bottom:.75rem;}p{color:#888;font-size:.9rem;}
a{color:#a5b4fc;text-decoration:none;display:inline-block;margin-top:1rem;font-size:.85rem;}
</style></head><body><div class="c"><h2>✕ Error</h2><p>${escapeHtml(msg)}</p>
<a href="javascript:history.back()">← Go Back</a></div></body></html>`;
}

export default router;
