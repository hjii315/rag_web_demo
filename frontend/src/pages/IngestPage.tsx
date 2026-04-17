import { useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChunkStrategy } from "@/components/chunks/ChunkStrategy";
import { ChunkPreview } from "@/components/chunks/ChunkPreview";
import { useCollections } from "@/hooks/useCollections";
import { useDocuments } from "@/hooks/useDocuments";
import type { Chunk, ChunkingConfig } from "@/types/api";

const DEFAULT_CONFIG: ChunkingConfig = { strategy: "recursive", chunk_size: 500, overlap: 50 };

export function IngestPage() {
  const { collections } = useCollections();
  const [collectionName, setCollectionName] = useState("");
  const { documents, fetchDocuments, previewChunks, ingest, remove } = useDocuments(collectionName);

  const [file, setFile] = useState<File | null>(null);
  const [config, setConfig] = useState<ChunkingConfig>(DEFAULT_CONFIG);
  const [preview, setPreview] = useState<Chunk[]>([]);
  const [previewing, setPreviewing] = useState(false);
  const [ingesting, setIngesting] = useState(false);

  const handlePreview = async () => {
    if (!file) return;
    setPreviewing(true);
    try {
      const chunks = await previewChunks(file, config);
      setPreview(chunks);
    } catch (e) {
      alert(String(e));
    } finally {
      setPreviewing(false);
    }
  };

  const handleIngest = async () => {
    if (!file || !collectionName) return;
    setIngesting(true);
    try {
      const result = await ingest(file, config, {});
      alert(`완료! document_id=${result.document_id}, ${result.chunk_count}개 청크 저장`);
      setFile(null);
      setPreview([]);
      fetchDocuments();
    } catch (e) {
      alert(String(e));
    } finally {
      setIngesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Document Ingest</h1>

      {/* 컬렉션 선택 */}
      <Card>
        <CardHeader><CardTitle className="text-base">대상 컬렉션</CardTitle></CardHeader>
        <CardContent>
          <Select value={collectionName} onValueChange={(v) => { setCollectionName(v); }}>
            <SelectTrigger>
              <SelectValue placeholder="컬렉션 선택…" />
            </SelectTrigger>
            <SelectContent>
              {collections.map((c) => (
                <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* 파일 업로드 */}
      <Card>
        <CardHeader><CardTitle className="text-base">파일 업로드</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>파일 (TXT / PDF)</Label>
            <Input
              type="file"
              accept=".txt,.pdf"
              onChange={(e) => { setFile(e.target.files?.[0] ?? null); setPreview([]); }}
            />
          </div>

          <ChunkStrategy config={config} onChange={setConfig} />

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handlePreview}
              disabled={!file || previewing || !collectionName}
            >
              {previewing ? "미리보기 중…" : "청킹 미리보기"}
            </Button>
            <Button
              onClick={handleIngest}
              disabled={!file || ingesting || !collectionName}
            >
              <Upload className="h-4 w-4 mr-1" />
              {ingesting ? "저장 중…" : "인제스트"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 청크 미리보기 */}
      {preview.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">청킹 미리보기</CardTitle></CardHeader>
          <CardContent>
            <ChunkPreview chunks={preview} strategy={config.strategy} chunkSize={config.chunk_size} />
          </CardContent>
        </Card>
      )}

      {/* 저장된 문서 목록 */}
      {collectionName && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">저장된 문서</CardTitle>
              <Button variant="ghost" size="sm" onClick={fetchDocuments}>새로고침</Button>
            </div>
          </CardHeader>
          <CardContent>
            {documents.length === 0 ? (
              <p className="text-sm text-muted-foreground">문서 없음</p>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div key={doc.document_id} className="flex items-center justify-between text-sm border rounded-md px-3 py-2">
                    <div>
                      <p className="font-medium">{doc.filename}</p>
                      <p className="text-xs text-muted-foreground">
                        {doc.chunk_count}청크 · {doc.strategy} · size={doc.chunk_size}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => remove(doc.document_id)}
                    >
                      삭제
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
