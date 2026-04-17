import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SearchResult } from "@/types/api";

interface Props {
  result: SearchResult;
  rank: number;
}

function ScoreBar({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color =
    score >= 0.8 ? "bg-green-500" : score >= 0.5 ? "bg-yellow-400" : "bg-red-400";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono w-10 text-right">{score.toFixed(3)}</span>
    </div>
  );
}

export function ResultCard({ result, rank }: Props) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm">
            #{rank} · {result.filename}
          </CardTitle>
          <Badge variant="outline" className="shrink-0">
            chunk {result.chunk_index + 1}/{result.total_chunks}
          </Badge>
        </div>
        <ScoreBar score={result.score} />
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap line-clamp-5">
          {result.text}
        </p>
        <div className="mt-2 flex flex-wrap gap-1">
          <Badge variant="secondary" className="text-xs">{result.strategy}</Badge>
          <Badge variant="secondary" className="text-xs">size={result.chunk_size}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
