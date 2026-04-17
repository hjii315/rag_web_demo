import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import type { ChunkingConfig, ChunkStrategy as Strategy } from "@/types/api";

interface Props {
  config: ChunkingConfig;
  onChange: (cfg: ChunkingConfig) => void;
}

const STRATEGIES: { value: Strategy; label: string; desc: string }[] = [
  { value: "fixed", label: "Fixed", desc: "글자 수 기준 고정 크기 분할" },
  { value: "sentence", label: "Sentence", desc: "문장 단위 분할 (NLTK)" },
  { value: "recursive", label: "Recursive", desc: "단락→문장→단어 계층 분할" },
];

export function ChunkStrategy({ config, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>청킹 전략</Label>
        <Select
          value={config.strategy}
          onValueChange={(v) => onChange({ ...config, strategy: v as Strategy })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STRATEGIES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                <span className="font-medium">{s.label}</span>
                <span className="ml-2 text-xs text-muted-foreground">{s.desc}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>청크 크기 (글자)</Label>
          <Input
            type="number"
            min={50}
            max={4000}
            value={config.chunk_size}
            onChange={(e) => onChange({ ...config, chunk_size: Number(e.target.value) })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>오버랩 (글자)</Label>
          <Input
            type="number"
            min={0}
            max={500}
            value={config.overlap}
            onChange={(e) => onChange({ ...config, overlap: Number(e.target.value) })}
          />
        </div>
      </div>
    </div>
  );
}
