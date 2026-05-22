"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { SiteData } from "@/lib/types";
import { getIcon, getIconUrl } from "@/lib/icons";
import {
  renameCategoryAction,
  deleteCategoryAction,
  updateCategoryOrderAction,
} from "@/app/dash/actions";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ArrowDown, ArrowUp, Pencil, Trash2, Loader2, Save, AlertTriangle } from "lucide-react";

export function AdminCategories({
  sites,
  categories,
  defaultCategory,
}: {
  sites: SiteData[];
  categories: string[];
  defaultCategory: string;
}) {
  const router = useRouter();
  const categoryStats = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of sites) map.set(s.category, (map.get(s.category) || 0) + 1);
    return categories.map((category) => [category, map.get(category) || 0] as const);
  }, [sites, categories]);

  const moveCategory = useCallback(async (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= categories.length) return;
    const next = [...categories];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    const result = await updateCategoryOrderAction(next);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("分类排序已保存");
    router.refresh();
  }, [categories, router]);

  // 重命名
  const [renameTarget, setRenameTarget] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renaming, setRenaming] = useState(false);

  const openRename = (name: string) => {
    setRenameTarget(name);
    setRenameValue(name);
  };

  const handleRename = useCallback(async () => {
    if (!renameTarget) return;
    setRenaming(true);
    try {
      const result = await renameCategoryAction(renameTarget, renameValue);
      if (!result.success) { toast.error(result.error); return; }
      toast.success(`已重命名为「${renameValue}」`);
      setRenameTarget(null);
      router.refresh();
    } finally { setRenaming(false); }
  }, [renameTarget, renameValue, router]);

  // 删除
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deletingItem, setDeletingItem] = useState(false);

  const handleDeleteItem = useCallback(async () => {
    if (!deleteTarget) return;
    setDeletingItem(true);
    try {
      const result = await deleteCategoryAction(deleteTarget);
      if (!result.success) { toast.error(result.error); return; }
      toast.success("分类及其站点已删除");
      setDeleteTarget(null);
      router.refresh();
    } finally { setDeletingItem(false); }
  }, [deleteTarget, router]);

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        {categoryStats.length === 0 ? (
          <div className="col-span-full rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">
            暂无分类
          </div>
        ) : (
          categoryStats.map(([cat, count], index) => {
            const catSites = sites.filter((s) => s.category === cat);
            return (
              <div
                key={cat}
                className="group rounded-lg border bg-card p-4 transition-colors hover:bg-accent/20"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium">{cat}</div>
                      {defaultCategory === cat && (
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">默认</span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">{count} 个站点</div>
                  </div>
                  <div className="flex gap-1 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
                    <Button variant="ghost" size="icon-sm" disabled={index === 0} onClick={() => moveCategory(index, -1)}>
                      <ArrowUp className="size-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" disabled={index === categoryStats.length - 1} onClick={() => moveCategory(index, 1)}>
                      <ArrowDown className="size-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => openRename(cat)}>
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => setDeleteTarget(cat)}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {catSites.slice(0, 3).map((site) => {
                    const Icon = getIcon(site.icon);
                    return (
                      <div key={site.id} className="flex items-center gap-2">
                        {site.icon_url ? (
                          <img src={getIconUrl(site.icon_url)} alt="" className="size-4 shrink-0 rounded object-contain" />
                        ) : (
                          <Icon className="size-3.5 text-muted-foreground/60" />
                        )}
                        <span className="truncate text-xs text-muted-foreground">{site.name}</span>
                      </div>
                    );
                  })}
                  {catSites.length > 3 && (
                    <div className="text-[10px] text-muted-foreground/50">
                      还有 {catSites.length - 3} 个…
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 重命名分类弹窗 */}
      <Dialog open={!!renameTarget} onOpenChange={(open) => !open && setRenameTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>重命名分类</DialogTitle>
            <DialogDescription>
              将「{renameTarget}」重命名为新名称
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-2">
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              placeholder="输入新名称"
              onKeyDown={(e) => e.key === "Enter" && handleRename()}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setRenameTarget(null)}>
              取消
            </Button>
            <Button size="sm" onClick={handleRename} disabled={renaming || !renameValue.trim()}>
              {renaming ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
              确认
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 删除分类确认弹窗 */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-destructive" />
              确认删除
            </DialogTitle>
            <DialogDescription>
              确定要删除分类「{deleteTarget}」吗？该分类下的所有站点也会被删除。
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>
              取消
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteItem}
              disabled={deletingItem}
            >
              {deletingItem ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
              删除
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
