import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  useListScripts, useCreateScript, getListScriptsQueryKey,
  useToggleScript, useDeleteScript, useObfuscateScript
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, MoreHorizontal, Play, Square, Trash2, Key, Code2, Webhook, ChevronDown, LayoutGrid } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useServices } from "@/hooks/use-services";
import React from "react";

export default function Scripts() {
  const [search, setSearch] = React.useState("");
  const { data: scripts, isLoading } = useListScripts({ search: search || undefined });

  return (
    <div className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Scripts</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Upload your Lua source, generate a key, and deploy the loadstring to your executor.
          </p>
        </div>
        <CreateScriptDialog />
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search scripts..."
          className="pl-9 bg-background/50 border-white/10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          data-testid="input-search"
        />
      </div>

      <div className="border border-white/10 rounded-md bg-card/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-white/10">
              <TableHead>Script</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Protection</TableHead>
              <TableHead>Webhook</TableHead>
              <TableHead className="text-right">Executions</TableHead>
              <TableHead className="text-right">Updated</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-4 w-10 ml-auto" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                  <TableCell />
                </TableRow>
              ))
            ) : scripts && scripts.length > 0 ? (
              scripts.map((script) => (
                <TableRow
                  key={script.id}
                  className="border-white/5 hover:bg-white/[0.02] cursor-pointer"
                  data-testid={`row-script-${script.id}`}
                >
                  <TableCell>
                    <Link href={`/scripts/${script.id}`} className="font-mono font-medium hover:underline decoration-primary underline-offset-4">
                      {script.name}
                    </Link>
                    {script.service && (
                      <div className="text-xs text-muted-foreground/60 mt-0.5 font-mono">{script.service}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={
                      script.status === "active"
                        ? "bg-green-500/10 text-green-500 border-green-500/20"
                        : "bg-muted text-muted-foreground border-transparent"
                    }>
                      {script.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <ProtectionBadge status={script.obfuscationStatus} />
                  </TableCell>
                  <TableCell>
                    {(script as any).webhookUrl ? (
                      <Badge variant="outline" className="bg-sky-500/10 text-sky-400 border-sky-500/20 text-[10px] gap-1">
                        <Webhook className="w-2.5 h-2.5" />
                        {(script as any).webhookLogsEnabled ? "Logging" : "Silent"}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground/40">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-muted-foreground">
                    {script.executions.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    {format(new Date(script.updatedAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <ScriptActions scriptId={script.id} status={script.status} obfStatus={script.obfuscationStatus} />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-48 text-center" data-testid="text-empty-state">
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <Code2 className="w-8 h-8 opacity-30" />
                    <div>
                      <div className="text-sm font-medium">{search ? "No scripts found." : "No scripts yet."}</div>
                      {!search && (
                        <div className="text-xs mt-1 opacity-70">Click 'New Script' to upload your first Lua source.</div>
                      )}
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function ProtectionBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending:    { label: "No key",      cls: "bg-muted text-muted-foreground border-transparent" },
    processing: { label: "Processing",  cls: "bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse" },
    complete:   { label: "Protected",   cls: "bg-primary/10 text-primary border-primary/20" },
    failed:     { label: "Failed",      cls: "bg-red-500/10 text-red-500 border-red-500/20" },
  };
  const s = map[status] ?? map.pending;
  return <Badge variant="outline" className={s.cls}>{s.label}</Badge>;
}

function ScriptActions({ scriptId, status, obfStatus }: { scriptId: number; status: string; obfStatus: string }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const toggle = useToggleScript({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListScriptsQueryKey() }) }
  });

  const protect = useObfuscateScript({
    mutation: {
      onSuccess: () => {
        toast({ title: "Key generated", description: "Open the script to copy your loadstring." });
        queryClient.invalidateQueries({ queryKey: getListScriptsQueryKey() });
      }
    }
  });

  const del = useDeleteScript({
    mutation: {
      onSuccess: () => {
        toast({ title: "Script deleted" });
        queryClient.invalidateQueries({ queryKey: getListScriptsQueryKey() });
      }
    }
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`button-actions-${scriptId}`}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[170px]">
        <DropdownMenuItem onClick={() => toggle.mutate({ id: scriptId })} data-testid={`action-toggle-${scriptId}`}>
          {status === "active"
            ? <><Square className="w-4 h-4 mr-2" /> Disable</>
            : <><Play className="w-4 h-4 mr-2" /> Enable</>}
        </DropdownMenuItem>
        {obfStatus !== "processing" && (
          <DropdownMenuItem onClick={() => protect.mutate({ id: scriptId })} data-testid={`action-protect-${scriptId}`}>
            <Key className="w-4 h-4 mr-2" />
            {obfStatus === "complete" ? "Regenerate key" : "Generate key"}
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-red-500 focus:text-red-500 focus:bg-red-500/10"
          onClick={() => {
            if (confirm("Delete this script? This cannot be undone.")) del.mutate({ id: scriptId });
          }}
          data-testid={`action-delete-${scriptId}`}
        >
          <Trash2 className="w-4 h-4 mr-2" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ServiceSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { services } = useServices();
  const selected = services.find((s) => s.name === value);

  if (services.length === 0) {
    return (
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. Blox Fruits"
        className="font-mono bg-black/50 border-white/10"
        data-testid="input-script-service"
      />
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          data-testid="input-script-service"
          className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md border border-white/10 bg-black/50 text-sm text-left hover:border-white/20 transition-colors focus:outline-none focus:ring-1 focus:ring-primary/40"
        >
          {selected ? (
            <span className="flex items-center gap-2 min-w-0">
              <LayoutGrid className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="font-mono truncate">{selected.name}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">Select a service…</span>
          )}
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[180px]" align="start">
        <DropdownMenuItem
          onClick={() => onChange("")}
          className={!value ? "bg-primary/10 text-primary" : ""}
        >
          <span className="text-muted-foreground italic">None</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {services.map((svc) => (
          <DropdownMenuItem
            key={svc.id}
            onClick={() => onChange(svc.name)}
            className={value === svc.name ? "bg-primary/10 text-primary" : ""}
          >
            <LayoutGrid className="w-3.5 h-3.5 mr-2 shrink-0" />
            {svc.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function CreateScriptDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [service, setService] = useState("");
  const [desc, setDesc] = useState("");
  const [code, setCode] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookLogsEnabled, setWebhookLogsEnabled] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const create = useCreateScript({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getListScriptsQueryKey() });
        setOpen(false);
        setName(""); setService(""); setDesc(""); setCode("");
        setWebhookUrl(""); setWebhookLogsEnabled(false);
        if (code && data.obfuscationStatus === "complete") {
          toast({ title: "Script protected & ready", description: "Log collector injected automatically — your loadstring is ready." });
        } else {
          toast({ title: "Script uploaded", description: code ? "Generating key…" : "Add code and generate a key to deploy." });
        }
        setLocation(`/scripts/${data.id}`);
      },
      onError: () => toast({ variant: "destructive", title: "Failed to upload script" })
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    create.mutate({
      data: {
        name,
        service: service || undefined,
        description: desc || undefined,
        code: code || undefined,
        ...(webhookUrl ? { webhookUrl, webhookLogsEnabled } : {}),
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="shadow-[0_0_15px_-5px_var(--color-primary)]" data-testid="button-new-script">
          <Plus className="w-4 h-4 mr-2" /> New Script
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[640px] bg-[#0d0d12] border-white/10">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Upload Lua Script</DialogTitle>
            <DialogDescription>
              Paste your raw Lua source. After upload, generate a key to get the loadstring your executor uses.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Script Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. ESP_Module_v3"
                  className="font-mono bg-black/50 border-white/10"
                  required
                  data-testid="input-script-name"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Service</Label>
                <ServiceSelector value={service} onChange={setService} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="desc">Description</Label>
              <Input
                id="desc"
                value={desc}
                onChange={e => setDesc(e.target.value)}
                placeholder="What does this script do?"
                className="bg-black/50 border-white/10"
                data-testid="input-script-desc"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="code">Lua Source Code</Label>
              <Textarea
                id="code"
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder={`-- Paste your Lua source here\nlocal Players = game:GetService("Players")\nlocal lp = Players.LocalPlayer\n\nprint("Hello from LuauHub!")`}
                className="min-h-[180px] font-mono text-sm bg-black/60 border-white/10 resize-none"
                data-testid="textarea-script-code"
              />
            </div>

            {/* Webhook Section */}
            <div className="space-y-3 rounded-lg border border-white/8 bg-sky-500/5 p-4">
              <div className="flex items-center gap-2">
                <Webhook className="w-4 h-4 text-sky-400" />
                <Label className="text-sky-400 font-medium">Webhook <span className="text-muted-foreground font-normal">(optional)</span></Label>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="webhookUrl" className="text-xs text-muted-foreground">Discord / HTTP Webhook URL</Label>
                <Input
                  id="webhookUrl"
                  type="url"
                  value={webhookUrl}
                  onChange={e => setWebhookUrl(e.target.value)}
                  placeholder="https://discord.com/api/webhooks/…"
                  className="font-mono text-xs bg-black/50 border-white/10"
                />
                <p className="text-[11px] text-muted-foreground/60">
                  The URL is stored server-side and never exposed in your loadstring.
                </p>
              </div>
              {webhookUrl && (
                <div className="flex items-center gap-3 pt-1">
                  <Switch
                    id="webhookLogs"
                    checked={webhookLogsEnabled}
                    onCheckedChange={setWebhookLogsEnabled}
                  />
                  <Label htmlFor="webhookLogs" className="text-sm cursor-pointer">
                    Send execution logs to webhook
                  </Label>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={create.isPending || !name} data-testid="button-submit-script">
              {create.isPending ? "Uploading..." : "Upload Script"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
