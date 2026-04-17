import { useCallback, useEffect, useState } from "react";
import { api } from "@/api/client";
import type { CollectionInfo } from "@/types/api";

export function useCollections() {
  const [collections, setCollections] = useState<CollectionInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<CollectionInfo[]>("/api/collections");
      setCollections(data);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = useCallback(
    async (name: string, system_prompt?: string) => {
      await api.post("/api/collections", { name, system_prompt: system_prompt ?? "" });
      await refresh();
    },
    [refresh]
  );

  const remove = useCallback(
    async (name: string) => {
      await api.delete(`/api/collections/${name}`);
      await refresh();
    },
    [refresh]
  );

  const updateMeta = useCallback(
    async (name: string, system_prompt: string) => {
      await api.patch(`/api/collections/${name}/meta`, { system_prompt });
      await refresh();
    },
    [refresh]
  );

  return { collections, loading, error, refresh, create, remove, updateMeta };
}
