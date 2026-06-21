import { useState, useMemo, useEffect } from "react";
import {
  KeyRound, Plus, Star, Clock, Copy, Trash2, Edit, Download,
  Search, ChevronDown, LayoutGrid, AlignJustify, SlidersHorizontal,
  CheckCircle2, XCircle, AlertCircle, MinusCircle, Settings, RefreshCw,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useKeys, type Key, type KeyStatus } from "@/hooks/use-keys";
import { useProviders } from "@/hooks/use-providers";
import { useServices } from "@/hooks/use-services";
import { useToast } from "@/hooks/use-toast";

type Tab = "standard" | "premium" | "generated";
type StatusFilter = "all" | KeyStatus;
type ViewMode = "list" | "grid";

const VALIDITY_PRESETS = [
  { label: "1h",  minutes: 60 },
  { label: "24h", minutes: 1440 },
  { label: "7d",  minutes: 10080 },
  { label: "30d", minutes: 43200 },
  { label: "90d", minutes: 129600 },
];

function statusBadge(status: KeyStatus) {
  switch (status) {
    case "active":   return <Badge variant="outline" className="bg-blue-500/15 text-blue-400 border-blue-500/20 text-[10px] gap-1"><CheckCircle2 className="w-2.5 h-2.5" /> Active</Badge>;
    case "used":     return <Badge variant="outline" className="bg-muted text-muted-foreground border-white/10 text-[10px] gap-1"><MinusCircle className="w-2.5 h-2.5" /> Used</Badge>;
    case "expired":  return <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20 text-[10px] gap-1"><XCircle className="w-2.5 h-2.5" /> Expired</Badge>;
    case "disabled": return <Badge variant="outline" className="bg-muted text-muted-foreground border-white/10 text-[10px] gap-1"><AlertCircle className="w-2.5 h-2.5" /> Disabled</Badge>;
  }
}

function genStatusBadge(expiresAt: string, lastUsedAt: string | null) {
  const expired = new Date(expiresAt) < new Date();
  if (expired) return <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20 text-[10px] gap-1"><XCircle className="w-2.5 h-2.5" /> Expired</Badge>;
  if (lastUsedAt) return <Badge variant="outline" className="bg-green-500/15 text-green-400 border-green-500/20 text-[10px] gap-1"><CheckCircle2 className="w-2.5 h-2.5" /> Verified</Badge>;
  return <Badge variant="outline" className="bg-blue-500/15 text-blue-400 border-blue-500/20 text-[10px] gap-1"><CheckCircle2 className="w-2.5 h-2.5" /> Active</Badge>;
}

