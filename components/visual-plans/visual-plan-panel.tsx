"use client";

import { useMemo, useState } from "react";
import { Grid2X2, ImagePlus, Rows3 } from "lucide-react";
import type {
  ProjectDetail,
  ShotListItem,
  ThumbnailScene
} from "@/data/mockProjects";
import {
  type VisualPlan,
  type VisualPrompt,
  visualPlanMetrics
} from "@/data/mockVisualPlans";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import { PromptBuilderCard } from "@/components/visual-plans/visual-prompt-card";
import { ShotListPanel } from "@/components/visual-plans/shot-list-panel";
import { VisualSceneCard } from "@/components/visual-plans/visual-scene-card";

type ViewMode = "grid" | "list";

export function VisualPlanPanel({
  project,
  visualPlans = [],
  onThumbnailSceneChange,
  onShotListChange,
  onCopyShotList,
  onVisualPlanChange,
  onVisualPromptChange,
  onRegenerateVisualPrompt
}: {
  project: ProjectDetail;
  visualPlans: VisualPlan[];
  onThumbnailSceneChange: (
    sceneId: string,
    updates: Partial<ThumbnailScene>
  ) => void;
  onShotListChange: (itemId: string, updates: Partial<ShotListItem>) => void;
  onCopyShotList: () => void;
  onVisualPlanChange: (planId: string, updates: Partial<VisualPlan>) => void;
  onVisualPromptChange: (
    planId: string,
    updates: Partial<VisualPrompt>
  ) => void;
  onRegenerateVisualPrompt: (planId: string) => void;
}) {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedPlanId, setSelectedPlanId] = useState(visualPlans[0]?.id ?? "");
  const [status, setStatus] = useState(
    "画像生成は未接続です。ここでは生成用プロンプトだけ作成します。"
  );

  const selectedPlan = useMemo(
    () => visualPlans.find((plan) => plan.id === selectedPlanId) ?? visualPlans[0],
    [selectedPlanId, visualPlans]
  );

  function handlePromptDraft(plan: VisualPlan) {
    setSelectedPlanId(plan.id);
    setStatus(`${plan.sceneName}の画像生成用プロンプトを表示しました。`);
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl border border-violet-300/25 bg-violet-400/12 text-violet-100">
              <ImagePlus className="size-4" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-200/75">
                Visual Planning
              </p>
              <h2 className="text-base font-bold text-white">
                AI提案: おすすめ構図・シーン一覧
              </h2>
            </div>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            画像生成そのものはまだ行わず、サムネイルや参考画像を作るための構図、撮影条件、プロンプトを整理します。
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-4 xl:min-w-[27rem]">
          {visualPlanMetrics.map((metric) => (
            <div
              key={metric.label}
              className="rounded-xl border border-slate-800 bg-white/[0.035] px-3 py-2"
            >
              <p className="text-[0.68rem] font-semibold text-slate-500">
                {metric.label}
              </p>
              <p className="mt-1 text-sm font-bold text-slate-100">{metric.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-950/24 p-3 lg:flex-row lg:items-center lg:justify-between">
        <p className="text-sm text-slate-300">{status}</p>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">表示切替</span>
          <Button
            type="button"
            variant={viewMode === "grid" ? "primary" : "soft"}
            className="size-9 px-0"
            aria-label="グリッド表示"
            onClick={() => setViewMode("grid")}
          >
            <Grid2X2 className="size-4" />
          </Button>
          <Button
            type="button"
            variant={viewMode === "list" ? "primary" : "ghost"}
            className="size-9 px-0"
            aria-label="リスト表示"
            onClick={() => setViewMode("list")}
          >
            <Rows3 className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_26rem]">
        <div
          className={cn(
            "grid gap-3",
            viewMode === "grid"
              ? "md:grid-cols-2 xl:grid-cols-3"
              : "grid-cols-1"
          )}
        >
          {visualPlans.map((plan, index) => (
            <VisualSceneCard
              key={plan.id}
              plan={plan}
              scene={project.thumbnailScenes[index]}
              index={index}
              isSelected={selectedPlan?.id === plan.id}
              viewMode={viewMode}
              onSelect={() => setSelectedPlanId(plan.id)}
              onCreatePrompt={() => handlePromptDraft(plan)}
              onPlanChange={(updates) => onVisualPlanChange(plan.id, updates)}
              onSceneChange={(updates) => {
                const scene = project.thumbnailScenes[index];

                if (scene) {
                  onThumbnailSceneChange(scene.id, updates);
                }
              }}
            />
          ))}
        </div>

        {selectedPlan ? (
          <PromptBuilderCard
            project={project}
            plan={selectedPlan}
            onStatusChange={setStatus}
            onPromptChange={(updates) =>
              onVisualPromptChange(selectedPlan.id, updates)
            }
            onRegenerate={() => {
              onRegenerateVisualPrompt(selectedPlan.id);
              setStatus(
                `${selectedPlan.sceneName}のプロンプトを商品情報からダミー再生成しました。`
              );
            }}
          />
        ) : null}
      </div>

      <ShotListPanel
        shotList={project.shotList}
        onShotListChange={onShotListChange}
        onCopyShotList={onCopyShotList}
      />
    </div>
  );
}
