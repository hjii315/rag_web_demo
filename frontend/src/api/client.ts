const BASE_URL: string = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),

  /** multipart/form-data 업로드 (Content-Type 헤더 제외) */
  postForm: <T>(path: string, form: FormData) =>
    fetch(`${BASE_URL}${path}`, { method: "POST", body: form }).then(async (res) => {
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<T>;
    }),

  /** SSE 스트림 URL 반환 */
  sseUrl: (path: string) => `${BASE_URL}${path}`,
};
