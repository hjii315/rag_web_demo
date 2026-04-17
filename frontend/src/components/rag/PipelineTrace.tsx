import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResultCard } from "@/components/search/ResultCard";
import type { DoneEvent, SearchResult } from "@/types/api";

interface Props {
  chunks: SearchResult[];
  prompt: string;
  tokenCount: number;
  retrievalLatency: number | null;
  done: DoneEvent | null;
}

function Section({ title, badge, children }: { title: string; badge?: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/50 transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="flex items-center gap-2">
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          {title}
        </span>
        {badge && <Badge variant="secondary">{badge}</Badge>}
      </button>
      {open && <div className="px-4 pb-4 pt-1 space-y-2">{children}</div>}
    </div>
  );
}

export function PipelineTrace({ chunks, prompt, tokenCount, retrievalLatency, done }: Props) {
  if (chunks.length === 0 && !prompt && !done) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pipeline Trace</p>

      {chunks.length > 0 && (
        <Section
          title={`1. Retrieval — ${chunks.length}개 청크`}
          badge={retrievalLatency !== null ? `${retrievalLatency.toFixed(1)}ms` : undefined}
        >
          {chunks.map((c, i) => (
            <ResultCard key={c.id} result={c} rank={i + 1} />
          ))}
        </Section>
      )}

      {prompt && (
        <Section title="2. Prompt" badge={`~${tokenCount} tokens`}>
          <pre className="text-xs bg-muted rounded p-3 overflow-auto max-h-60 whitespace-pre-wrap">
            {prompt}
          </pre>
        </Section>
      )}

      {done && (
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm text-green-800">완료</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3 text-xs text-green-700">
            <span>총 소요: {done.total_latency_ms.toFixed(0)}ms</span>
            <span>입력 토큰: {done.input_tokens}</span>
            <span>출력 토큰: {done.output_tokens}</span>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
