import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Chunk } from "@/types/api";

interface Props {
  chunks: Chunk[];
  strategy: string;
  chunkSize: number;
}

const COLORS = [
  "bg-blue-50 border-blue-200",
  "bg-green-50 border-green-200",
  "bg-purple-50 border-purple-200",
  "bg-orange-50 border-orange-200",
  "bg-pink-50 border-pink-200",
];

export function ChunkPreview({ chunks, strategy, chunkSize }: Props) {
  if (chunks.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Badge variant="secondary">{strategy}</Badge>
        <span>chunk_size={chunkSize}</span>
        <span>·</span>
        <span className="font-medium text-foreground">{chunks.length}개 청크</span>
      </div>

      <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
        {chunks.map((chunk) => (
          <Card
            key={chunk.index}
            className={`border ${COLORS[chunk.index % COLORS.length]}`}
          >
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-muted-foreground">
                  #{chunk.index + 1}
                </span>
                <span className="text-xs text-muted-foreground">
                  {chunk.char_count}자
                </span>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap line-clamp-4">
                {chunk.text}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