function timeUntil(iso: string | null, permanent: boolean): string {
  if (permanent || !iso) return "∞ Forever";
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "Expired";
  const min = Math.floor(ms / 60000);
  if (min < 60) return `in ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `in ${h}h`;
  return `in ${Math.floor(h / 24)}d`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

interface KeyFormData {
  scriptId: number | null;
  keyName: string;
  providerId: string;
  serviceId: string;
  hwid: string;
  permanent: boolean;
  premium: boolean;
  oneTimeUse: boolean;
  expiryOnFirstUse: boolean;
  noHwidBinding: boolean;
  hwidLimit: number | null;
  validityPreset: number;
  customDays: number;
  customHours: number;
  customMinutes: number;
  useCustom: boolean;
}

const DEFAULT_FORM: KeyFormData = {
  scriptId: null,
  keyName: "",
  providerId: "",
  serviceId: "",
  hwid: "",
  permanent: false,
  premium: false,
  oneTimeUse: false,
  expiryOnFirstUse: false,
  noHwidBinding: false,
  hwidLimit: null,
  validityPreset: 0,
  customDays: 0,
  customHours: 1,
  customMinutes: 0,
  useCustom: false,
};

interface ScriptOption { id: number; name: string; scriptKey: string | null; obfuscatedCode: string | null; }

function CreateKeyDialog({ open, onOpenChange, onSave }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (data: KeyFormData) => void;
}) {
  const [form, setForm] = useState<KeyFormData>(DEFAULT_FORM);
  const [scripts, setScripts] = useState<ScriptOption[]>([]);
  const { providers } = useProviders();
  const { services } = useServices();

  useEffect(() => {
    fetch("/api/scripts")
      .then((r) => r.ok ? r.json() : [])
      .then((data: ScriptOption[]) => setScripts(data))
      .catch(() => {});
  }, []);

  function patch<K extends keyof KeyFormData>(k: K, v: KeyFormData[K]) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  function handleOpenChange(v: boolean) {
    if (!v) setForm(DEFAULT_FORM);
    onOpenChange(v);
  }

  function handleSave() {
    onSave(form);
    handleOpenChange(false);
  }

  const selectedScript = scripts.find((s) => s.id === form.scriptId);
  const scriptReady = selectedScript && selectedScript.scriptKey && selectedScript.obfuscatedCode;

  function getValidityMinutes(): number {
    if (form.permanent) return 0;
    if (form.useCustom) {
      return form.customDays * 1440 + form.customHours * 60 + form.customMinutes;
    }
    return VALIDITY_PRESETS[form.validityPreset].minutes;
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[400px] bg-[#0d0d12] border-white/10 gap-0 p-0 overflow-hidden max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-row items-start gap-4 p-5 pb-4 border-b border-white/8 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0">
            <KeyRound className="w-4 h-4 text-primary" />
          </div>
          <div>
            <DialogTitle className="text-sm font-semibold">Create key</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">Manually issue a new key</DialogDescription>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {/* Script — required for Roblox key verification */}
          <div className="space-y-1.5">
            <Label className="text-xs">Script <span className="text-red-400">*</span></Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="w-full flex items-center justify-between px-3 py-2 rounded-md border border-white/10 bg-black/60 text-sm text-left hover:border-white/20 transition-colors">
                  {form.scriptId
                    ? (selectedScript?.name ?? "Unknown")
                    : <span className="text-muted-foreground">Select script</span>}
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                {scripts.length === 0
                  ? <DropdownMenuItem disabled>No scripts yet</DropdownMenuItem>
                  : scripts.map((s) => (
                    <DropdownMenuItem key={s.id} onClick={() => patch("scriptId", s.id)}>
                      <span className="flex-1 truncate">{s.name}</span>
                      {!s.obfuscatedCode && <span className="text-[10px] text-amber-400/70 ml-2 shrink-0">needs key gen</span>}
                    </DropdownMenuItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {form.scriptId && !scriptReady && (
              <p className="text-[10px] text-amber-400">
                ⚠ This script hasn't had a key generated yet. Go to Scripts and click "Generate Key" first.
              </p>
            )}
          </div>

          {/* Provider */}
          <div className="space-y-1.5">
            <Label className="text-xs">Provider</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="w-full flex items-center justify-between px-3 py-2 rounded-md border border-white/10 bg-black/60 text-sm text-left hover:border-white/20 transition-colors">
                  {form.providerId ? (providers.find((p) => p.id === form.providerId)?.name ?? "—") : <span className="text-muted-foreground">Select provider</span>}
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                {providers.length === 0
                  ? <DropdownMenuItem disabled>No providers yet</DropdownMenuItem>
                  : providers.map((p) => (
                    <DropdownMenuItem key={p.id} onClick={() => patch("providerId", p.id)}>{p.name}</DropdownMenuItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Service */}
          <div className="space-y-1.5">
            <Label className="text-xs">Service</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="w-full flex items-center justify-between px-3 py-2 rounded-md border border-white/10 bg-black/60 text-sm text-left hover:border-white/20 transition-colors">
                  {form.serviceId ? (services.find((s) => s.id === form.serviceId)?.name ?? "All") : <span className="text-muted-foreground">All</span>}
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                <DropdownMenuItem onClick={() => patch("serviceId", "")}>All</DropdownMenuItem>
                {services.map((s) => (
                  <DropdownMenuItem key={s.id} onClick={() => patch("serviceId", s.id)}>{s.name}</DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Key name */}
          <div className="space-y-1.5">
            <Label className="text-xs">Key name <span className="text-muted-foreground">(optional)</span></Label>
            <Input value={form.keyName} onChange={(e) => patch("keyName", e.target.value)}
              placeholder="Key name" className="bg-black/60 border-white/10 text-sm focus-visible:ring-primary/40" />
            <p className="text-[10px] text-muted-foreground/60">(Key name is optional)</p>
          </div>

          {/* Validity */}
          <div className="space-y-2">
            <Label className="text-xs">Validity</Label>
            <div className="flex gap-1.5 flex-wrap">
              {VALIDITY_PRESETS.map((p, i) => (
                <button
                  key={p.label}
                  type="button"
                  disabled={form.permanent}
                  onClick={() => { patch("validityPreset", i); patch("useCustom", false); }}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${
                    !form.permanent && !form.useCustom && form.validityPreset === i
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-white/[0.03] text-muted-foreground border-white/10 hover:border-white/20 disabled:opacity-30"
                  }`}
                >{p.label}</button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(["customDays", "customHours", "customMinutes"] as const).map((field, i) => (
                <div key={field} className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">{["Days", "Hours", "Minutes"][i]}</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form[field]}
                    disabled={form.permanent}
                    onChange={(e) => { patch(field, parseInt(e.target.value) || 0); patch("useCustom", true); }}
                    className="bg-black/60 border-white/10 text-center font-mono text-sm focus-visible:ring-primary/40"
                  />
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground/60">
              = {form.permanent ? "∞ (permanent)" : (() => {
                const m = getValidityMinutes();
                const h = Math.floor(m / 60);
                const rem = m % 60;
                return h > 0 ? `${h}h (${m} min)` : `${rem} min`;
              })()}
            </p>
          </div>

          {/* HWID */}
          <div className="space-y-1.5">
            <Label className="text-xs">HWID</Label>
            <Input value={form.hwid} onChange={(e) => patch("hwid", e.target.value)}
              placeholder="HWID" className="bg-black/60 border-white/10 font-mono text-sm focus-visible:ring-primary/40" />
          </div>

          {/* Toggles */}
          <div className="space-y-2">
            {([
              { key: "permanent",       label: "Forever",             icon: "⊙", color: "text-primary/70" },
              { key: "premium",         label: "Premium Key",         icon: "⭐", color: "text-amber-400" },
              { key: "oneTimeUse",      label: "One-time use keys",   icon: "🔒", color: "" },
              { key: "expiryOnFirstUse",label: "Expiry on first use", icon: "⏱", color: "text-amber-500/70", sub: "Key expires after first verification" },
              { key: "noHwidBinding",   label: "No HWID Binding",     icon: "⊗", color: "text-red-400" },
            ] as const).map(({ key, label, icon, color, sub }) => (
              <div key={key} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`${color} text-sm shrink-0`}>{icon}</span>
                  <div className="min-w-0">
                    <div className="text-xs font-medium">{label}</div>
                    {sub && <div className="text-[10px] text-muted-foreground/60">{sub}</div>}
                  </div>
                </div>
                <Switch checked={form[key] as boolean} onCheckedChange={(v) => patch(key, v)} />
              </div>
            ))}
          </div>

          {/* HWID Limit */}
          <div className="rounded-lg border border-white/8 bg-white/[0.02] p-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-primary/70 text-sm">◎</span>
              <span className="text-xs font-medium">HWID Limit</span>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">HWID Limit (optional)</Label>
              <Input
                value={form.hwidLimit ?? ""}
                onChange={(e) => patch("hwidLimit", e.target.value === "" ? null : parseInt(e.target.value))}
                placeholder="Auto"
                className="bg-black/60 border-white/10 font-mono text-sm focus-visible:ring-primary/40"
                disabled={form.noHwidBinding}
              />
              <p className="text-[10px] text-muted-foreground/60">Leave empty to use provider default</p>
            </div>
          </div>
        </div>

        <DialogFooter className="px-5 pb-5 pt-4 border-t border-white/8 shrink-0 gap-2">
          <Button variant="ghost" onClick={() => handleOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>
            <KeyRound className="w-3.5 h-3.5 mr-1.5" /> Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function KeyCard({ keyItem, providerName, onCopy, onDelete, onStatusChange }: {
  keyItem: Key;
  providerName: string;
  onCopy: () => void;
  onDelete: () => void;
  onStatusChange: (s: KeyStatus) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-white/8 bg-card/40 overflow-hidden hover:border-white/12 transition-all">
      <div className="flex items-center gap-3 p-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <code className="text-xs font-mono text-foreground/90 truncate">{keyItem.value}</code>
            {statusBadge(keyItem.status)}
            {keyItem.premium && (
              <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px] gap-1">
                <Star className="w-2.5 h-2.5" /> Premium
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1.5 text-[11px] text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> {timeUntil(keyItem.expiresAt, keyItem.permanent)}
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <LayoutGrid className="w-3 h-3" /> {providerName}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button type="button" onClick={onCopy} title="Copy" className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/[0.05] transition-colors">
            <Copy className="w-3.5 h-3.5" />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" title="Settings" className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/[0.05] transition-colors">
                <Settings className="w-3.5 h-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {(["active", "used", "expired", "disabled"] as KeyStatus[]).map((s) => (
                <DropdownMenuItem key={s} onClick={() => onStatusChange(s)} className="capitalize">
                  Set as {s}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <button type="button" onClick={() => {}} title="Edit" className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/[0.05] transition-colors">
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button type="button" onClick={onDelete} title="Delete" className="p-1.5 rounded-md text-muted-foreground hover:text-red-400 hover:bg-red-500/5 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="border-t border-white/6">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-2 w-full px-4 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Clock className="w-3 h-3" />
          <span>Show Details</span>
          <ChevronDown className={`w-3 h-3 ml-auto transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>

        {expanded && (
          <div className="px-4 pb-4 grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
            {[
              { label: "HWID",        value: keyItem.hwid || "—" },
              { label: "IP Address",  value: keyItem.ipAddress || "—" },
              { label: "User Info",   value: keyItem.userInfo || "—" },
              { label: "Created",     value: formatDate(keyItem.createdAt) },
              { label: "Last Used",   value: formatDate(keyItem.lastUsed) },
              { label: "Expires",     value: keyItem.permanent ? "Never" : formatDate(keyItem.expiresAt) },
              { label: "One-Time",    value: keyItem.oneTimeUse ? "Yes" : "No" },
              { label: "HWID Limit",  value: keyItem.noHwidBinding ? "Disabled" : String(keyItem.hwidLimit) },
            ].map(({ label, value }) => (
              <div key={label}>
                <span className="text-muted-foreground/60">{label}: </span>
                <span className="font-mono">{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface GeneratedKey {
  id: number;
  keyValue: string;
  scriptKey: string;
  scriptId: number;
  scriptName: string | null;
  hwid: string | null;
  hwidLocked: boolean;
  expiresAt: string;
  lastUsedAt: string | null;
  createdAt: string;
}

function GeneratedKeyCard({ gk, onCopy, onDelete }: {
  gk: GeneratedKey;
  onCopy: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const expired = new Date(gk.expiresAt) < new Date();

  return (
    <div className="rounded-xl border border-white/8 bg-card/40 overflow-hidden hover:border-white/12 transition-all">
      <div className="flex items-center gap-3 p-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <code className="text-xs font-mono text-foreground/90 truncate">{gk.keyValue}</code>
            {genStatusBadge(gk.expiresAt, gk.lastUsedAt)}
          </div>
          <div className="flex items-center gap-2 mt-1.5 text-[11px] text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {expired ? "Expired" : timeUntil(gk.expiresAt, false)}
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Globe className="w-3 h-3" /> {gk.scriptName ?? "Unknown Script"}
            </span>
            {gk.hwidLocked && (
              <>
                <span>·</span>
                <span className="flex items-center gap-1 text-amber-400/80">
                  🔒 HWID locked
                </span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button type="button" onClick={onCopy} title="Copy" className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/[0.05] transition-colors">
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button type="button" onClick={onDelete} title="Delete" className="p-1.5 rounded-md text-muted-foreground hover:text-red-400 hover:bg-red-500/5 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="border-t border-white/6">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-2 w-full px-4 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Clock className="w-3 h-3" />
          <span>Show Details</span>
          <ChevronDown className={`w-3 h-3 ml-auto transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>

        {expanded && (
          <div className="px-4 pb-4 grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
            {[
              { label: "HWID",       value: gk.hwid || "—" },
              { label: "Script Key", value: gk.scriptKey },
              { label: "Created",    value: formatDate(gk.createdAt) },
              { label: "Last Used",  value: formatDate(gk.lastUsedAt) },
              { label: "Expires",    value: formatDate(gk.expiresAt) },
              { label: "HWID Lock",  value: gk.hwidLocked ? "Yes" : "No" },
            ].map(({ label, value }) => (
              <div key={label}>
                <span className="text-muted-foreground/60">{label}: </span>
                <span className="font-mono break-all">{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "all",      label: "All"      },
  { id: "active",   label: "Active"   },
  { id: "used",     label: "Used"     },
  { id: "expired",  label: "Expired"  },
  { id: "disabled", label: "Disabled" },
];

export default function Keys() {
  const { keys, createKey, updateKey, deleteKey, deleteExpired } = useKeys();
  const { providers } = useProviders();
  const { toast } = useToast();

  const [createOpen, setCreateOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("standard");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const [generatedKeys, setGeneratedKeys] = useState<GeneratedKey[]>([]);
  const [genLoading, setGenLoading] = useState(false);

  async function fetchGeneratedKeys() {
    setGenLoading(true);
    try {
      const res = await fetch("/api/user-keys");
      if (res.ok) setGeneratedKeys(await res.json());
    } catch {
      // silently fail
    } finally {
      setGenLoading(false);
    }
  }

  useEffect(() => {
    if (tab === "generated") fetchGeneratedKeys();
  }, [tab]);

  async function deleteGeneratedKey(id: number) {
    await fetch(`/api/user-keys/${id}`, { method: "DELETE" });
    setGeneratedKeys((prev) => prev.filter((k) => k.id !== id));
    toast({ title: "Key deleted" });
  }

  const filtered = useMemo(() => {
    return keys.filter((k) => {
      if (tab === "premium" && !k.premium) return false;
      if (tab === "standard" && k.premium) return false;
      if (statusFilter !== "all" && k.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const pName = providers.find((p) => p.id === k.providerId)?.name ?? "";
        return (
          k.value.toLowerCase().includes(q) ||
          k.hwid.toLowerCase().includes(q) ||
          pName.toLowerCase().includes(q) ||
          k.keyName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [keys, tab, statusFilter, search, providers]);

  const filteredGenerated = useMemo(() => {
    if (!search) return generatedKeys;
    const q = search.toLowerCase();
    return generatedKeys.filter((k) =>
      k.keyValue.toLowerCase().includes(q) ||
      (k.scriptName ?? "").toLowerCase().includes(q) ||
      k.scriptKey.toLowerCase().includes(q)
    );
  }, [generatedKeys, search]);

  function copyKey(value: string) {
    navigator.clipboard.writeText(value).catch(() => {});
    toast({ title: "Key copied to clipboard" });
  }

  function exportKeys() {
    const data = JSON.stringify(filtered, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "keys.json"; a.click();
    URL.revokeObjectURL(url);
  }

  const totalCount = tab === "generated" ? generatedKeys.length : keys.length;

  return (
    <div className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full space-y-5">
      {/* Header */}
      <div className="rounded-xl border border-white/8 bg-card/40 p-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <KeyRound className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">Keys</h1>
            <p className="text-sm text-muted-foreground">{totalCount} {totalCount === 1 ? "Key" : "Keys"}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {tab !== "generated" && (
              <>
                <Button variant="outline" size="sm" className="gap-1.5 border-white/10 bg-card/60" onClick={exportKeys}>
                  <Download className="w-3.5 h-3.5" /> Export
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5 border-red-500/20 text-red-400 hover:text-red-300 hover:bg-red-500/5 bg-card/60"
                  onClick={() => { deleteExpired(); toast({ title: "Expired keys deleted" }); }}>
                  <Trash2 className="w-3.5 h-3.5" /> Delete expired
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5 border-white/10 bg-card/60">
                  <AlignJustify className="w-3.5 h-3.5" /> Batch create
                </Button>
                <Button className="gap-1.5 shadow-[0_0_15px_-5px_var(--color-primary)]" size="sm" onClick={() => setCreateOpen(true)}>
                  <Plus className="w-3.5 h-3.5" /> Create key
                </Button>
              </>
            )}
            {tab === "generated" && (
              <Button variant="outline" size="sm" className="gap-1.5 border-white/10 bg-card/60" onClick={fetchGeneratedKeys} disabled={genLoading}>
                <RefreshCw className={`w-3.5 h-3.5 ${genLoading ? "animate-spin" : ""}`} /> Refresh
              </Button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Key, HWID, Provider, Script..."
            className="pl-10 bg-black/40 border-white/10 focus-visible:ring-primary/40"
          />
        </div>

        {/* Tabs & filters */}
        <div className="flex items-center gap-2 mt-4 flex-wrap">
          <div className="flex rounded-lg overflow-hidden border border-white/8">
            <button type="button" onClick={() => setTab("standard")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${tab === "standard" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              <KeyRound className="w-3 h-3" /> Standard
            </button>
            <button type="button" onClick={() => setTab("premium")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors border-l border-white/8 ${tab === "premium" ? "bg-amber-500 text-black" : "text-muted-foreground hover:text-foreground"}`}>
              <Star className="w-3 h-3" /> Premium
            </button>
            <button type="button" onClick={() => setTab("generated")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors border-l border-white/8 ${tab === "generated" ? "bg-green-600 text-white" : "text-muted-foreground hover:text-foreground"}`}>
              <Globe className="w-3 h-3" /> Generated
            </button>
          </div>

          {tab !== "generated" && (
            <div className="flex items-center gap-1 flex-1 flex-wrap">
              {STATUS_FILTERS.map((f) => (
                <button key={f.id} type="button" onClick={() => setStatusFilter(f.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${statusFilter === f.id ? "bg-white/10 text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                  {f.label}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-1 ml-auto">
            <button type="button" onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-white/10 text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-white/10 text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              <AlignJustify className="w-4 h-4" />
            </button>
            {tab !== "generated" && (
              <Button variant="outline" size="sm" className="gap-1.5 border-white/10 bg-card/60 ml-1">
                <SlidersHorizontal className="w-3.5 h-3.5" /> Filters
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Generated Keys Tab */}
      {tab === "generated" && (
        <>
          {genLoading ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" /> Loading...
            </div>
          ) : filteredGenerated.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-4 text-muted-foreground border border-white/8 rounded-xl bg-card/20">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                <Globe className="w-5 h-5 text-green-500/60" />
              </div>
              <div className="text-center">
                <div className="text-sm font-medium">No generated keys yet.</div>
                <div className="text-xs mt-1 opacity-60">Keys appear here when users complete the checkpoint flow.</div>
              </div>
            </div>
          ) : (
            <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 gap-4" : "space-y-3"}>
              {filteredGenerated.map((gk) => (
                <GeneratedKeyCard
                  key={gk.id}
                  gk={gk}
                  onCopy={() => copyKey(gk.keyValue)}
                  onDelete={() => {
                    if (confirm("Delete this generated key?")) deleteGeneratedKey(gk.id);
                  }}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Manual Keys Tab */}
      {tab !== "generated" && (
        <>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-4 text-muted-foreground border border-white/8 rounded-xl bg-card/20">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <KeyRound className="w-5 h-5 text-primary/60" />
              </div>
              <div className="text-center">
                <div className="text-sm font-medium">No keys for current search/filter.</div>
                <div className="text-xs mt-1 opacity-60">No keys available yet.</div>
              </div>
              <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Create key
              </Button>
            </div>
          ) : (
            <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 gap-4" : "space-y-3"}>
              {filtered.map((k) => {
                const providerName = providers.find((p) => p.id === k.providerId)?.name ?? "Unknown";
                return (
                  <KeyCard
                    key={k.id}
                    keyItem={k}
                    providerName={providerName}
                    onCopy={() => copyKey(k.value)}
                    onDelete={() => { if (confirm("Delete this key?")) { deleteKey(k.id); toast({ title: "Key deleted" }); } }}
                    onStatusChange={(s) => { updateKey(k.id, { status: s }); toast({ title: `Key set to ${s}` }); }}
                  />
                );
              })}
            </div>
          )}
        </>
      )}

      <CreateKeyDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSave={async (data) => {
          const validityMinutes = data.permanent
            ? 99999999
            : data.useCustom
            ? data.customDays * 1440 + data.customHours * 60 + data.customMinutes
            : VALIDITY_PRESETS[data.validityPreset].minutes;

          if (data.scriptId) {
            // Create a real DB-backed key that works in Roblox
            try {
              const res = await fetch("/api/user-keys", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  scriptId: data.scriptId,
                  validityMinutes,
                  hwid: data.hwid || null,
                }),
              });
              if (!res.ok) {
                const err = await res.json().catch(() => ({ error: "Unknown error" }));
                toast({ title: "Failed to create key", description: err.error, variant: "destructive" });
                return;
              }
              const created: GeneratedKey & { scriptName: string } = await res.json();
              setGeneratedKeys((prev) => [created, ...prev]);
              setTab("generated");
              toast({ title: "Key created", description: created.keyValue });
            } catch {
              toast({ title: "Network error", description: "Could not create key", variant: "destructive" });
            }
          } else {
            // No script selected — store locally for display only
            createKey({
              keyName: data.keyName,
              providerId: data.providerId,
              serviceId: data.serviceId,
              hwid: data.hwid,
              permanent: data.permanent,
              premium: data.premium,
              oneTimeUse: data.oneTimeUse,
              expiryOnFirstUse: data.expiryOnFirstUse,
              noHwidBinding: data.noHwidBinding,
              hwidLimit: data.hwidLimit ?? undefined,
              validityMinutes,
            });
            toast({ title: "Key created (local only — select a script to make it work in Roblox)" });
          }
        }}
      />
    </div>
  );
}
