import { useState, useEffect, useCallback } from "react";

export interface Provider {
  id: string;
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
  createdAt: string;
}

const STORAGE_KEY = "luauhub:providers-v1";

function load(): Provider[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function useProviders() {
  const [providers, setProviders] = useState<Provider[]>(load);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(providers));
  }, [providers]);

  const createProvider = useCallback((data: Omit<Provider, "id" | "createdAt">) => {
    const next: Provider = {
      ...data,
      id: Math.floor(10000 + Math.random() * 90000).toString(),
      createdAt: new Date().toISOString(),
    };
    setProviders((prev) => [...prev, next]);
    return next;
  }, []);

  const updateProvider = useCallback((id: string, data: Partial<Omit<Provider, "id" | "createdAt">>) => {
    setProviders((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)));
  }, []);

  const deleteProvider = useCallback((id: string) => {
    setProviders((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return { providers, createProvider, updateProvider, deleteProvider };
}
