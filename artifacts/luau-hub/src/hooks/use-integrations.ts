import { useState, useEffect, useCallback } from "react";

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

const STORAGE_KEY = "luauhub:integrations-v2";

function load(): Integration[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function useIntegrations() {
  const [integrations, setIntegrations] = useState<Integration[]>(load);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(integrations));
  }, [integrations]);

  const createIntegration = useCallback((data: Omit<Integration, "id" | "createdAt">) => {
    const next: Integration = {
      ...data,
      id: Math.floor(10000 + Math.random() * 90000).toString(),
      createdAt: new Date().toISOString(),
    };
    setIntegrations((prev) => [...prev, next]);
    return next;
  }, []);

  const updateIntegration = useCallback((id: string, data: Partial<Omit<Integration, "id" | "createdAt">>) => {
    setIntegrations((prev) => prev.map((i) => (i.id === id ? { ...i, ...data } : i)));
  }, []);

  const deleteIntegration = useCallback((id: string) => {
    setIntegrations((prev) => prev.filter((i) => i.id !== id));
  }, []);

  return { integrations, createIntegration, updateIntegration, deleteIntegration };
}
