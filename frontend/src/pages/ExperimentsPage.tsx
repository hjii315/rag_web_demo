import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ResultCard } from "@/components/search/ResultCard";
import { useCollections } from "@/hooks/useCollections";
import { api } from "@/api/client";
import type { ChunkSizeExperimentResponse, TopKExperimentResponse } from "@/types/api";

export function ExperimentsPage() {
  const { collections } = useCollections();
  const [collectionName, setCollectionName] = useState("");

  // ── Chunk Size ──────────────────────────────────────────────────────────────
  const [csQuery, setCsQuery] = useState("");
  const [csText, setCsText] = useState("");
  const [csResult, setCsResult] = useState<ChunkSizeExperimentResponse | null>(null);
  const [csLoading, setCsLoading] = useState(false);

  const runChunkSize = async () => {
    if (!csQuery.trim() || !csText.trim() || !collectionName) return;
    setCsLoading(true);
    try {
      const res = await api.post<ChunkSizeExperimentResponse>("/api/experiments/chunk-size", {
        collection_name: collectionName,
        query: csQuery,
        text: csText,
        chunk_sizes: [100, 500, 1000],
        top_k: 3,
      });
      setCsResult(res);
    } catch (e) {
      alert(String(e));
    } finally {
      setCsLoading(false);
    }
  };

  // ── Top-K ───────────────────────────────────────────────────────────────────
  const [tkQuery, setTkQuery] = useState("");
  const [tkResult, setTkResult] = useState<TopKExperimentResponse | null>(null);
  const [tkLoading, setTkLoading] = useState(false);

  const runTopK = async () => {
    if (!tkQuery.trim() || !collectionName) return;
    setTkLoading(true);
    try {
      const res = await api.post<TopKExperimentResponse>("/api/experiments/top-k", {
        collection_name: collectionName,
        query: tkQuery,
        k_values: [1, 5],
      });
      setTkResult(res);
    } catch (e) {
      alert(String(e));
    } finally {
      setTkLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Experiments</h1>

      <div className="space-y-1.5">
        <Label>컬렉션</Label>
        <Select value={collectionName} onValueChange={setCollectionName}>
          <SelectTrigger className="w-64"><SelectValue placeholder="컬렉션 선택…" /></SelectTrigger>
          <SelectContent>
            {collections.map((c) => (
              <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="chunk-size">
        <TabsList>
          <TabsTrigger value="chunk-size">Chunk Size 비교</TabsTrigger>
          <TabsTrigger value="top-k">Top-K 비교</TabsTrigger>
        </TabsList>

        {/* ── Chunk Size ── */}
        <TabsContent value="chunk-size" className="mt-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            같은 텍스트를 100 / 500 / 1000자 단위로 청킹했을 때 검색과 답변이 어떻게 달라지는지 비교합니다.
          </p>
          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="space-y-1.5">
                <Label>질문</Label>
                <Input placeholder="비교할 질문 입력…" value={csQuery} onChange={(e) => setCsQuery(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>실험용 텍스트 (직접 입력)</Label>
                <textarea
                  className="w-full h-32 rounded-md border border-input bg-transparent px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="청킹 실험에 사용할 텍스트를 붙여넣으세요…"
                  value={csText}
                  onChange={(e) => setCsText(e.target.value)}
                />
              </div>
              <Button onClick={runChunkSize} disabled={csLoading || !csQuery || !csText || !collectionName}>
                {csLoading ? "실험 중…" : "실험 시작 (100 / 500 / 1000)"}
              </Button>
            </CardContent>
          </Card>

          {csResult && (
            <div className="grid grid-cols-3 gap-4">
              {csResult.results.map((r) => (
                <div key={r.chunk_size} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge>size={r.chunk_size}</Badge>
                    <span className="text-xs text-muted-foreground">{r.chunks_created}청크</span>
                  </div>
                  <div className="space-y-2">
                    {r.results.map((sr, i) => <ResultCard key={sr.id} result={sr} rank={i + 1} />)}
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">답변</p>
                    <p className="text-sm leading-relaxed">{r.answer}</p>
                    <p className="text-xs text-muted-foreground mt-1">{r.latency_ms.toFixed(0)}ms</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Top-K ── */}
        <TabsContent value="top-k" className="mt-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            k=1 (최상위 1개)과 k=5 (상위 5개)로 검색했을 때 RAG 답변 품질을 비교합니다.
          </p>
          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="space-y-1.5">
                <Label>질문</Label>
                <Input placeholder="비교할 질문 입력…" value={tkQuery} onChange={(e) => setTkQuery(e.target.value)} />
              </div>
              <Button onClick={runTopK} disabled={tkLoading || !tkQuery || !collectionName}>
                {tkLoading ? "실험 중…" : "실험 시작 (k=1 vs k=5)"}
              </Button>
            </CardContent>
          </Card>

          {tkResult && (
            <div className="grid grid-cols-2 gap-4">
              {tkResult.results.map((r) => (
                <div key={r.k} className="space-y-3">
                  <Badge className="text-sm">k = {r.k}</Badge>
                  <div className="space-y-2">
                    {r.results.map((sr, i) => <ResultCard key={sr.id} result={sr} rank={i + 1} />)}
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">답변</p>
                    <p className="text-sm leading-relaxed">{r.answer}</p>
                    <p className="text-xs text-muted-foreground mt-1">{r.latency_ms.toFixed(0)}ms</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
