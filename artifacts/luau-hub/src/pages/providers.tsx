import { useState } from "react";
import {
  List, Plus, Clock, ChevronDown, Trash2, Edit, Zap,
  ArrowUpDown, Search, LayoutGrid, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useProviders, type Provider } from "@/hooks/use-providers";
import { useIntegrations, INTEGRATION_TYPES } from "@/hooks/use-integrations";
import { useToast } from "@/hooks/use-toast";

const MAX_PROVIDERS = 20;
const PLAN_LABEL = "STANDARD";

type SortKey = "name" | "createdAt";
interface SortOption { key: SortKey; label: string; dir: "asc" | "desc" }
const SORT_OPTIONS: SortOption[] = [
  { key: "name",      label: "Name ↑",  dir: "asc"  },
  { key: "name",      label: "Name ↓",  dir: "desc" },
  { key: "createdAt", label: "Newest",  dir: "desc" },
  { key: "createdAt", label: "Oldest",  dir: "asc"  },
];

interface ProviderFormData {
  name: string;
  customIconUrl: string;
  keyValidityMinutes: number;
  userSelectMode: boolean;
  oneTimeUseKeys: boolean;
  expiryOnFirstUse: boolean;
  streakSystem: boolean;
  hwidBinding: boolean;
  hwidLimit: number;
  integrationSequence: string[];
}

const DEFAULT_FORM: ProviderFormData = {
  name: "",
  customIconUrl: "",
  keyValidityMinutes: 60,
  userSelectMode: false,
  oneTimeUseKeys: false,
  expiryOnFirstUse: false,
  streakSystem: false,
  hwidBinding: true,
  hwidLimit: 1,
  integrationSequence: [],
};

function minutesToDisplay(min: number) {
  if (min < 60) return `${min} min`;
  const h = min / 60;
  if (Number.isInteger(h)) return `${h}h`;
  return `${Math.floor(h)}h ${min % 60}min`;
}

