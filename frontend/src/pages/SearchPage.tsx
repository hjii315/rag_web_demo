import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResultCard } from "@/components/search/ResultCard";
import { FilterBuilder } from "@/components/search/FilterBuilder";
import { useCollections } from "@/hooks/useCollections";
import { api } from "@/api/client";
import type { SearchMode, SearchResponse } from "@/types/api";

export function SearchPage() {
  const { collections } = useCollections();
  const [collectionName, setCollectionName] = useState("");
  const [query, setQuery] = useState("");
  const [topK, setTopK] = useState(5);
  const [mode, setMode] = useState<SearchMode>("vector");
  const [filters, setFilters] = useState<Record<string, string> | null>(null);
  const [response, setResponse] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim() || !collectionName) return;
    setLoading(true);
    try {
      const res = await api.post<SearchResponse>(
        `/api/collections/${collectionName}/search`,
        { query, top_k: topK, mode, filters }
      );
      setResponse(res);
    } catch (e) {
      alert(String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Vector Search</h1>

      <Card>
        <CardHeader><CardTitle className="text-base">검색 설정</CardTitle></CardHeader>
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

          <div className="space-y-1.5">
            <Label>검색 모드</Label>
            <Tabs value={mode} onValueChange={(v) => setMode(v as SearchMode)}>
              <TabsList>
                <TabsTrigger value="vector">Vector</TabsTrigger>
                <TabsTrigger value="hybrid">Hybrid (RRF)</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="flex gap-2">
            <div className="flex-1 space-y-1.5">
              <Label>질문</Label>
              <Input
                placeholder="검색할 내용 입력…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <div className="w-20 space-y-1.5">
              <Label>Top-K</Label>
              <Input
                type="number"
                min={1}
                max={20}
                value={topK}
                onChange={(e) => setTopK(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>메타데이터 필터 (선택)</Label>
            <FilterBuilder onChange={(f) => setFilters(f as Record<string, string> | null)} />
          </div>

          <Button onClick={handleSearch} disabled={loading || !query.trim() || !collectionName}>
            <Search className="h-4 w-4 mr-1" />
            {loading ? "검색 중…" : "검색"}
          </Button>
        </CardContent>
      </Card>

      {response && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{response.results.length}개 결과</span>
            <span>{response.latency_ms.toFixed(1)}ms · {response.mode}</span>
          </div>
          {response.results.map((r, i) => (
            <ResultCard key={r.id} result={r} rank={i + 1} />
          ))}
          {response.results.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">결과 없음</p>
          )}
        </div>
      )}
    </div>
  );
}
