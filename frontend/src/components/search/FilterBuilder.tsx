import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  onChange: (filters: Record<string, string> | null) => void;
}

export function FilterBuilder({ onChange }: Props) {
  const [pairs, setPairs] = useState<{ key: string; value: string }[]>([]);

  const add = () => {
    const next = [...pairs, { key: "", value: "" }];
    setPairs(next);
    notify(next);
  };

  const remove = (i: number) => {
    const next = pairs.filter((_, idx) => idx !== i);
    setPairs(next);
    notify(next);
  };

  const update = (i: number, field: "key" | "value", val: string) => {
    const next = pairs.map((p, idx) => (idx === i ? { ...p, [field]: val } : p));
    setPairs(next);
    notify(next);
  };

  const notify = (ps: { key: string; value: string }[]) => {
    const valid = ps.filter((p) => p.key.trim() && p.value.trim());
    if (valid.length === 0) { onChange(null); return; }
    onChange(Object.fromEntries(valid.map((p) => [p.key.trim(), p.value.trim()])));
  };

  return (
    <div className="space-y-2">
      {pairs.map((p, i) => (
        <div key={i} className="flex gap-2">
          <Input
            placeholder="key"
            value={p.key}
            onChange={(e) => update(i, "key", e.target.value)}
            className="flex-1"
          />
          <Input
            placeholder="value"
            value={p.value}
            onChange={(e) => update(i, "value", e.target.value)}
            className="flex-1"
          />
          <Button variant="ghost" size="icon" onClick={() => remove(i)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={add}>
        <Plus className="h-4 w-4 mr-1" /> 필터 추가
      </Button>
    </div>
  );
}
