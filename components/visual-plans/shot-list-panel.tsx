import { Check, Copy, ListChecks } from "lucide-react";
import type { ShotListItem } from "@/data/mockProjects";
import { Button } from "@/components/ui";

export function ShotListPanel({
  shotList,
  onShotListChange,
  onCopyShotList
}: {
  shotList: ShotListItem[];
  onShotListChange: (itemId: string, updates: Partial<ShotListItem>) => void;
  onCopyShotList: () => void;
}) {
  const checkedCount = shotList.filter((item) => item.checked).length;

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-950/28 p-4">
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-base font-bold text-white">
            <ListChecks className="size-5 text-violet-200" />
            撮影カットリスト（提案）
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {checkedCount} / {shotList.length} カットを準備済み
          </p>
        </div>
        <Button type="button" variant="soft" className="h-10" onClick={onCopyShotList}>
          <Copy className="size-4" />
          カットリストをコピー
        </Button>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {shotList.map((item) => (
          <label
            key={item.id}
            className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-slate-800 bg-white/[0.035] px-3 text-sm text-slate-200 transition hover:border-slate-600 hover:bg-white/[0.06]"
          >
            <input
              type="checkbox"
              checked={item.checked}
              onChange={(event) =>
                onShotListChange(item.id, { checked: event.target.checked })
              }
              className="sr-only"
            />
            <span className="grid size-4 shrink-0 place-items-center rounded border border-violet-300/40 bg-violet-400/15 text-violet-100">
              {item.checked ? <Check className="size-3" /> : null}
            </span>
            <input
              value={item.label}
              onChange={(event) => onShotListChange(item.id, { label: event.target.value })}
              className="min-w-0 flex-1 bg-transparent outline-none"
            />
          </label>
        ))}
      </div>
    </section>
  );
}
