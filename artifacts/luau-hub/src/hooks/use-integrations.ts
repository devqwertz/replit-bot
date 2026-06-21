import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export type IntegrationType =
  | "linkvertise"
  | "workink"
  | "adfly"
  | "lootlabs"
  | "shrtfly"
  | "short-jambo"
  | "cuty"
  | "shrinkearn"
  | "lockr"
  | "linkunlocker"
  | "rinku"
  | "safelinku";

export interface IntegrationTypeMeta {
  id: IntegrationType;
  label: string;
  status: "flow-ready" | "in-development" | "placeholder";
  color: string;
}

export const INTEGRATION_TYPES: IntegrationTypeMeta[] = [
  { id: "linkvertise",  label: "Linkvertise",   status: "flow-ready",      color: "#FF6B35" },
  { id: "workink",      label: "Work ink",       status: "flow-ready",      color: "#3B82F6" },
  { id: "adfly",        label: "Adfly",          status: "in-development",  color: "#94A3B8" },
  { id: "lootlabs",     label: "Lootlabs",       status: "flow-ready",      color: "#8B5CF6" },
  { id: "shrtfly",      label: "Shrtfly",        status: "flow-ready",      color: "#EC4899" },
  { id: "short-jambo",  label: "Short-jambo",    status: "flow-ready",      color: "#64748B" },
  { id: "cuty",         label: "Cuty",           status: "flow-ready",      color: "#06B6D4" },
  { id: "shrinkearn",   label: "Shrinkearn",     status: "flow-ready",      color: "#F59E0B" },
  { id: "lockr",        label: "Lockr",          status: "flow-ready",      color: "#6366F1" },
  { id: "linkunlocker", label: "LinkUnlocker",   status: "flow-ready",      color: "#10B981" },
  { id: "rinku",        label: "Rinku",          status: "flow-ready",      color: "#3B82F6" },
  { id: "safelinku",    label: "Safelinku",      status: "flow-ready",      color: "#0EA5E9" },
];

export interface Integration {
  id: string;
  name: string;
  type: IntegrationType;
  publisherId: string;
  antiBypassToken: string;
  bypassProtection: boolean;
  enabled: boolean;
  createdAt: string;
}

type CreatePayload = Omit<Integration, "id" | "createdAt">;
type UpdatePayload = Partial<Omit<Integration, "id" | "createdAt">>;

const QUERY_KEY = ["/api/integrations"];

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export function useIntegrations() {
  const queryClient = useQueryClient();

  const { data: integrations = [] } = useQuery<Integration[]>({
    queryKey: QUERY_KEY,
    queryFn: () => apiFetch<Integration[]>("/api/integrations"),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreatePayload) =>
      apiFetch<Integration>("/api/integrations", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePayload }) =>
      apiFetch<Integration>(`/api/integrations/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>(`/api/integrations/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  return {
    integrations,
    createIntegration: (data: CreatePayload) => createMutation.mutate(data),
    updateIntegration: (id: string, data: UpdatePayload) => updateMutation.mutate({ id, data }),
    deleteIntegration: (id: string) => deleteMutation.mutate(id),
  };
}
