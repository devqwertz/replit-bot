import { useState, useEffect, useCallback } from "react";

export type KeyStatus = "active" | "used" | "expired" | "disabled";

export interface Key {
  id: string;
  value: string;
  keyName: string;
  providerId: string;
  serviceId: string;
  hwid: string;
  permanent: boolean;
  premium: boolean;
  oneTimeUse: boolean;
  expiryOnFirstUse: boolean;
  noHwidBinding: boolean;
  hwidLimit: number;
  validityMinutes: number;
  status: KeyStatus;
  createdAt: string;
  expiresAt: string | null;
  lastUsed: string | null;
  userInfo: string;
  ipAddress: string;
}

const STORAGE_KEY = "luauhub:keys-v1";

function load(): Key[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function useKeys() {
  const [keys, setKeys] = useState<Key[]>(load);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
  }, [keys]);

  const createKey = useCallback((data: {
    keyName?: string;
    providerId: string;
    serviceId?: string;
    hwid?: string;
    permanent?: boolean;
    premium?: boolean;
    oneTimeUse?: boolean;
    expiryOnFirstUse?: boolean;
    noHwidBinding?: boolean;
    hwidLimit?: number;
    validityMinutes: number;
  }) => {
    const now = new Date();
    const expiresAt = data.permanent
      ? null
      : new Date(now.getTime() + (data.validityMinutes || 60) * 60000).toISOString();

    const next: Key = {
      id: Math.floor(10000 + Math.random() * 90000).toString(),
      value: crypto.randomUUID(),
      keyName: data.keyName ?? "",
      providerId: data.providerId,
      serviceId: data.serviceId ?? "",
      hwid: data.hwid ?? "",
      permanent: data.permanent ?? false,
      premium: data.premium ?? false,
      oneTimeUse: data.oneTimeUse ?? false,
      expiryOnFirstUse: data.expiryOnFirstUse ?? false,
      noHwidBinding: data.noHwidBinding ?? false,
      hwidLimit: data.hwidLimit ?? 1,
      validityMinutes: data.validityMinutes,
      status: "active",
      createdAt: now.toISOString(),
      expiresAt,
      lastUsed: null,
      userInfo: "",
      ipAddress: "",
    };
    setKeys((prev) => [...prev, next]);
    return next;
  }, []);

  const updateKey = useCallback((id: string, data: Partial<Key>) => {
    setKeys((prev) => prev.map((k) => (k.id === id ? { ...k, ...data } : k)));
  }, []);

  const deleteKey = useCallback((id: string) => {
    setKeys((prev) => prev.filter((k) => k.id !== id));
  }, []);

  const deleteExpired = useCallback(() => {
    setKeys((prev) => prev.filter((k) => k.status !== "expired"));
  }, []);

  return { keys, createKey, updateKey, deleteKey, deleteExpired };
}
