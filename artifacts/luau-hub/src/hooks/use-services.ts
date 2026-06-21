import { useState, useEffect, useCallback } from "react";

export interface Service {
  id: string;
  name: string;
  description: string;
  premium: boolean;
  keylessMode: boolean;
  keylessWeekdays: number[];
  createdAt: string;
}

const STORAGE_KEY = "luauhub:services";

function load(): Service[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(services: Service[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(services));
}

export function useServices() {
  const [services, setServices] = useState<Service[]>(load);

  useEffect(() => {
    save(services);
  }, [services]);

  const createService = useCallback((data: Omit<Service, "id" | "createdAt">) => {
    const next: Service = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setServices((prev) => [...prev, next]);
    return next;
  }, []);

  const updateService = useCallback((id: string, data: Partial<Omit<Service, "id" | "createdAt">>) => {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...data } : s))
    );
  }, []);

  const deleteService = useCallback((id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return { services, createService, updateService, deleteService };
}
