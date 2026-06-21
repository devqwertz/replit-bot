// In-memory session store for checkpoint flow (short-lived, no need for DB)
interface CheckpointSession {
  scriptKey: string;
  createdAt: number;
  used: boolean;
}

const sessions = new Map<string, CheckpointSession>();

const HEX = "0123456789abcdef";
function randomHex(len: number) {
  return Array.from({ length: len }, () => HEX[Math.floor(Math.random() * 16)]).join("");
}

export function createCheckpointSession(scriptKey: string): string {
  const token = randomHex(32);
  sessions.set(token, { scriptKey, createdAt: Date.now(), used: false });
  // Prune old sessions
  const cutoff = Date.now() - 600_000;
  for (const [k, v] of sessions) if (v.createdAt < cutoff) sessions.delete(k);
  return token;
}

export function consumeCheckpointSession(
  token: string,
  scriptKey: string,
  minAgeMs = 5_000,
  maxAgeMs = 300_000
): { ok: true } | { ok: false; reason: string } {
  const s = sessions.get(token);
  if (!s) return { ok: false, reason: "Session not found or already used" };
  if (s.used) return { ok: false, reason: "Session already used" };
  if (s.scriptKey !== scriptKey) return { ok: false, reason: "Session script mismatch" };
  const age = Date.now() - s.createdAt;
  if (age < minAgeMs) return { ok: false, reason: "Checkpoint completed too fast — please complete the full checkpoint" };
  if (age > maxAgeMs) return { ok: false, reason: "Session expired — please start again" };
  s.used = true;
  return { ok: true };
}
