import { useState } from "react";
import {
  Wrench, Plus, Shield, Edit, Trash2, ChevronDown,
  CheckCircle2, Clock, ExternalLink,
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
import {
  useIntegrations, INTEGRATION_TYPES, type Integration, type IntegrationType,
} from "@/hooks/use-integrations";
import { useToast } from "@/hooks/use-toast";

function TypeBadge({ type }: { type: IntegrationType }) {
  const meta = INTEGRATION_TYPES.find((t) => t.id === type);
  if (!meta) return null;
  if (meta.status === "flow-ready") {
    return (
      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] gap-1">
        <CheckCircle2 className="w-2.5 h-2.5" /> Flow-Ready
      </Badge>
    );
  }
  if (meta.status === "in-development") {
    return (
      <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px] gap-1">
        <Clock className="w-2.5 h-2.5" /> In development
      </Badge>
    );
  }
  return null;
}

function TypeIcon({ type, size = 40 }: { type: IntegrationType; size?: number }) {
  const meta = INTEGRATION_TYPES.find((t) => t.id === type);
  const color = meta?.color ?? "#6366f1";
  const label = meta?.label ?? type;
  const initials = label.slice(0, 2).toUpperCase();
  return (
    <div
      className="rounded-xl flex items-center justify-center shrink-0 font-bold text-white text-xs"
      style={{ width: size, height: size, backgroundColor: color + "22", border: `1px solid ${color}44` }}
    >
      <span style={{ color }}>{initials}</span>
    </div>
  );
}

interface FormData {
  name: string;
  type: IntegrationType;
  publisherId: string;
  antiBypassToken: string;
  bypassProtection: boolean;
  enabled: boolean;
}

const DEFAULT_FORM: FormData = {
  name: "",
  type: "linkvertise",
  publisherId: "",
  antiBypassToken: "",
  bypassProtection: false,
  enabled: true,
};

