import { Check, Link2, Plus } from "lucide-react";
import {
  type ProductInfo,
  type ProjectDetail,
  type ProjectStatus,
  type VideoType
} from "@/data/mockProjects";
import { Badge, Button, FieldLabel, InputShell, Panel } from "@/components/ui";
import { cn } from "@/lib/utils";

const projectStatuses: ProjectStatus[] = [
  "企画中",
  "撮影前",
  "撮影中",
  "編集中",
  "公開済み"
];

function parseTagInput(value: string) {
  return value
    .split(/[、,]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function ProjectInfoCard({
  project,
  onProductChange,
  onProjectMetaChange,
  storageStatus
}: {
  project: ProjectDetail;
  onProductChange: (updates: Partial<ProductInfo>) => void;
  onProjectMetaChange: (updates: Partial<ProjectDetail>) => void;
  storageStatus: string;
}) {
  const { product } = project;

  return (
    <Panel className="animate-rise" style={{ "--delay": 0 } as React.CSSProperties}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-white">プロジェクト情報</h2>
        <label className="inline-flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">状態</span>
          <select
            value={project.status}
            onChange={(event) =>
              onProjectMetaChange({ status: event.target.value as ProjectStatus })
            }
            className="h-9 rounded-xl border border-violet-400/35 bg-violet-400/10 px-2.5 text-xs font-semibold text-violet-100 outline-none"
          >
            {projectStatuses.map((status) => (
              <option key={status} value={status} className="bg-slate-950">
                {status}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-[12rem_minmax(0,1fr)]">
        <div className="min-w-0">
          <div className="ring-visual aspect-[4/4.55] rounded-2xl border border-slate-700/60" />
          <Button variant="soft" className="mt-3 w-full">
            画像を変更
          </Button>
        </div>

        <div className="grid min-w-0 content-start gap-3">
          <FieldLabel label="商品名">
            <InputShell>
              <input
                value={product.name}
                onChange={(event) => onProductChange({ name: event.target.value })}
                className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-600"
              />
            </InputShell>
          </FieldLabel>

          <FieldLabel label="公式URL">
            <InputShell className="flex items-center justify-between gap-3">
              <input
                value={product.officialUrl}
                onChange={(event) =>
                  onProductChange({ officialUrl: event.target.value })
                }
                className="min-w-0 flex-1 bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-600"
              />
              <Link2 className="size-4 shrink-0 text-slate-500" />
            </InputShell>
          </FieldLabel>

          <div className="grid gap-2">
            <span className="text-xs font-semibold text-slate-400">
              特徴・ポイント
            </span>
            <InputShell className="py-2.5">
              <input
                value={product.tags.join("、")}
                onChange={(event) =>
                  onProductChange({ tags: parseTagInput(event.target.value) })
                }
                className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-600"
                aria-label="特徴タグ"
              />
            </InputShell>
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag, index) => (
                <Badge
                  key={tag}
                  tone={index % 3 === 0 ? "violet" : index % 3 === 1 ? "slate" : "cyan"}
                >
                  {tag}
                </Badge>
              ))}
              <Badge className="gap-1 text-slate-400">
                <Plus className="size-3" />
                追加
              </Badge>
            </div>
          </div>

          <FieldLabel label="ターゲット">
            <textarea
              value={product.targetAudience}
              onChange={(event) =>
                onProductChange({ targetAudience: event.target.value })
              }
              className="min-h-16 resize-none rounded-xl border border-slate-700/70 bg-white/[0.055] px-3.5 py-3 text-sm leading-relaxed text-slate-100 shadow-studio-inset outline-none transition placeholder:text-slate-600 focus:border-violet-400/60"
            />
          </FieldLabel>
        </div>

        <div className="grid min-w-0 gap-3 md:col-span-2">
          <div className="grid gap-2">
            <span className="text-xs font-semibold text-slate-400">動画タイプ</span>
            <div className="flex flex-wrap gap-2">
              {product.videoTypes.map((type) => (
                <label
                  key={type}
                  className={cn(
                    "inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition",
                    type === product.selectedVideoType
                      ? "border-violet-400/45 bg-violet-500/13 text-violet-100"
                      : "border-slate-700/70 bg-slate-950/30 text-slate-300 hover:bg-white/[0.05]"
                  )}
                >
                  <input
                    type="radio"
                    name={`videoType-${project.id}`}
                    checked={type === product.selectedVideoType}
                    onChange={() =>
                      onProductChange({ selectedVideoType: type as VideoType })
                    }
                    className="size-3.5 accent-studio-violet"
                  />
                  {type}
                </label>
              ))}
            </div>
          </div>

          <FieldLabel label="メモ（任意）">
            <textarea
              value={product.memo}
              onChange={(event) => onProductChange({ memo: event.target.value })}
              className="min-h-14 resize-none rounded-xl border border-slate-700/70 bg-white/[0.055] px-3.5 py-3 text-sm text-slate-100 shadow-studio-inset outline-none transition placeholder:text-slate-600 focus:border-violet-400/60"
              placeholder={product.memoPlaceholder}
            />
          </FieldLabel>

          <div className="flex items-center gap-2 rounded-xl border border-emerald-300/20 bg-emerald-300/8 px-3 py-2 text-xs text-emerald-100">
            <Check className="size-4" />
            {storageStatus}
          </div>
        </div>
      </div>
    </Panel>
  );
}
