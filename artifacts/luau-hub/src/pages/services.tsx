import { useState } from "react";
import {
  LayoutGrid, Plus, Star, Clock, Trash2, Edit, Copy,
  Link2, KeyRound, ChevronDown, ArrowUpDown,
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
import { useServices, type Service } from "@/hooks/use-services";
import { useToast } from "@/hooks/use-toast";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MAX_SERVICES = 10;
const PLAN_LABEL = "STANDARD";

type SortKey = "name" | "createdAt";
interface SortOption { key: SortKey; label: string; dir: "asc" | "desc" }
const SORT_OPTIONS: SortOption[] = [
  { key: "name",      label: "Name ↑",    dir: "asc"  },
  { key: "name",      label: "Name ↓",    dir: "desc" },
  { key: "createdAt", label: "Newest",    dir: "desc" },
  { key: "createdAt", label: "Oldest",    dir: "asc"  },
];

interface ServiceFormData {
  name: string;
  description: string;
  premium: boolean;
  keylessMode: boolean;
  keylessWeekdays: number[];
}

const DEFAULT_FORM: ServiceFormData = {
  name: "",
  description: "",
  premium: false,
  keylessMode: false,
  keylessWeekdays: [],
};

function ServiceDialog({
  open, onOpenChange, initial, onSave, title, subtitle,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: ServiceFormData;
  onSave: (data: ServiceFormData) => void;
  title: string;
  subtitle: string;
}) {
  const [form, setForm] = useState<ServiceFormData>(initial ?? DEFAULT_FORM);

  function toggleDay(idx: number) {
    setForm((prev) => ({
      ...prev,
      keylessWeekdays: prev.keylessWeekdays.includes(idx)
        ? prev.keylessWeekdays.filter((d) => d !== idx)
        : [...prev.keylessWeekdays, idx],
    }));
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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-[#0d0d12] border-white/10 gap-0 p-0 overflow-hidden">
        <DialogHeader className="flex-row items-start gap-4 p-6 pb-5 border-b border-white/8">
          <div className="w-11 h-11 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0">
            <LayoutGrid className="w-5 h-5 text-primary" />
          </div>
          <div>
            <DialogTitle className="text-base font-semibold">{title}</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">{subtitle}</DialogDescription>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="svc-name" className="text-sm">
              Name <span className="text-red-400">*</span>
            </Label>
            <Input
              id="svc-name"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="bg-black/60 border-white/10 focus-visible:ring-primary/40"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="svc-desc" className="text-sm">Description</Label>
            <Input
              id="svc-desc"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              className="bg-black/60 border-white/10 focus-visible:ring-primary/40"
            />
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between p-3.5 rounded-lg border border-white/8 bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/20 flex items-center justify-center">
                  <Star className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <span className="text-sm font-medium">Premium Service</span>
              </div>
              <Switch
                checked={form.premium}
                onCheckedChange={(v) => setForm((p) => ({ ...p, premium: v }))}
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-lg border border-white/8 bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div>
                  <div className="text-sm font-medium">Keyless Mode</div>
                  <div className="text-[11px] text-muted-foreground leading-none mt-0.5">Skip key verification for this service</div>
                </div>
              </div>
              <Switch
                checked={form.keylessMode}
                onCheckedChange={(v) => setForm((p) => ({ ...p, keylessMode: v }))}
              />
            </div>
          </div>

          <div className="space-y-2.5">
            <div>
              <div className="text-sm font-medium">Keyless weekdays</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Automatically keyless on selected weekdays (UTC).</div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {DAYS.map((day, idx) => {
                const selected = form.keylessWeekdays.includes(idx);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(idx)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${
                      selected
                        ? "bg-primary/20 text-primary border-primary/40"
                        : "bg-white/[0.03] text-muted-foreground border-white/10 hover:border-white/20 hover:text-foreground"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 pb-6 gap-2">
          <Button variant="ghost" onClick={() => handleOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!form.name.trim()}>
            <Plus className="w-4 h-4 mr-1.5" /> {initial ? "Save Changes" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ServiceCard({
  service, onEdit, onDelete,
}: {
  service: Service;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { toast } = useToast();
  const numId = parseInt(service.id.replace(/-/g, "").slice(0, 8), 16) % 100000;
  const displayId = `#${numId.toString().padStart(5, "0")}`;

  function copyLink() {
    navigator.clipboard.writeText(`https://xeioa.app/api/key/${service.id}`).catch(() => {});
    toast({ title: "Link copied to clipboard" });
  }

  return (
    <div className="rounded-xl border border-white/8 bg-card/40 overflow-hidden hover:border-white/12 transition-all">
      <div className="flex items-center gap-4 p-5">
        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
          <LayoutGrid className="w-4.5 h-4.5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm text-primary truncate">{service.name}</div>
          <div className="text-xs text-muted-foreground/70 truncate mt-0.5">
            {service.description || "No description available"}
          </div>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] gap-1">
              <KeyRound className="w-2.5 h-2.5" /> 0 Keys
            </Badge>
            <span className="text-[11px] text-muted-foreground font-mono">{displayId}</span>
            {service.keylessMode && (
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] gap-1">
                <Clock className="w-2.5 h-2.5" /> Keyless
              </Badge>
            )}
            {service.premium && (
              <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px] gap-1">
                <Star className="w-2.5 h-2.5" /> Premium
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center border-t border-white/6">
        <button
          type="button"
          onClick={copyLink}
          className="flex-1 flex items-center gap-2 px-4 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-white/[0.03] transition-colors"
        >
          <Link2 className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate font-mono">Configure Link</span>
        </button>
        <div className="flex items-center border-l border-white/6">
          <button
            type="button"
            onClick={onEdit}
            className="p-2.5 text-muted-foreground hover:text-foreground hover:bg-white/[0.03] transition-colors"
            title="Edit"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={copyLink}
            className="p-2.5 text-muted-foreground hover:text-foreground hover:bg-white/[0.03] transition-colors border-l border-white/6"
            title="Copy link"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-2.5 text-muted-foreground hover:text-red-400 hover:bg-red-500/5 transition-colors border-l border-white/6"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Services() {
  const { services, createService, updateService, deleteService } = useServices();
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Service | null>(null);
  const [sortIdx, setSortIdx] = useState(0);

  const sort = SORT_OPTIONS[sortIdx];
  const sorted = [...services].sort((a, b) => {
    const av = a[sort.key] as string;
    const bv = b[sort.key] as string;
    const cmp = av.localeCompare(bv);
    return sort.dir === "asc" ? cmp : -cmp;
  });

  const pct = Math.round((services.length / MAX_SERVICES) * 100);

  return (
    <div className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
          <LayoutGrid className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Services</h1>
          <p className="text-sm text-muted-foreground">
            {services.length} {services.length === 1 ? "service" : "services"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 border-white/10 bg-card/40">
                <ArrowUpDown className="w-3.5 h-3.5" />
                {sort.label}
                <ChevronDown className="w-3.5 h-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-36">
              {SORT_OPTIONS.map((opt, i) => (
                <DropdownMenuItem key={i} onClick={() => setSortIdx(i)}>
                  {opt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            className="shadow-[0_0_15px_-5px_var(--color-primary)]"
            onClick={() => setCreateOpen(true)}
            disabled={services.length >= MAX_SERVICES}
          >
            <Plus className="w-4 h-4 mr-2" /> New Service
          </Button>
        </div>
      </div>

      {/* Usage bar */}
      <div className="rounded-xl border border-white/8 bg-card/40 p-5 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-primary">{services.length}</span>
            <span className="text-muted-foreground">/ {MAX_SERVICES} Services</span>
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
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* List */}
      {services.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 gap-4 text-muted-foreground border border-white/8 rounded-xl bg-card/20">
          <LayoutGrid className="w-10 h-10 opacity-20" />
          <div className="text-center">
            <div className="text-sm font-medium">No services yet</div>
            <div className="text-xs mt-1 opacity-60">Create a service to organize your scripts.</div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1.5" /> New Service
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map((svc) => (
            <ServiceCard
              key={svc.id}
              service={svc}
              onEdit={() => setEditTarget(svc)}
              onDelete={() => {
                if (confirm(`Delete "${svc.name}"? This cannot be undone.`)) {
                  deleteService(svc.id);
                  toast({ title: "Service deleted" });
                }
              }}
            />
          ))}
        </div>
      )}

      <ServiceDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="New Service"
        subtitle="Create and configure a new service"
        onSave={(data) => {
          createService(data);
          toast({ title: "Service created" });
        }}
      />

      {editTarget && (
        <ServiceDialog
          open={!!editTarget}
          onOpenChange={(v) => { if (!v) setEditTarget(null); }}
          initial={editTarget}
          title="Edit Service"
          subtitle="Update service configuration"
          onSave={(data) => {
            updateService(editTarget.id, data);
            setEditTarget(null);
            toast({ title: "Service updated" });
          }}
        />
      )}
    </div>
  );
}