function IntegrationDialog({
  open,
  onOpenChange,
  initial,
  onSave,
  title,
  subtitle,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: FormData;
  onSave: (data: FormData) => void;
  title: string;
  subtitle: string;
}) {
  const [form, setForm] = useState<FormData>(initial ?? DEFAULT_FORM);

  function patch<K extends keyof FormData>(k: K, v: FormData[K]) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  function handleOpenChange(v: boolean) {
    if (!v) setForm(initial ?? DEFAULT_FORM);
    onOpenChange(v);
  }

  function handleSave() {
    if (!form.name.trim()) return;
    onSave(form);
    handleOpenChange(false);
  }

  const selectedMeta = INTEGRATION_TYPES.find((t) => t.id === form.type)!;
  const isLinkvertise = form.type === "linkvertise";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[520px] bg-[#0d0d12] border-white/10 gap-0 p-0 overflow-hidden">
        <DialogHeader className="flex-row items-start gap-4 p-6 pb-5 border-b border-white/8">
          <div className="w-11 h-11 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0">
            <Wrench className="w-5 h-5 text-primary" />
          </div>
          <div>
            <DialogTitle className="text-base font-semibold">{title}</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">{subtitle}</DialogDescription>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="int-name" className="text-sm">
              Name <span className="text-red-400">*</span>
            </Label>
            <Input
              id="int-name"
              value={form.name}
              onChange={(e) => patch("name", e.target.value)}
              placeholder="e.g. Blockspin"
              className="bg-black/60 border-white/10 focus-visible:ring-primary/40"
              autoFocus
            />
          </div>

          {/* Integration Type grid */}
          <div className="space-y-2">
            <Label className="text-sm">Integration Type</Label>
            <div className="grid grid-cols-3 gap-2">
              {INTEGRATION_TYPES.map((t) => {
                const selected = form.type === t.id;
                const disabled = t.status !== "flow-ready";
                return (
                  <button
                    key={t.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => patch("type", t.id)}
                    className={`relative flex flex-col items-start gap-1 p-2.5 rounded-lg border text-left transition-all ${
                      selected
                        ? "border-primary/60 bg-primary/10"
                        : disabled
                        ? "border-white/5 bg-white/[0.01] opacity-40 cursor-not-allowed"
                        : "border-white/8 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full gap-1">
                      <span className="text-xs font-medium truncate">{t.label}</span>
                      {selected && (
                        <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                      )}
                    </div>
                    <span className={`text-[10px] ${
                      t.status === "flow-ready" ? "text-emerald-400" :
                      t.status === "in-development" ? "text-amber-400" :
                      "text-muted-foreground"
                    }`}>
                      {t.status === "flow-ready" ? "Flow-Ready" : t.status === "in-development" ? "In development" : "Coming soon"}
                    </span>
                    {t.status !== "flow-ready" && (
                      <ExternalLink className="absolute top-2 right-2 w-2.5 h-2.5 text-muted-foreground/40" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Linkvertise-specific fields */}
          {isLinkvertise && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="int-pub" className="text-sm">
                  Publisher ID <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="int-pub"
                  value={form.publisherId}
                  onChange={(e) => patch("publisherId", e.target.value)}
                  placeholder="e.g. 123456"
                  className="bg-black/60 border-white/10 font-mono focus-visible:ring-primary/40"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="int-token" className="text-sm">
                  Anti-bypass token (required) <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="int-token"
                  type="password"
                  value={form.antiBypassToken}
                  onChange={(e) => patch("antiBypassToken", e.target.value)}
                  placeholder="••••••••••••••••"
                  className="bg-black/60 border-white/10 font-mono focus-visible:ring-primary/40"
                />
              </div>

              <div className="rounded-lg border border-white/8 bg-white/[0.02] p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary/70" />
                  <span className="text-sm font-medium">B.Y.P.A.S.S API Protection</span>
                </div>
                <div className="text-[11px] text-muted-foreground/60 -mt-1">Advanced anti-bypass detection system</div>
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <div className="text-sm font-medium">Enable B.Y.P.A.S.S API</div>
                    <div className="text-[11px] text-muted-foreground/60 mt-0.5">Protect links from bypass tools and APIs</div>
                  </div>
                  <Switch
                    checked={form.bypassProtection}
                    onCheckedChange={(v) => patch("bypassProtection", v)}
                  />
                </div>
              </div>
            </>
          )}

          {!isLinkvertise && (
            <div className="rounded-lg border border-white/8 bg-amber-500/5 p-4 text-center">
              <p className="text-xs text-muted-foreground">
                Configuration for <span className="text-foreground font-medium">{selectedMeta.label}</span> is coming soon. This integration will be available in a future update.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 pb-6 gap-2 border-t border-white/8 pt-4">
          <Button variant="ghost" onClick={() => handleOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!form.name.trim()}>
            <Plus className="w-4 h-4 mr-1.5" /> {initial ? "Save Changes" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function IntegrationCard({
  integration,
  onEdit,
  onDelete,
}: {
  integration: Integration;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const typeMeta = INTEGRATION_TYPES.find((t) => t.id === integration.type);

  return (
    <div className="rounded-xl border border-white/8 bg-card/40 overflow-hidden hover:border-white/12 transition-all">
      <div className="flex items-center gap-4 p-5">
        <TypeIcon type={integration.type} size={48} />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm text-primary truncate">{integration.name}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{typeMeta?.label}</div>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-[11px] text-muted-foreground font-mono">#{integration.id}</span>
            {integration.enabled && (
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" /> Active
              </Badge>
            )}
            <TypeBadge type={integration.type} />
          </div>
        </div>
      </div>
      <div className="flex border-t border-white/6">
        <button
          type="button"
          onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-2 py-3 text-xs text-muted-foreground hover:text-foreground hover:bg-white/[0.03] transition-colors border-r border-white/6"
        >
          <Edit className="w-3.5 h-3.5" /> Edit
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="flex-1 flex items-center justify-center gap-2 py-3 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" /> Delete
        </button>
      </div>
    </div>
  );
}

const ALL_TYPES = "all";

export default function Integrations() {
  const { integrations, createIntegration, updateIntegration, deleteIntegration } = useIntegrations();
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Integration | null>(null);
  const [filterType, setFilterType] = useState<string>(ALL_TYPES);
  const [filterStatus, setFilterStatus] = useState<string>(ALL_TYPES);

  const filtered = integrations.filter((i) => {
    if (filterType !== ALL_TYPES && i.type !== filterType) return false;
    if (filterStatus === "active" && !i.enabled) return false;
    if (filterStatus === "inactive" && i.enabled) return false;
    return true;
  });

  const typeOptions = Array.from(new Set(integrations.map((i) => i.type)));

  return (
    <div className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
          <Wrench className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Integrations</h1>
          <p className="text-sm text-muted-foreground">
            {integrations.length} {integrations.length === 1 ? "integration" : "integrations"}
          </p>
        </div>
        <Button
          className="shadow-[0_0_15px_-5px_var(--color-primary)]"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" /> New Integration
        </Button>
      </div>

      {/* Filters */}
      {integrations.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 border-white/10 bg-card/40 text-sm">
                {filterType === ALL_TYPES ? "All types" : INTEGRATION_TYPES.find((t) => t.id === filterType)?.label}
                <ChevronDown className="w-3.5 h-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-44">
              <DropdownMenuItem onClick={() => setFilterType(ALL_TYPES)}>All types</DropdownMenuItem>
              {typeOptions.map((t) => (
                <DropdownMenuItem key={t} onClick={() => setFilterType(t)}>
                  {INTEGRATION_TYPES.find((m) => m.id === t)?.label ?? t}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 border-white/10 bg-card/40 text-sm">
                {filterStatus === ALL_TYPES ? "All" : filterStatus === "active" ? "Active" : "Inactive"}
                <ChevronDown className="w-3.5 h-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-36">
              <DropdownMenuItem onClick={() => setFilterStatus(ALL_TYPES)}>All</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus("active")}>Active</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus("inactive")}>Inactive</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* List */}
      {integrations.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4 text-muted-foreground border border-white/8 rounded-xl bg-card/20">
          <Wrench className="w-10 h-10 opacity-20" />
          <div className="text-center">
            <div className="text-sm font-medium">No integrations yet</div>
            <div className="text-xs mt-1 opacity-60">Connect a link provider to enable key verification flows.</div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1.5" /> New Integration
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex items-center justify-center h-32 text-muted-foreground text-sm border border-white/8 rounded-xl bg-card/20">
          No integrations match the current filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((integration) => (
            <IntegrationCard
              key={integration.id}
              integration={integration}
              onEdit={() => setEditTarget(integration)}
              onDelete={() => {
                if (confirm(`Delete "${integration.name}"?`)) {
                  deleteIntegration(integration.id);
                  toast({ title: "Integration deleted" });
                }
              }}
            />
          ))}
        </div>
      )}

      {/* Create dialog */}
      <IntegrationDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="New Integration"
        subtitle="Connect a new integration service"
        onSave={(data) => {
          createIntegration(data);
          toast({ title: "Integration created" });
        }}
      />

      {/* Edit dialog */}
      {editTarget && (
        <IntegrationDialog
          open={!!editTarget}
          onOpenChange={(v) => { if (!v) setEditTarget(null); }}
          initial={editTarget}
          title="Edit Integration"
          subtitle="Update integration configuration"
          onSave={(data) => {
            updateIntegration(editTarget.id, data);
            setEditTarget(null);
            toast({ title: "Integration updated" });
          }}
        />
      )}
    </div>
  );
}
