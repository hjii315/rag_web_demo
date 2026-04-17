import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TokenStream } from "./TokenStream";
import type { RAGRequest, RAGResponse } from "@/types/api";

interface Props {
  collectionName: string;
  query: string;
  topK: number;
  ragAnswer: string;
}

export function ComparePanel({ collectionName, query, topK, ragAnswer }: Props) {
  const [noRagAnswer, setNoRagAnswer] = useState("");
  const [noRagLoading, setNoRagLoading] = useState(false);

  const runNoRag = async () => {
    setNoRagLoading(true);
    setNoRagAnswer("");
    try {
      // No-RAG: sync 엔드포인트에 빈 컨텍스트로 직접 Claude 호출 (별도 엔드포인트 없으므로 top_k=0 흉내)
      const res = await fetch("http://localhost:8000/api/collections/" + collectionName + "/rag/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, top_k: 1, mode: "vector", include_no_rag: true } satisfies RAGRequest),
      });
      const data: RAGResponse = await res.json();
      setNoRagAnswer(data.answer);
    } catch (e) {
      setNoRagAnswer(String(e));
    } finally {
      setNoRagLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button variant="outline" onClick={runNoRag} disabled={noRagLoading || !query}>
          No-RAG 비교
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-blue-600">RAG (컨텍스트 있음)</p>
          <TokenStream answer={ragAnswer} streaming={false} />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-semibold text-gray-500">No-RAG (컨텍스트 없음)</p>
          <TokenStream answer={noRagAnswer} streaming={noRagLoading} />
        </div>
      </div>
    </div>
  );
}
