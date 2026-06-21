import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Copy, Key, RefreshCw, ShieldCheck, ShieldOff, Square, Play, Terminal, Pencil, Ban, ShieldX, Users, ExternalLink, LogIn, UserX, Bell, Eye, FileCode, Monitor, X, CheckCheck, Shield } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { useGetScript, useGetScriptLogs, useObfuscateScript, useToggleScript, useUpdateScript } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface LiveSession {
  id: number;
  executorId: string;
  robloxUserId: string | null;
  robloxUsername: string | null;
  robloxClientId: string | null;
  robloxThumbnailUrl: string | null;
  robloxPlaceId: string | null;
  robloxJobId: string | null;
  robloxExecutor: string | null;
  country: string | null;
  lastPingAt: string;
}

function KeySystemPreviewDialog({
  open,
  onOpenChange,
  scriptName,
  serviceName,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  scriptName: string;
  serviceName?: string;
}) {
  const [keyValue, setKeyValue] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [copied, setCopied] = useState(false);
  const displayName = serviceName || scriptName;

  function handleGetLink() {
    navigator.clipboard.writeText("https://example.com/key").catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleVerify() {
    if (!keyValue.trim()) return;
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      setVerified(true);
    }, 1200);
  }

  function handleClose() {
    setKeyValue("");
    setVerifying(false);
    setVerified(false);
    setCopied(false);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="p-0 border-0 bg-transparent shadow-none max-w-sm [&>button]:hidden">
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            background: "linear-gradient(145deg, #12121c 0%, #0d0d18 100%)",
            border: "1px solid rgba(99,102,241,0.25)",
            boxShadow: "0 0 60px -10px rgba(99,102,241,0.4), 0 25px 50px -12px rgba(0,0,0,0.8)",
          }}
        >
          {/* Title bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
                <Shield className="w-3 h-3 text-primary" />
              </div>
              <span className="text-sm font-semibold text-foreground">{displayName} Key System</span>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground/60 hover:text-foreground hover:bg-white/10 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-8 flex flex-col items-center gap-5">
            {/* Shield icon */}
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, rgba(99,102,241,0.3) 0%, rgba(99,102,241,0.1) 100%)",
                border: "1px solid rgba(99,102,241,0.4)",
                boxShadow: "0 0 30px -5px rgba(99,102,241,0.5)",
              }}
            >
              <Shield className="w-8 h-8 text-primary" />
            </div>

            <div className="text-center space-y-1">
              <h2 className="text-base font-bold">Key Verification System</h2>
              <p className="text-xs text-muted-foreground">Powered by {displayName}</p>
            </div>

            {verified ? (
              <div className="w-full flex flex-col items-center gap-3 py-2">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.4)" }}
                >
                  <CheckCheck className="w-6 h-6 text-green-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-green-400">Key Verified!</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Your script is now running.</p>
                </div>
              </div>
            ) : (
              <>
                {/* Key input */}
                <div className="w-full">
                  <input
                    type="text"
                    value={keyValue}
                    onChange={(e) => setKeyValue(e.target.value)}
                    placeholder="Enter your verification key"
                    className="w-full px-4 py-2.5 rounded-xl text-sm bg-black/40 border border-white/10 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
                  />
                </div>

                {/* Buttons */}
                <div className="w-full grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleGetLink}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.97]"
                    style={{
                      background: copied
                        ? "linear-gradient(135deg, #059669 0%, #047857 100%)"
                        : "linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)",
                      boxShadow: copied
                        ? "0 0 20px -5px rgba(16,185,129,0.5)"
                        : "0 0 20px -5px rgba(99,102,241,0.5)",
                    }}
                  >
                    {copied ? (
                      <><CheckCheck className="w-3.5 h-3.5" /> Copied!</>
                    ) : (
                      <><Copy className="w-3.5 h-3.5" /> Get Link</>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleVerify}
                    disabled={!keyValue.trim() || verifying}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
                      boxShadow: keyValue.trim() ? "0 0 20px -5px rgba(34,197,94,0.5)" : "none",
                    }}
                  >
                    {verifying ? (
                      <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Verifying...</>
                    ) : (
                      <><CheckCheck className="w-3.5 h-3.5" /> Verify Key</>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Footer hint */}
          <div className="px-6 pb-4 text-center">
            <p className="text-[10px] text-muted-foreground/40">
              This is a preview of the in-game key verification UI
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ScriptDetail({ id }: { id: string }) {
  const scriptId = Number(id);
  const { data: script, isLoading } = useGetScript(scriptId);
  const { data: logs, isLoading: logsLoading } = useGetScriptLogs(scriptId);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editService, setEditService] = useState("");

  // Notify state — notifySession=null means broadcast to all
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [notifySession, setNotifySession] = useState<LiveSession | null>(null);
  const [notifyMessage, setNotifyMessage] = useState("");


  const loaderSnippet = script?.scriptKey
    ? `loadstring(game:HttpGet("${window.location.origin}/api/load/${script.scriptKey}"))()`
    : null;

  const sessionsKey = [`/api/scripts/${scriptId}/sessions`];
  const { data: sessions = [] } = useQuery<LiveSession[]>({
    queryKey: sessionsKey,
    queryFn: async () => {
      const r = await fetch(`/api/scripts/${scriptId}/sessions`);
      if (!r.ok) return [];
      return r.json();
    },
    enabled: !!scriptId,
    refetchInterval: 15000,
  });

  const bansKey = [`/api/scripts/${scriptId}/bans`];
  const { data: bans = [] } = useQuery<{ id: number; executorId: string; reason: string | null; createdAt: string }[]>({
    queryKey: bansKey,
    queryFn: async () => {
      const r = await fetch(`/api/scripts/${scriptId}/bans`);
      if (!r.ok) return [];
      return r.json();
    },
    enabled: !!scriptId,
  });

  const kickMutation = useMutation({
    mutationFn: async (sessionId: number) => {
      const r = await fetch(`/api/scripts/${scriptId}/sessions/${sessionId}/kick`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "You have been kicked by the server administrator." }),
      });
      if (!r.ok) throw new Error("Failed to kick");
    },
    onSuccess: () => toast({ title: "Player kicked", description: "They will be removed from the game on their next ping (≤5s)." }),
    onError: () => toast({ title: "Kick failed", variant: "destructive" }),
  });

  const banMutation = useMutation({
    mutationFn: async (executorId: string) => {
      const r = await fetch(`/api/scripts/${scriptId}/bans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ executorId }),
      });
      if (!r.ok) throw new Error("Failed to ban");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bansKey });
      queryClient.invalidateQueries({ queryKey: sessionsKey });
      toast({ title: "Executor banned", description: "They are permanently blocked and will be kicked on their next ping." });
    },
    onError: () => toast({ title: "Already banned or error", variant: "destructive" }),
  });

  const unbanMutation = useMutation({
    mutationFn: async (executorId: string) => {
      await fetch(`/api/scripts/${scriptId}/bans/${encodeURIComponent(executorId)}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bansKey });
      toast({ title: "Executor unbanned" });
    },
  });

  const notifyMutation = useMutation({
    mutationFn: async ({ sessionId, message }: { sessionId: number; message: string }) => {
      const r = await fetch(`/api/scripts/${scriptId}/sessions/${sessionId}/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error((err as any).error ?? "Failed to send notification");
      }
      return r.json();
    },
    onSuccess: () => {
      setNotifyOpen(false);
      setNotifyMessage("");
      setNotifySession(null);
      toast({ title: "Notification queued", description: "Will appear in-game on their next ping (≤30s)." });
    },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const broadcastMutation = useMutation({
    mutationFn: async (message: string) => {
      const r = await fetch(`/api/scripts/${scriptId}/notify-all`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error((err as any).error ?? "Failed to broadcast");
      }
      return r.json();
    },
    onSuccess: (data) => {
      setNotifyOpen(false);
      setNotifyMessage("");
      setNotifySession(null);
      toast({ title: "Notification broadcast", description: `Queued for ${data.count ?? 0} active player(s).` });
    },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const toggle = useToggleScript({
    mutation: {
      onSuccess: (data) => {
        queryClient.setQueryData(["getScript", scriptId], data);
        toast({ title: `Script ${data.status === "active" ? "enabled" : "disabled"}` });
      }
    }
  });

  const protect = useObfuscateScript({
    mutation: {
      onSuccess: (data) => {
        queryClient.setQueryData(["getScript", scriptId], data);
        toast({ title: "Key generated", description: "Your loadstring is ready to deploy." });
      }
    }
  });

  const updateScript = useUpdateScript({
    mutation: {
      onSuccess: (data) => {
        queryClient.setQueryData(["getScript", scriptId], data);
        setEditOpen(false);
        toast({ title: "Script updated", description: data.code ? "Key invalidated — re-generate to redeploy." : undefined });
      },
      onError: () => toast({ title: "Update failed", variant: "destructive" }),
    }
  });

  const openEdit = () => {
    setEditName(script?.name ?? "");
    setEditDesc(script?.description ?? "");
    setEditCode(script?.code ?? "");
    setEditService(script?.service ?? "");
    setEditOpen(true);
  };

  const copyLoadstring = () => {
    if (loaderSnippet) {
      navigator.clipboard.writeText(loaderSnippet);
      setCopied(true);
      toast({ title: "Loadstring copied", description: "Paste it into your executor." });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openNotifyDialog = (session: LiveSession) => {
    setNotifySession(session);
    setNotifyMessage("");
    setNotifyOpen(true);
  };

  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  const openSourcePage = (type: "source" | "obfuscated") => {
    window.open(`${basePath}/scripts/${scriptId}/${type}`, "_blank", "noopener,noreferrer");
  };

  if (isLoading) {
    return <div className="p-8 max-w-7xl mx-auto space-y-4"><Skeleton className="h-24 w-full" /><Skeleton className="h-64 w-full" /></div>;
  }

  if (!script) {
    return <div className="p-8 text-center text-muted-foreground">Script not found</div>;
  }

  const successRate = script.executions > 0
    ? Math.round((script.successCount / script.executions) * 100)
    : null;

  const bannedIds = new Set(bans.map(b => b.executorId));

  return (
    <div className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Header */}
      <div>
        <Link href="/scripts" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors gap-1.5">
          <ArrowLeft className="w-4 h-4" /> Back to Scripts
        </Link>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold tracking-tight font-mono">{script.name}</h1>
              <StatusBadge status={script.status} />
            </div>
            <p className="text-muted-foreground text-sm">
              {script.description || "No description."}{script.service ? ` · ${script.service}` : ""}
            </p>
            <div className="text-xs text-muted-foreground/60 font-mono mt-2">
              ID: {script.id} · Updated {formatDistanceToNow(new Date(script.updatedAt))} ago
            </div>
          </div>
          <div className="flex gap-2 shrink-0 flex-wrap">
            <Button variant="outline" size="sm" onClick={openEdit} className="border-white/10">
              <Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit
            </Button>
            {script.code && (
              <Button variant="outline" size="sm" onClick={() => openSourcePage("source")} className="border-white/10 gap-1.5">
                <Eye className="w-3.5 h-3.5" /> Source
              </Button>
            )}
            {script.obfuscatedCode && (
              <Button variant="outline" size="sm" onClick={() => openSourcePage("obfuscated")} className="border-white/10 gap-1.5">
                <FileCode className="w-3.5 h-3.5" /> Obfuscated
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => toggle.mutate({ id: script.id })} disabled={toggle.isPending} className="border-white/10">
              {script.status === "active"
                ? <><Square className="w-3.5 h-3.5 mr-1.5" /> Disable</>
                : <><Play className="w-3.5 h-3.5 mr-1.5" /> Enable</>}
            </Button>
            <Button size="sm" onClick={() => protect.mutate({ id: script.id })} disabled={protect.isPending}>
              {protect.isPending
                ? <><RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Generating...</>
                : script.scriptKey
                  ? <><RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Regenerate Key</>
                  : <><Key className="w-3.5 h-3.5 mr-1.5" /> Generate Key</>}
            </Button>
          </div>
        </div>
      </div>

      {/* Loadstring Box */}
      {script.obfuscationStatus === "complete" && loaderSnippet ? (
        <div className="rounded-lg border border-primary/20 bg-primary/[0.04] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <ShieldCheck className="w-4 h-4" />
              Script Protected — Loadstring Ready
            </div>
            <ProtectionBadge status={script.obfuscationStatus} />
          </div>
          <div className="rounded-md bg-black/60 border border-white/5 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Executor Loadstring</span>
              <div className="flex items-center gap-1">
                <Button size="sm" variant="ghost" className="h-6 px-2 text-xs gap-1.5 text-muted-foreground hover:text-foreground hover:bg-white/5" onClick={() => setPreviewOpen(true)}>
                  <Monitor className="w-3 h-3" /> Preview UI
                </Button>
                <Button size="sm" variant="ghost" className="h-6 px-2 text-xs gap-1.5 text-primary hover:text-primary hover:bg-primary/10" onClick={copyLoadstring}>
                  <Copy className="w-3 h-3" />
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>
            </div>
            <pre className="p-3 text-xs font-mono text-green-400 whitespace-pre-wrap break-all leading-relaxed select-all">
              {loaderSnippet}
            </pre>
          </div>
          <p className="text-xs text-muted-foreground/70">
            Telemetry (userId, clientId, executor, location) is auto-embedded — paste this one line into your executor. Regenerating invalidates the old key immediately.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-white/10 bg-card/30 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldOff className="w-5 h-5 text-muted-foreground/50" />
            <div>
              <div className="text-sm font-medium">Not protected yet</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {!script.code ? "Upload source code first, then generate a key." : "Click 'Generate Key' to protect this script and get your loadstring."}
              </div>
            </div>
          </div>
          <ProtectionBadge status={script.obfuscationStatus} />
        </div>
      )}

      {/* Live Players */}
      <Card className="border-white/5 bg-card/50 shadow-none overflow-hidden">
        <CardHeader className="py-3 px-4 border-b border-white/5 bg-black/20">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-green-400" />
            Live Players
            <Badge variant="outline" className={`ml-1 text-[10px] ${sessions.length > 0 ? "border-green-500/30 text-green-400 bg-green-500/10" : "border-white/10 text-muted-foreground"}`}>
              {sessions.length} online
            </Badge>
            <Button
              size="sm"
              variant="outline"
              className="ml-auto h-6 px-2 text-xs gap-1.5 border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
              onClick={() => { setNotifySession(null); setNotifyMessage(""); setNotifyOpen(true); }}
            >
              <Bell className="w-3 h-3" /> Send Notification
            </Button>
            <span className="text-[10px] text-muted-foreground/50 font-normal">Refreshes every 15s</span>
          </CardTitle>
        </CardHeader>
        {sessions.length === 0 ? (
          <div className="px-4 py-8 text-xs text-muted-foreground/50 text-center">
            No active players right now. They appear here while your script is running.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-white/5">
                <TableHead>Player</TableHead>
                <TableHead>Client ID</TableHead>
                <TableHead>Executor</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Last Ping</TableHead>
                <TableHead className="text-right w-[220px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map(s => {
                const placeUrl = s.robloxPlaceId ? `https://www.roblox.com/games/${s.robloxPlaceId}` : null;
                const joinUrl = s.robloxPlaceId && s.robloxJobId
                  ? `roblox://experiences/start?placeId=${s.robloxPlaceId}&gameInstanceId=${s.robloxJobId}`
                  : null;
                const isBannedIp = bannedIds.has(s.executorId);
                const isBannedCid = s.robloxClientId ? bannedIds.has(`cid:${s.robloxClientId}`) : false;
                const isBanned = isBannedIp || isBannedCid;

                return (
                  <TableRow key={s.id} className="border-white/5 hover:bg-white/[0.02]">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {s.robloxThumbnailUrl ? (
                          <img src={s.robloxThumbnailUrl} alt="" className="w-8 h-8 rounded-full border border-white/10 object-cover shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] text-muted-foreground shrink-0">
                            {(s.robloxUsername ?? s.executorId).slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-sm">{s.robloxUsername ?? <span className="font-mono text-xs text-muted-foreground">{s.executorId}</span>}</div>
                          {s.robloxUserId && <div className="text-[10px] text-muted-foreground/50">ID: {s.robloxUserId}</div>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground/60 max-w-[120px] truncate">
                      {s.robloxClientId ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground/60">{s.robloxExecutor ?? "—"}</TableCell>
                    <TableCell className="text-xs">{s.country ?? "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(s.lastPingAt), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {placeUrl && (
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-muted-foreground/50 hover:text-sky-400 gap-1" asChild>
                            <a href={placeUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-3 h-3" /> Place
                            </a>
                          </Button>
                        )}
                        {joinUrl && (
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-muted-foreground/50 hover:text-green-400 gap-1" asChild>
                            <a href={joinUrl}>
                              <LogIn className="w-3 h-3" /> Join
                            </a>
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs text-muted-foreground/50 hover:text-amber-400 hover:bg-amber-500/10 gap-1"
                          onClick={() => openNotifyDialog(s)}
                        >
                          <Bell className="w-3 h-3" /> Notify
                        </Button>
                        {isBanned ? (
                          <Badge variant="outline" className="text-[9px] border-red-500/20 text-red-400 bg-red-500/10 px-1.5">Banned</Badge>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs text-muted-foreground/50 hover:text-orange-400 hover:bg-orange-500/10 gap-1"
                              onClick={() => kickMutation.mutate(s.id)}
                              disabled={kickMutation.isPending}
                            >
                              <UserX className="w-3 h-3" /> Kick
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs text-muted-foreground/50 hover:text-red-400 hover:bg-red-500/10 gap-1"
                              onClick={() => banMutation.mutate(s.robloxClientId ? `cid:${s.robloxClientId}` : s.executorId)}
                              disabled={banMutation.isPending}
                            >
                              <Ban className="w-3 h-3" /> Ban
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left column: stats + bans + source */}
        <div className="space-y-4">
          <Card className="border-white/5 bg-card/50 shadow-none">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Telemetry</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              <div>
                <div className="text-3xl font-bold font-mono">{script.executions.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Total executions</div>
              </div>
              <div className="h-px bg-white/5" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-base font-semibold text-green-500 font-mono">{script.successCount.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">Success</div>
                </div>
                <div>
                  <div className="text-base font-semibold text-red-500 font-mono">{script.failureCount.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">Failed</div>
                </div>
              </div>
              {successRate !== null && (
                <>
                  <div className="h-px bg-white/5" />
                  <div>
                    <div className="text-base font-semibold font-mono">{successRate}%</div>
                    <div className="text-xs text-muted-foreground">Success rate</div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Banned Executors */}
          <Card className="border-white/5 bg-card/50 shadow-none overflow-hidden">
            <CardHeader className="py-3 px-4 border-b border-white/5 bg-black/20">
              <CardTitle className="text-sm flex items-center gap-2">
                <ShieldX className="w-4 h-4 text-muted-foreground" />
                Banned Executors
                {bans.length > 0 && (
                  <Badge variant="outline" className="ml-auto text-[10px] border-red-500/20 text-red-400 bg-red-500/10">
                    {bans.length}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {bans.length === 0 ? (
                <div className="px-4 py-6 text-xs text-muted-foreground/50 text-center">No executors banned.</div>
              ) : (
                <div className="divide-y divide-white/5">
                  {bans.map(b => (
                    <div key={b.id} className="flex items-center justify-between px-4 py-2.5 gap-2">
                      <div className="min-w-0">
                        <div className="font-mono text-xs text-muted-foreground truncate">{b.executorId}</div>
                        <div className="text-[10px] text-muted-foreground/50 mt-0.5">
                          {formatDistanceToNow(new Date(b.createdAt), { addSuffix: true })}
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" className="h-6 px-2 text-xs text-muted-foreground hover:text-red-400 shrink-0" onClick={() => unbanMutation.mutate(b.executorId)} disabled={unbanMutation.isPending}>
                        Unban
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Execution Logs */}
        <div className="md:col-span-2">
          <Card className="border-white/5 bg-card/50 shadow-none overflow-hidden">
            <CardHeader className="py-3 px-4 border-b border-white/5 bg-black/20">
              <CardTitle className="text-sm flex items-center gap-2">
                <Terminal className="w-4 h-4 text-muted-foreground" />
                Execution Logs
              </CardTitle>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-white/5">
                  <TableHead className="w-[70px]">Status</TableHead>
                  <TableHead>Executor / Roblox User</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead className="text-right">Time</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logsLoading ? (
                  <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground text-sm">Loading...</TableCell></TableRow>
                ) : logs && logs.length > 0 ? (
                  logs.map((log) => {
                    const isBanned = bannedIds.has(log.executorId);
                    return (
                      <TableRow key={log.id} className="border-white/5 hover:bg-white/[0.02]">
                        <TableCell>
                          {log.status === "success"
                            ? <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-green-500/10 text-green-500 uppercase">PASS</span>
                            : <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-red-500/10 text-red-500 uppercase">FAIL</span>
                          }
                        </TableCell>
                        <TableCell>
                          <div className="font-mono text-xs">{log.executorId}</div>
                          {(log as any).robloxUsername && (
                            <div className="text-[10px] text-muted-foreground/60 mt-0.5">
                              {(log as any).robloxUsername}
                              {(log as any).robloxUserId && ` · ${(log as any).robloxUserId}`}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{(log as any).country ?? "—"}</TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                        </TableCell>
                        <TableCell>
                          {isBanned ? (
                            <Badge variant="outline" className="text-[9px] border-red-500/20 text-red-400 bg-red-500/10">Banned</Badge>
                          ) : (
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-muted-foreground/40 hover:text-red-400" title="Ban this executor" onClick={() => banMutation.mutate(log.executorId)} disabled={banMutation.isPending}>
                              <Ban className="w-3 h-3" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground text-sm">
                      No executions recorded yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>

      {/* Key System Preview */}
      <KeySystemPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        scriptName={script.name}
        serviceName={script.service ?? undefined}
      />

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-card border-white/10 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-mono">Edit Script</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-widest">Name</Label>
                <Input value={editName} onChange={e => setEditName(e.target.value)} className="bg-background/50 border-white/10 font-mono text-sm" placeholder="Script name" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-widest">Game / Service</Label>
                <Input value={editService} onChange={e => setEditService(e.target.value)} className="bg-background/50 border-white/10 font-mono text-sm" placeholder="e.g. Blox Fruits" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-widest">Description</Label>
              <Input value={editDesc} onChange={e => setEditDesc(e.target.value)} className="bg-background/50 border-white/10 text-sm" placeholder="Short description" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-widest">Source Code</Label>
              <p className="text-[11px] text-amber-500/80">Updating source code will invalidate the current key. You must regenerate the key to redeploy.</p>
              <Textarea value={editCode} onChange={e => setEditCode(e.target.value)} className="bg-background/50 border-white/10 font-mono text-xs h-48 resize-none" placeholder="-- Paste your Lua source here" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="border-white/10" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={() => updateScript.mutate({ id: script.id, data: { name: editName, description: editDesc || undefined, code: editCode || undefined, service: editService || undefined } })} disabled={updateScript.isPending || !editName.trim()}>
              {updateScript.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notify Dialog — individual (notifySession set) or broadcast (notifySession null) */}
      <Dialog open={notifyOpen} onOpenChange={(open) => { setNotifyOpen(open); if (!open) { setNotifyMessage(""); setNotifySession(null); } }}>
        <DialogContent className="bg-card border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" />
              {notifySession ? "Send In-Game Notification" : "Broadcast Notification"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              {notifySession ? (
                <>Message will appear as a Roblox system notification to{" "}
                <span className="font-semibold text-foreground">
                  {notifySession.robloxUsername ?? notifySession.executorId}
                </span>{" "}
                within 30 seconds.</>
              ) : (
                <>Message will be sent to all <span className="font-semibold text-foreground">{sessions.length} currently active player(s)</span> and appear in-game within 30 seconds.</>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-widest">Message</Label>
              <Textarea
                value={notifyMessage}
                onChange={e => setNotifyMessage(e.target.value)}
                className="bg-background/50 border-white/10 text-sm resize-none h-24"
                placeholder="Type your message here... (max 200 chars)"
                maxLength={200}
                autoFocus
              />
              <div className="text-[11px] text-muted-foreground/50 text-right">{notifyMessage.length}/200</div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="border-white/10" onClick={() => setNotifyOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                if (!notifyMessage.trim()) return;
                if (notifySession) {
                  notifyMutation.mutate({ sessionId: notifySession.id, message: notifyMessage });
                } else {
                  broadcastMutation.mutate(notifyMessage);
                }
              }}
              disabled={notifyMutation.isPending || broadcastMutation.isPending || !notifyMessage.trim()}
              className="gap-1.5"
            >
              <Bell className="w-3.5 h-3.5" />
              {(notifyMutation.isPending || broadcastMutation.isPending)
                ? "Sending..."
                : notifySession ? "Send Notification" : `Broadcast to ${sessions.length} Player(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return status === "active"
    ? <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-[11px] px-2">Active</Badge>
    : <Badge className="bg-white/5 text-muted-foreground border-white/10 text-[11px] px-2">Inactive</Badge>;
}

function ProtectionBadge({ status }: { status: string }) {
  if (status === "complete") return <Badge className="bg-primary/10 text-primary border-primary/20 text-[11px] px-2">Protected</Badge>;
  if (status === "pending") return <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[11px] px-2">Pending</Badge>;
  return <Badge className="bg-white/5 text-muted-foreground border-white/10 text-[11px] px-2">Unprotected</Badge>;
}
