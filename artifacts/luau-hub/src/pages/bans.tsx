import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ShieldBan, ShieldCheck, Network, Cpu, Trash2, RefreshCw, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

interface BanEntry {
  id: number;
  scriptId: number;
  scriptName: string;
  executorId: string;
  banType: "ip" | "clientid";
  reason: string | null;
  createdAt: string;
}

interface ScriptItem {
  id: number;
  name: string;
}

export default function Bans() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [typeFilter, setTypeFilter] = React.useState<string>("all");

  const { data: bans = [], isLoading, refetch } = useQuery<BanEntry[]>({
    queryKey: ["/api/bans"],
    queryFn: async () => {
      const r = await fetch("/api/bans");
      if (!r.ok) return [];
      return r.json();
    },
  });

  async function unban(ban: BanEntry) {
    try {
      const res = await fetch(
        `/api/scripts/${ban.scriptId}/bans/${encodeURIComponent(ban.executorId)}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error();
      qc.invalidateQueries({ queryKey: ["/api/bans"] });
      toast({ title: "Executor unbanned", description: ban.executorId });
    } catch {
      toast({ title: "Failed to unban", variant: "destructive" });
    }
  }

  const filtered = typeFilter === "all" ? bans : bans.filter((b) => b.banType === typeFilter);

  const ipCount = bans.filter((b) => b.banType === "ip").length;
  const cidCount = bans.filter((b) => b.banType === "clientid").length;

  return (
    <div className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bans</h1>
          <p className="text-muted-foreground mt-1">All banned IPs and Client IDs across your scripts.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="border-white/10 shrink-0" onClick={() => refetch()}>
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh
          </Button>
          <AddBanDialog onSuccess={() => qc.invalidateQueries({ queryKey: ["/api/bans"] })} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="rounded-lg border border-white/10 bg-card/50 p-4">
          <div className="text-2xl font-bold font-mono">{bans.length}</div>
          <div className="text-xs text-muted-foreground mt-1">Total Bans</div>
        </div>
        <div className="rounded-lg border border-white/10 bg-card/50 p-4">
          <div className="text-2xl font-bold font-mono text-orange-400">{ipCount}</div>
          <div className="text-xs text-muted-foreground mt-1">IP Bans</div>
        </div>
        <div className="rounded-lg border border-white/10 bg-card/50 p-4">
          <div className="text-2xl font-bold font-mono text-violet-400">{cidCount}</div>
          <div className="text-xs text-muted-foreground mt-1">Client ID Bans</div>
        </div>
      </div>

      {/* Filter */}
      <div className="max-w-xs">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="bg-background/50 border-white/10">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Bans</SelectItem>
            <SelectItem value="ip">IP Bans Only</SelectItem>
            <SelectItem value="clientid">Client ID Bans Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border border-white/10 rounded-md bg-card/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-white/10 bg-black/20">
              <TableHead className="w-[100px]">Type</TableHead>
              <TableHead>Banned ID</TableHead>
              <TableHead>Script</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead className="text-right">Banned At</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                </TableRow>
              ))
            ) : filtered.length > 0 ? (
              filtered.map((ban) => {
                const displayId = ban.banType === "clientid"
                  ? ban.executorId.slice(4)
                  : ban.executorId;

                return (
                  <TableRow key={ban.id} className="border-white/5 hover:bg-white/[0.02]">
                    <TableCell>
                      {ban.banType === "ip" ? (
                        <Badge variant="outline" className="border-orange-500/30 text-orange-400 bg-orange-500/10 text-[10px] gap-1">
                          <Network className="w-2.5 h-2.5" /> IP
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-violet-500/30 text-violet-400 bg-violet-500/10 text-[10px] gap-1">
                          <Cpu className="w-2.5 h-2.5" /> Client ID
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground break-all max-w-[200px]">
                      {displayId}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/scripts/${ban.scriptId}`}
                        className="font-mono text-xs hover:underline underline-offset-4 decoration-primary"
                      >
                        {ban.scriptName}
                      </Link>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground/60">
                      {ban.reason ?? "—"}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(ban.createdAt), "MMM d, yyyy HH:mm")}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs text-muted-foreground/50 hover:text-green-400 hover:bg-green-500/10 gap-1"
                        onClick={() => unban(ban)}
                      >
                        <ShieldCheck className="w-3 h-3" /> Unban
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                  <ShieldBan className="w-8 h-8 mb-2 opacity-20 mx-auto" />
                  <p>{typeFilter === "all" ? "No bans yet." : `No ${typeFilter === "ip" ? "IP" : "Client ID"} bans.`}</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function AddBanDialog({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [scriptId, setScriptId] = React.useState("");
  const [banType, setBanType] = React.useState("ip");
  const [value, setValue] = React.useState("");
  const [reason, setReason] = React.useState("");

  const { data: scripts = [] } = useQuery<ScriptItem[]>({
    queryKey: ["/api/scripts"],
    queryFn: async () => {
      const r = await fetch("/api/scripts");
      if (!r.ok) return [];
      const data = await r.json();
      return data.map((s: any) => ({ id: s.id, name: s.name }));
    },
    enabled: open,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!scriptId || !value) return;
    setLoading(true);
    try {
      const res = await fetch("/api/bans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scriptId: Number(scriptId),
          banType,
          value: value.trim(),
          reason: reason.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed");
      }
      toast({ title: "Ban added", description: `${banType === "ip" ? "IP" : "Client ID"} ${value} banned.` });
      onSuccess();
      setOpen(false);
      setScriptId(""); setBanType("ip"); setValue(""); setReason("");
    } catch (err: any) {
      toast({ title: "Failed to add ban", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="shrink-0 shadow-[0_0_12px_-4px_var(--color-primary)]">
          <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Ban
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px] bg-[#0d0d12] border-white/10">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Manual Ban</DialogTitle>
            <DialogDescription>
              Ban an IP address or Client ID from one of your scripts.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-5">
            <div className="space-y-1.5">
              <Label>Script</Label>
              <Select value={scriptId} onValueChange={setScriptId} required>
                <SelectTrigger className="bg-black/50 border-white/10">
                  <SelectValue placeholder="Select a script…" />
                </SelectTrigger>
                <SelectContent>
                  {scripts.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Ban Type</Label>
              <Select value={banType} onValueChange={setBanType}>
                <SelectTrigger className="bg-black/50 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ip">
                    <span className="flex items-center gap-2"><Network className="w-3.5 h-3.5 text-orange-400" /> IP Address</span>
                  </SelectItem>
                  <SelectItem value="clientid">
                    <span className="flex items-center gap-2"><Cpu className="w-3.5 h-3.5 text-violet-400" /> Client ID</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{banType === "ip" ? "IP Address" : "Client ID"}</Label>
              <Input
                value={value}
                onChange={e => setValue(e.target.value)}
                placeholder={banType === "ip" ? "e.g. 192.168.1.1" : "e.g. ABC123XYZ"}
                className="font-mono bg-black/50 border-white/10"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Reason <span className="text-muted-foreground">(optional)</span></Label>
              <Input
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="e.g. Cheating"
                className="bg-black/50 border-white/10"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading || !scriptId || !value} className="bg-red-600 hover:bg-red-700">
              {loading ? "Banning…" : "Ban"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
