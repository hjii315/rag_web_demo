import { useCallback, useState } from "react";
import { api } from "@/api/client";
import type {
  Chunk,
  ChunkingConfig,
  ChunkPreviewResponse,
  DocumentInfo,
} from "@/types/api";

export function useDocuments(collectionName: string) {
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    if (!collectionName) return;
    setLoading(true);
    try {
      const data = await api.get<DocumentInfo[]>(
        `/api/collections/${collectionName}/documents`
      );
      setDocuments(data);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [collectionName]);

  const previewChunks = useCallback(
    async (file: File, config: ChunkingConfig): Promise<Chunk[]> => {
      const form = new FormData();
      form.append("file", file);
      form.append("strategy", config.strategy);
      form.append("chunk_size", String(config.chunk_size));
      form.append("overlap", String(config.overlap));
      const res = await api.postForm<ChunkPreviewResponse>(
        `/api/collections/${collectionName}/documents/preview`,
        form
      );
      return res.chunks;
    },
    [collectionName]
  );

  const ingest = useCallback(
    async (
      file: File,
      config: ChunkingConfig,
      metadata: Record<string, string>
    ) => {
      const form = new FormData();
      form.append("file", file);
      form.append("strategy", config.strategy);
      form.append("chunk_size", String(config.chunk_size));
      form.append("overlap", String(config.overlap));
      form.append("metadata", JSON.stringify(metadata));
      const result = await api.postForm<{ document_id: string; chunk_count: number }>(
        `/api/collections/${collectionName}/documents`,
        form
      );
      await fetchDocuments();
      return result;
    },
    [collectionName, fetchDocuments]
  );

  const remove = useCallback(
    async (docId: string) => {
      await api.delete(
        `/api/collections/${collectionName}/documents/${docId}`
      );
      await fetchDocuments();
    },
    [collectionName, fetchDocuments]
  );

  return { documents, loading, error, fetchDocuments, previewChunks, ingest, remove };
}
