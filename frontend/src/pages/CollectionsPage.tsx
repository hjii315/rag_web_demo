import { useState } from "react";
import { Trash2, Database, RefreshCw, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useCollections } from "@/hooks/useCollections";

export function CollectionsPage() {
  const { collections, loading, error, refresh, create, remove, updateMeta } = useCollections();
  const [newName, setNewName] = useState("");
  const [newPrompt, setNewPrompt] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState("");

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await create(newName.trim(), newPrompt.trim());
      setNewName("");
      setNewPrompt("");
    } catch (e) {
      alert(String(e));
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (name: string) => {
    if (!confirm(`"${name}" 컬렉션을 삭제하시겠습니까?`)) return;
    try {
      await remove(name);
    } catch (e) {
      alert(String(e));
    }
  };

  const startEdit = (name: string, currentPrompt: string) => {
    setEditingName(name);
    setEditPrompt(currentPrompt);
  };

  const handleSavePrompt = async (name: string) => {
    try {
      await updateMeta(name, editPrompt);
      setEditingName(null);
    } catch (e) {
      alert(String(e));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Collections</h1>
        <Button variant="ghost" size="icon" onClick={refresh} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* 생성 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">새 컬렉션 생성</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="컬렉션 이름 (영문, 숫자, 언더스코어)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
            <Button onClick={handleCreate} disabled={creating || !newName.trim()}>
              생성
            </Button>
          </div>
          <Textarea
            placeholder="System Prompt (선택 — 비워두면 기본 프롬프트 사용)"
            value={newPrompt}
            onChange={(e) => setNewPrompt(e.target.value)}
            className="min-h-[80px] text-sm"
          />
        </CardContent>
      </Card>

      {/* 목록 */}
      {error && <p className="text-destructive text-sm">{error}</p>}

      {collections.length === 0 && !loading && (
        <p className="text-muted-foreground text-sm text-center py-12">
          컬렉션이 없습니다. 위에서 생성해보세요.
        </p>
      )}

      <div className="grid gap-3">
        {collections.map((col) => (
          <Card key={col.name}>
            <CardContent className="py-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Database className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <p className="font-medium">{col.name}</p>
                    <div className="flex gap-2 mt-0.5">
                      <Badge variant="outline" className="text-xs">
                        {col.vectors_count.toLocaleString()} vectors
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => startEdit(col.name, col.system_prompt)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(col.name)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* System Prompt 표시/편집 */}
              {editingName === col.name ? (
                <div className="space-y-2">
                  <Textarea
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    className="min-h-[100px] text-sm"
                    placeholder="System Prompt (비워두면 기본값 사용)"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleSavePrompt(col.name)}>
                      <Check className="h-3.5 w-3.5 mr-1" /> 저장
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingName(null)}>
                      <X className="h-3.5 w-3.5 mr-1" /> 취소
                    </Button>
                  </div>
                </div>
              ) : col.system_prompt ? (
                <p className="text-xs text-muted-foreground bg-muted rounded px-3 py-2 whitespace-pre-wrap line-clamp-3">
                  {col.system_prompt}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground italic">기본 프롬프트 사용 중</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
