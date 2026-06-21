import { useListLogs } from "@workspace/api-client-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { format } from "date-fns";
import {
  CheckCircle2, XCircle, Terminal, Hash, Monitor, Clock,
  User, Cpu, ShieldBan, Ban
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import React from "react";
import type { ExecutionLog } from "@workspace/api-client-react";

type RichLog = ExecutionLog & {
  robloxUsername?: string | null;
  robloxUserId?: string | null;
  robloxClientId?: string | null;
  robloxThumbnailUrl?: string | null;
  robloxExecutor?: string | null;
};

function AvatarImage({ url, username }: { url?: string | null; username?: string | null }) {
  const [errored, setErrored] = React.useState(false);
  const initials = username ? username.slice(0, 2).toUpperCase() : "??";

  if (!url || errored) {
    return (
      <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-sm font-bold text-muted-foreground select-none">
        {initials}
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={username ?? "Roblox avatar"}
      className="w-14 h-14 rounded-full border border-white/10 object-cover"
      onError={() => setErrored(true)}
    />
  );
}

function BanButton({
  scriptId,
  executorId,
  label,
  variant = "ip",
  onBanned,
}: {
  scriptId: number;
  executorId: string;
  label: string;
  variant?: "ip" | "clientid";
  onBanned?: () => void;
}) {
  const [loading, setLoading] = React.useState(false);
  const [done, setDone] = React.useState(false);

  async function handleBan() {
    setLoading(true);
    try {
      await fetch(`/api/scripts/${scriptId}/bans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ executorId, reason: `Banned via Logs (${variant})` }),
      });
      setDone(true);
      onBanned?.();
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-red-400">
        <Ban className="w-3 h-3" /> Banned
      </div>
    );
  }

  return (
    <Button
      size="sm"
      variant="destructive"
      className="h-6 text-[11px] px-2 py-0"
      disabled={loading}
      onClick={handleBan}
    >
      {loading ? "..." : label}
    </Button>
  );
}

function IpPopover({ log }: { log: RichLog }) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="font-mono text-xs text-muted-foreground hover:text-foreground hover:underline underline-offset-4 decoration-primary/50 transition-colors cursor-pointer">
          {log.executorId}
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="right"
        align="start"
        className="w-80 p-0 bg-[#0d0d12] border border-white/10 shadow-xl"
      >
        {/* Header: avatar + username */}
        <div className="px-4 py-3 border-b border-white/10 bg-white/[0.03] flex items-center gap-3">
          <AvatarImage url={log.robloxThumbnailUrl} username={log.robloxUsername} />
          <div className="min-w-0">
            <p className="font-semibold text-sm text-foreground truncate">
              {log.robloxUsername ?? "Unknown User"}
            </p>
            {log.robloxUserId && (
              <p className="font-mono text-[10px] text-muted-foreground/60 mt-0.5">
                UID: {log.robloxUserId}
              </p>
            )}
            {log.robloxExecutor && (
              <Badge variant="outline" className="mt-1 text-[9px] border-violet-500/30 text-violet-400 bg-violet-500/10 py-0">
                {log.robloxExecutor}
              </Badge>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="p-3 space-y-2">
          <DetailRow icon={<Monitor className="w-3.5 h-3.5" />} label="IP Address" value={log.executorId} mono />
          <DetailRow icon={<User className="w-3.5 h-3.5" />} label="Roblox Username" value={log.robloxUsername ?? null} mono />
          <DetailRow icon={<Hash className="w-3.5 h-3.5" />} label="User ID" value={log.robloxUserId ?? null} mono />
          <DetailRow icon={<Hash className="w-3.5 h-3.5" />} label="Client ID" value={log.robloxClientId ?? null} mono small />
          <DetailRow icon={<Cpu className="w-3.5 h-3.5" />} label="Executor" value={log.robloxExecutor ?? null} />
          <DetailRow icon={<Clock className="w-3.5 h-3.5" />} label="Last Seen" value={format(new Date(log.createdAt), "MMM d, yyyy HH:mm:ss")} mono />
        </div>

        {/* Ban buttons */}
        <div className="px-3 pb-3 pt-1 space-y-1.5 border-t border-white/10 mt-1">
          <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider mb-2 pt-2">Ban</p>
          <div className="flex gap-2 flex-wrap">
            <BanButton
              scriptId={log.scriptId}
              executorId={log.executorId}
              label="Ban IP"
              variant="ip"
              onBanned={() => setOpen(false)}
            />
            {log.robloxClientId && (
              <BanButton
                scriptId={log.scriptId}
                executorId={`cid:${log.robloxClientId}`}
                label="Ban Client ID"
                variant="clientid"
                onBanned={() => setOpen(false)}
              />
            )}
          </div>
        </div>

        <div className="px-3 py-2 border-t border-white/10 bg-white/[0.02]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] text-muted-foreground/50 shrink-0">Script</span>
            <span className="font-mono text-[10px] text-muted-foreground truncate">{log.scriptName}</span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function DetailRow({
  icon, label, value, mono = false, small = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null | undefined;
  mono?: boolean;
  small?: boolean;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="text-muted-foreground mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-0.5">{label}</p>
        {value ? (
          <p className={`${mono ? "font-mono" : ""} ${small ? "text-[10px]" : "text-xs"} text-foreground break-all`}>
            {value}
          </p>
        ) : (
          <p className="font-mono text-xs text-muted-foreground/30">—</p>
        )}
      </div>
    </div>
  );
}

export default function Logs() {
  const [statusFilter, setStatusFilter] = React.useState<string>("all");

  const { data: logs, isLoading } = useListLogs({
    status: statusFilter !== "all" ? (statusFilter as "success" | "failed") : undefined,
    limit: 100,
  });

  return (
    <div className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Execution Logs</h1>
          <p className="text-muted-foreground mt-1">All script executions across your account.</p>
        </div>
      </div>

      <div className="max-w-xs">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="bg-background/50 border-white/10">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Executions</SelectItem>
            <SelectItem value="success">Success Only</SelectItem>
            <SelectItem value="failed">Failures Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border border-white/10 rounded-md bg-card/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-white/10 bg-black/20">
              <TableHead className="w-[36px]"></TableHead>
              <TableHead>Script</TableHead>
              <TableHead>Executor IP</TableHead>
              <TableHead>Roblox User</TableHead>
              <TableHead>Executor</TableHead>
              <TableHead className="text-right">Duration</TableHead>
              <TableHead className="text-right">Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-4 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : logs && logs.length > 0 ? (
              (logs as RichLog[]).map((log) => (
                <TableRow key={log.id} className="border-white/5 hover:bg-white/[0.02]">
                  <TableCell>
                    {log.status === "success"
                      ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                      : <XCircle className="w-4 h-4 text-red-500" />}
                  </TableCell>
                  <TableCell>
                    <Link href={`/scripts/${log.scriptId}`}
                      className="font-mono font-medium hover:underline decoration-primary underline-offset-4 text-sm">
                      {log.scriptName}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <IpPopover log={log} />
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {log.robloxUsername ? (
                      <span className="flex items-center gap-1.5">
                        {log.robloxThumbnailUrl && (
                          <img
                            src={log.robloxThumbnailUrl}
                            alt=""
                            className="w-5 h-5 rounded-full border border-white/10 inline-block shrink-0"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                        )}
                        <span>{log.robloxUsername}</span>
                        {log.robloxUserId && (
                          <Badge variant="outline" className="text-[9px] border-white/10 text-muted-foreground/50 py-0">
                            {log.robloxUserId}
                          </Badge>
                        )}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/25">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {log.robloxExecutor ? (
                      <Badge variant="outline" className="text-[10px] border-violet-500/30 text-violet-400 bg-violet-500/10 font-mono">
                        {log.robloxExecutor}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground/25 text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs text-muted-foreground">
                    {log.duration ? `${log.duration}ms` : "—"}
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(log.createdAt), "MMM d, yyyy HH:mm:ss")}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-48 text-center text-muted-foreground">
                  <Terminal className="w-8 h-8 mb-2 opacity-20 mx-auto" />
                  <p>No execution logs yet.</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
