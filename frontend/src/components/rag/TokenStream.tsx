import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

interface Props {
  answer: string;
  streaming: boolean;
}

export function TokenStream({ answer, streaming }: Props) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [answer]);

  if (!answer && !streaming) return null;

  return (
    <div className="rounded-lg border bg-muted/30 p-4 min-h-[120px] relative">
      <p className="text-sm leading-relaxed whitespace-pre-wrap">{answer}</p>
      {streaming && (
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground mt-1">
          <Loader2 className="h-3 w-3 animate-spin" /> 생성 중…
        </span>
      )}
      <div ref={endRef} />
    </div>
  );
}
