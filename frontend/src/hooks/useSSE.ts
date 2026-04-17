import { useCallback, useRef, useState } from "react";
import type {
  DoneEvent,
  SearchResult,
  TokenEvent,
  TracePromptEvent,
  TraceRetrievalEvent,
} from "@/types/api";

export interface SSEState {
  answer: string;
  chunks: SearchResult[];
  prompt: string;
  tokenCount: number;
  retrievalLatency: number | null;
  done: DoneEvent | null;
  error: string | null;
  streaming: boolean;
}

const initialState: SSEState = {
  answer: "",
  chunks: [],
  prompt: "",
  tokenCount: 0,
  retrievalLatency: null,
  done: null,
  error: null,
  streaming: false,
};

export function useSSE() {
  const [state, setState] = useState<SSEState>(initialState);
  const esRef = useRef<EventSource | null>(null);

  const reset = useCallback(() => setState(initialState), []);

  const start = useCallback((url: string, body: unknown) => {
    // EventSource는 POST를 지원하지 않으므로 fetch + ReadableStream 사용
    esRef.current?.close();
    setState({ ...initialState, streaming: true });

    (async () => {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const text = await res.text();
          setState((s) => ({ ...s, error: text, streaming: false }));
          return;
        }

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          // SSE 파싱: 빈 줄로 이벤트 구분
          const parts = buffer.split("\n\n");
          buffer = parts.pop() ?? "";

          for (const part of parts) {
            const lines = part.split("\n");
            let eventName = "";
            let dataStr = "";
            for (const line of lines) {
              if (line.startsWith("event: ")) eventName = line.slice(7).trim();
              if (line.startsWith("data: ")) dataStr = line.slice(6).trim();
            }
            if (!dataStr) continue;

            const data = JSON.parse(dataStr);

            if (eventName === "trace") {
              if (data.stage === "retrieval") {
                const ev = data as TraceRetrievalEvent;
                setState((s) => ({
                  ...s,
                  chunks: ev.chunks,
                  retrievalLatency: ev.latency_ms,
                }));
              } else if (data.stage === "prompt_built") {
                const ev = data as TracePromptEvent;
                setState((s) => ({
                  ...s,
                  prompt: ev.prompt,
                  tokenCount: ev.token_count,
                }));
              }
            } else if (eventName === "token") {
              const ev = data as TokenEvent;
              setState((s) => ({ ...s, answer: s.answer + ev.text }));
            } else if (eventName === "done") {
              setState((s) => ({
                ...s,
                done: data as DoneEvent,
                streaming: false,
              }));
            }
          }
        }
      } catch (e) {
        setState((s) => ({
          ...s,
          error: String(e),
          streaming: false,
        }));
      }
    })();
  }, []);

  const stop = useCallback(() => {
    esRef.current?.close();
    setState((s) => ({ ...s, streaming: false }));
  }, []);

  return { state, start, stop, reset };
}
