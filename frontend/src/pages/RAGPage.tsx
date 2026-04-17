import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TokenStream } from "@/components/rag/TokenStream";
import { PipelineTrace } from "@/components/rag/PipelineTrace";
import { ComparePanel } from "@/components/rag/ComparePanel";
import { useCollections } from "@/hooks/useCollections";
import { useSSE } from "@/hooks/useSSE";
import type { RAGRequest, SearchMode } from "@/types/api";

export function RAGPage() {
  const { collections } = useCollections();
  const [collectionName, setCollectionName] = useState("");
  const [query, setQuery] = useState("");
  const [topK, setTopK] = useState(5);
  const [mode, setMode] = useState<SearchMode>("vector");
  const { state, start, reset } = useSSE();

  const handleRun = () => {
    if (!query.trim() || !collectionName) return;
    reset();
    const body: RAGRequest = { query, top_k: topK, mode };
    start(`http://localhost:8000/api/collections/${collectionName}/rag`, body);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">RAG Pipeline</h1>

      <Card>
        <CardHeader><CardTitle className="text-base">쿼리 설정</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>컬렉션</Label>
            <Select value={collectionName} onValueChange={setCollectionName}>
              <SelectTrigger><SelectValue placeholder="컬렉션 선택…" /></SelectTrigger>
              <SelectContent>
                {collections.map((c) => (
                  <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <div className="flex-1 space-y-1.5">
              <Label>질문</Label>
              <Input
                placeholder="문서에 대해 질문하세요…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRun()}
              />
            </div>
            <div className="w-20 space-y-1.5">
              <Label>Top-K</Label>
              <Input type="number" min={1} max={20} value={topK} onChange={(e) => setTopK(Number(e.target.value))} />
            </div>
          </div>

          <div className="flex gap-2 items-end">
            <div className="space-y-1.5">
              <Label>검색 모드</Label>
              <Tabs value={mode} onValueChange={(v) => setMode(v as SearchMode)}>
                <TabsList>
                  <TabsTrigger value="vector">Vector</TabsTrigger>
                  <TabsTrigger value="hybrid">Hybrid</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <Button onClick={handleRun} disabled={state.streaming || !query.trim() || !collectionName}>
              {state.streaming ? "생성 중…" : "실행"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="stream">
        <TabsList>
          <TabsTrigger value="stream">답변 스트림</TabsTrigger>
          <TabsTrigger value="trace">Pipeline Trace</TabsTrigger>
          <TabsTrigger value="compare">RAG vs No-RAG</TabsTrigger>
        </TabsList>

        <TabsContent value="stream" className="mt-4 space-y-4">
          {state.error && <p className="text-destructive text-sm">{state.error}</p>}
          <TokenStream answer={state.answer} streaming={state.streaming} />
        </TabsContent>

        <TabsContent value="trace" className="mt-4">
          <PipelineTrace
            chunks={state.chunks}
            prompt={state.prompt}
            tokenCount={state.tokenCount}
            retrievalLatency={state.retrievalLatency}
            done={state.done}
          />
        </TabsContent>

        <TabsContent value="compare" className="mt-4">
          {collectionName ? (
            <ComparePanel collectionName={collectionName} query={query} topK={topK} ragAnswer={state.answer} />
          ) : (
            <p className="text-sm text-muted-foreground">컬렉션을 먼저 선택하세요.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