function ProviderDialog({
  open, onOpenChange, initial, onSave, title, subtitle,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: ProviderFormData;
  onSave: (data: ProviderFormData) => void;
  title: string;
  subtitle: string;
}) {
  const [form, setForm] = useState<ProviderFormData>(initial ?? DEFAULT_FORM);
  const [nameError, setNameError] = useState(false);
  const [intSearch, setIntSearch] = useState("");
  const { integrations } = useIntegrations();

  function patch<K extends keyof ProviderFormData>(k: K, v: ProviderFormData[K]) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  function handleOpenChange(v: boolean) {
    if (!v) { setForm(initial ?? DEFAULT_FORM); setNameError(false); setIntSearch(""); }
    onOpenChange(v);
  }

  function handleSave() {
    if (!form.name.trim()) { setNameError(true); return; }
    onSave(form);
    handleOpenChange(false);
  }

  function toggleSequence(id: string) {
    setForm((p) => ({
      ...p,
      integrationSequence: p.integrationSequence.includes(id)
        ? p.integrationSequence.filter((i) => i !== id)
        : [...p.integrationSequence, id],
    }));
  }

  const filteredIntegrations = integrations.filter((i) =>
    i.name.toLowerCase().includes(intSearch.toLowerCase()) ||
    i.type.toLowerCase().includes(intSearch.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[680px] bg-[#0d0d12] border-white/10 gap-0 p-0 overflow-hidden max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-row items-start gap-4 p-6 pb-5 border-b border-white/8 shrink-0">
          <div className="w-11 h-11 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0">
            <Plus className="w-5 h-5 text-primary" />
          </div>
          <div>
            <DialogTitle className="text-base font-semibold">{title}</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">{subtitle}</DialogDescription>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {/* Name */}
          <div className="space-y-1.5">
            <Label className="text-sm">
              Provider name <span className="text-red-400">*</span>
            </Label>
            <Input
              value={form.name}
              onChange={(e) => { patch("name", e.target.value); setNameError(false); }}
              placeholder="Provider name"
              className={`bg-black/60 border-white/10 focus-visible:ring-primary/40 ${nameError ? "border-red-500" : ""}`}
              autoFocus
            />
            {nameError && (
              <p className="text-xs text-red-400 flex items-center gap-1">
                <span>⊙</span> Name is required
              </p>
            )}
          </div>

          {/* Custom Icon URL */}
          <div className="space-y-1.5">
            <Label className="text-sm">Custom Icon URL</Label>
            <Input
              value={form.customIconUrl}
              onChange={(e) => patch("customIconUrl", e.target.value)}
              placeholder="https://..."
              className="bg-black/60 border-white/10 focus-visible:ring-primary/40 font-mono text-xs"
            />
            <p className="text-[11px] text-muted-foreground/60">
              Overrides the icon shown in the flow header for this provider.
            </p>
          </div>

          {/* Key Validity */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary/70" />
              <Label className="text-sm">
                Key validity <span className="text-red-400">*</span>
              </Label>
              <div className="flex-1" />
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  value={form.keyValidityMinutes}
                  onChange={(e) => patch("keyValidityMinutes", parseInt(e.target.value) || 60)}
                  className="w-20 bg-black/60 border-white/10 text-center font-mono text-sm focus-visible:ring-primary/40"
                />
                <span className="text-xs text-muted-foreground">min</span>
                <Input
                  type="number"
                  min={0.1}
                  step={0.1}
                  value={parseFloat((form.keyValidityMinutes / 60).toFixed(2))}
                  onChange={(e) => patch("keyValidityMinutes", Math.round(parseFloat(e.target.value || "1") * 60))}
                  className="w-20 bg-black/60 border-white/10 text-center font-mono text-sm focus-visible:ring-primary/40"
                />
                <span className="text-xs text-muted-foreground">h</span>
              </div>
            </div>
          </div>

          {/* Provider Settings */}
          <div className="space-y-3">
            <p className="text-[10px] font-semibold tracking-widest text-muted-foreground/50 uppercase text-center">
              Provider Settings
            </p>
            <div className="grid grid-cols-2 gap-3">
              {([
                { key: "userSelectMode",  label: "User Select Mode",   sub: "Users choose from multiple options", icon: "▦", color: "text-violet-400" },
                { key: "oneTimeUseKeys",  label: "One-time use keys",  sub: "",                                   icon: "🔒", color: "" },
                { key: "expiryOnFirstUse",label: "Expiry on first use",sub: "",                                   icon: "⏱", color: "text-primary/70" },
                { key: "streakSystem",    label: "Streak System",      sub: "",                                   icon: "⚡", color: "text-amber-400" },
              ] as const).map(({ key, label, sub, icon, color }) => (
                <div key={key} className="flex items-center justify-between p-3 rounded-lg border border-white/8 bg-white/[0.02] gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`${color} text-sm shrink-0`}>{icon}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-medium">{label}</div>
                      {sub && <div className="text-[10px] text-muted-foreground/60 truncate">{sub}</div>}
                    </div>
                  </div>
                  <Switch
                    checked={form[key] as boolean}
                    onCheckedChange={(v) => patch(key, v)}
                    className="shrink-0"
                  />
                </div>
              ))}
            </div>

            {/* HWID Limit */}
            <div className="rounded-lg border border-white/8 bg-white/[0.02] p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-emerald-400">◎</span>
                <span className="text-sm font-medium">HWID Limit</span>
                <div className="flex-1" />
                <Switch checked={form.hwidBinding} onCheckedChange={(v) => patch("hwidBinding", v)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Max HWIDs per Key</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.hwidLimit}
                  onChange={(e) => patch("hwidLimit", parseInt(e.target.value) || 1)}
                  className="w-32 bg-black/60 border-white/10 font-mono text-sm focus-visible:ring-primary/40"
                  disabled={!form.hwidBinding}
                />
                <p className="text-[10px] text-muted-foreground/60">
                  Maximum number of devices (HWIDs) that can use this key. Default: 1 (single device)
                </p>
              </div>
            </div>
          </div>

          {/* Integrations + Sequence */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">Available integrations</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
                <Input
                  value={intSearch}
                  onChange={(e) => setIntSearch(e.target.value)}
                  placeholder="Search..."
                  className="pl-8 bg-black/60 border-white/10 text-sm focus-visible:ring-primary/40 h-9"
                />
              </div>
              <div className="space-y-1 max-h-44 overflow-y-auto">
                {filteredIntegrations.length === 0 ? (
                  <p className="text-xs text-muted-foreground/50 py-3 text-center">No integrations found</p>
                ) : filteredIntegrations.map((int) => {
                  const meta = INTEGRATION_TYPES.find((t) => t.id === int.type);
                  const inSeq = form.integrationSequence.includes(int.id);
                  return (
                    <div
                      key={int.id}
                      className="flex items-center gap-2 p-2 rounded-lg border border-white/6 bg-white/[0.01] hover:bg-white/[0.04] transition-colors cursor-pointer"
                      onClick={() => toggleSequence(int.id)}
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-bold"
                        style={{ backgroundColor: (meta?.color ?? "#6366f1") + "22", color: meta?.color ?? "#6366f1" }}
                      >
                        {int.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-primary truncate">{int.name}</div>
                        <div className="text-[10px] text-muted-foreground">#{int.id} · {meta?.label}</div>
                      </div>
                      {inSeq
                        ? <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                        : <Plus className="w-4 h-4 text-muted-foreground/50 shrink-0" />}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Sequence</Label>
              <div className="rounded-lg border border-dashed border-white/15 bg-white/[0.01] min-h-[160px] flex flex-col p-3">
                {form.integrationSequence.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-2">
                    <LayoutGrid className="w-8 h-8 text-muted-foreground/20" />
                    <div className="text-center">
                      <p className="text-xs font-medium text-muted-foreground">No steps yet. Add revenues from the left.</p>
                      <p className="text-[10px] text-muted-foreground/50 mt-0.5">Add integrations to get started</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {form.integrationSequence.map((id, idx) => {
                      const int = integrations.find((i) => i.id === id);
                      if (!int) return null;
                      const meta = INTEGRATION_TYPES.find((t) => t.id === int.type);
                      return (
                        <div key={id} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.03] border border-white/8">
                          <span className="text-[10px] text-muted-foreground/50 w-4 shrink-0">{idx + 1}</span>
                          <div
                            className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold shrink-0"
                            style={{ backgroundColor: (meta?.color ?? "#6366f1") + "22", color: meta?.color ?? "#6366f1" }}
                          >
                            {int.name.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="text-xs truncate text-primary flex-1">{int.name}</span>
                          <button type="button" onClick={() => toggleSequence(id)} className="text-muted-foreground/40 hover:text-red-400 text-xs ml-auto">✕</button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 pb-6 pt-4 border-t border-white/8 shrink-0 gap-2">
          <Button variant="ghost" onClick={() => handleOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>
            <LayoutGrid className="w-4 h-4 mr-1.5" /> {initial ? "Save Changes" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ProviderCard({ provider, onEdit, onDelete }: { provider: Provider; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="rounded-xl border border-white/8 bg-card/40 overflow-hidden hover:border-white/12 transition-all">
      <div className="flex items-center gap-4 p-5">
        {provider.customIconUrl ? (
          <img src={provider.customIconUrl} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <List className="w-5 h-5 text-primary" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm text-primary">{provider.name}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Provider #{provider.id}</div>
          <div className="flex items-center gap-3 mt-2 flex-wrap text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> {minutesToDisplay(provider.keyValidityMinutes)}
            </span>
            <span className="flex items-center gap-1">
              <List className="w-3.5 h-3.5" /> {provider.integrationSequence.length} Checkpoint{provider.integrationSequence.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>
      <div className="flex border-t border-white/6">
        <button type="button" onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-white/[0.03] transition-colors border-r border-white/6">
          <Edit className="w-3.5 h-3.5" /> Edit
        </button>
        <button type="button"
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-white/[0.03] transition-colors border-r border-white/6">
          <Zap className="w-3.5 h-3.5" /> Test
        </button>
        <button type="button" onClick={onDelete}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-colors">
          <Trash2 className="w-3.5 h-3.5" /> Delete
        </button>
      </div>
    </div>
  );
}

export default function Providers() {
  const { providers, createProvider, updateProvider, deleteProvider } = useProviders();
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Provider | null>(null);
  const [sortIdx, setSortIdx] = useState(0);

  const sort = SORT_OPTIONS[sortIdx];
  const sorted = [...providers].sort((a, b) => {
    const cmp = (a[sort.key] as string).localeCompare(b[sort.key] as string);
    return sort.dir === "asc" ? cmp : -cmp;
  });
  const pct = Math.round((providers.length / MAX_PROVIDERS) * 100);

  return (
    <div className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
          <List className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Providers</h1>
          <p className="text-sm text-muted-foreground">{providers.length} {providers.length === 1 ? "Provider" : "Providers"}</p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 border-white/10 bg-card/40">
                <ArrowUpDown className="w-3.5 h-3.5" />{sort.label}<ChevronDown className="w-3.5 h-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-36">
              {SORT_OPTIONS.map((opt, i) => (
                <DropdownMenuItem key={i} onClick={() => setSortIdx(i)}>{opt.label}</DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button className="shadow-[0_0_15px_-5px_var(--color-primary)]" onClick={() => setCreateOpen(true)} disabled={providers.length >= MAX_PROVIDERS}>
            <Plus className="w-4 h-4 mr-2" /> New provider
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-white/8 bg-card/40 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-primary">{providers.length}</span>
            <span className="text-sm text-muted-foreground">/ {MAX_PROVIDERS} Providers</span>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1.5 justify-end">
              <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
              <span className="text-xs font-semibold tracking-wide">{PLAN_LABEL}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">{pct}%</div>
          </div>
        </div>
        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
          <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${Math.max(pct, providers.length > 0 ? 3 : 0)}%` }} />
        </div>
      </div>

      {providers.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 gap-4 text-muted-foreground border border-white/8 rounded-xl bg-card/20">
          <List className="w-10 h-10 opacity-20" />
          <div className="text-center">
            <div className="text-sm font-medium">No providers yet</div>
            <div className="text-xs mt-1 opacity-60">Create a provider to define how keys behave.</div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1.5" /> New provider
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map((p) => (
            <ProviderCard key={p.id} provider={p} onEdit={() => setEditTarget(p)}
              onDelete={() => { if (confirm(`Delete "${p.name}"?`)) { deleteProvider(p.id); toast({ title: "Provider deleted" }); } }} />
          ))}
        </div>
      )}

      <ProviderDialog open={createOpen} onOpenChange={setCreateOpen} title="Create provider" subtitle="Create new provider with checkpoints"
        onSave={(data) => { createProvider(data); toast({ title: "Provider created" }); }} />

      {editTarget && (
        <ProviderDialog open={!!editTarget} onOpenChange={(v) => { if (!v) setEditTarget(null); }} initial={editTarget}
          title="Edit provider" subtitle="Update provider configuration"
          onSave={(data) => { updateProvider(editTarget.id, data); setEditTarget(null); toast({ title: "Provider updated" }); }} />
      )}
    </div>
  );
}
