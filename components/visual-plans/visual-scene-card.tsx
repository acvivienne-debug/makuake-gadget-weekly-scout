import { Camera, ClipboardList, WandSparkles } from "lucide-react";
import type { ThumbnailScene } from "@/data/mockProjects";
import type { VisualPlan } from "@/data/mockVisualPlans";
import { Badge, Button } from "@/components/ui";
import { cn } from "@/lib/utils";

const tagTones = ["rose", "cyan", "amber", "violet", "mint"] as const;

export function VisualSceneCard({
  plan,
  scene,
  index,
  isSelected,
  viewMode,
  onSelect,
  onCreatePrompt,
  onPlanChange,
  onSceneChange
}: {
  plan: VisualPlan;
  scene?: ThumbnailScene;
  index: number;
  isSelected: boolean;
  viewMode: "grid" | "list";
  onSelect: () => void;
  onCreatePrompt: () => void;
  onPlanChange: (updates: Partial<VisualPlan>) => void;
  onSceneChange: (updates: Partial<ThumbnailScene>) => void;
}) {
  const title = scene?.title ?? `${plan.sceneLabel} ${plan.sceneName}`;
  const intent = scene?.intent ?? plan.intent;
  const distance = scene?.distance ?? plan.cameraDistance;
  const background = scene?.background ?? plan.background;
  const lighting = scene?.lighting ?? plan.lighting;
  const props = scene?.props ?? plan.props;
  const tags = scene?.tags ?? plan.tags;
  const palette = scene?.palette ?? plan.palette;

  return (
    <article
      className={cn(
        "group min-w-0 overflow-hidden rounded-2xl border bg-slate-950/28 transition duration-200 hover:-translate-y-0.5 hover:bg-white/[0.055]",
        isSelected
          ? "border-violet-300/55 shadow-[0_20px_46px_-34px_rgba(124,92,255,0.95)]"
          : "border-slate-700/60 hover:border-violet-300/35",
        viewMode === "list" ? "grid lg:grid-cols-[18rem_minmax(0,1fr)]" : ""
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className="thumb-scene relative block aspect-[1.42/1] w-full overflow-hidden text-left"
        style={
          {
            "--a": palette.a,
            "--b": palette.b,
            "--x": palette.x,
            "--y": palette.y
          } as React.CSSProperties
        }
      >
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/72 via-slate-950/10 to-transparent" />
        <div className="absolute left-3 top-3 rounded-full border border-white/15 bg-slate-950/48 px-2.5 py-1 text-[0.68rem] font-bold text-white backdrop-blur">
          {plan.sceneLabel}
        </div>
        <div className="absolute bottom-3 left-3 right-3">
          <div className="flex items-center gap-2 text-[0.68rem] font-bold text-violet-100">
            <Camera className="size-3.5" />
            {plan.prompt.aspectRatio} / {plan.priority}優先
          </div>
          <p className="mt-1 line-clamp-2 text-sm font-bold text-white">{plan.sceneName}</p>
        </div>
      </button>

      <div className="grid min-w-0 gap-3 p-3.5">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <input
            value={title}
            onChange={(event) => onSceneChange({ title: event.target.value })}
            className="min-w-0 flex-1 bg-transparent text-sm font-bold text-white outline-none"
          />
          <Button
            type="button"
            variant={isSelected ? "primary" : "soft"}
            className="h-9 shrink-0 px-3 text-xs"
            onClick={onCreatePrompt}
          >
            <WandSparkles className="size-3.5" />
            作成
          </Button>
        </div>

        <div className="grid gap-2">
          <SceneDetail
            label="撮影意図"
            value={intent}
            onChange={(value) => onSceneChange({ intent: value })}
          />
          <SceneDetail
            label="カメラ距離"
            value={distance}
            onChange={(value) => onSceneChange({ distance: value })}
          />
          <SceneDetail
            label="カメラ角度"
            value={plan.cameraAngle}
            onChange={(value) => onPlanChange({ cameraAngle: value })}
          />
          <SceneDetail
            label="構図"
            value={plan.composition}
            onChange={(value) => onPlanChange({ composition: value })}
          />
          <SceneDetail
            label="背景"
            value={background}
            onChange={(value) => onSceneChange({ background: value })}
          />
          <SceneDetail
            label="照明"
            value={lighting}
            onChange={(value) => onSceneChange({ lighting: value })}
          />
          <SceneDetail
            label="必要小物"
            value={props}
            onChange={(value) => onSceneChange({ props: value })}
          />
        </div>

        <div className="rounded-xl border border-slate-800 bg-white/[0.035] p-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <ClipboardList className="size-4 text-violet-200" />
            撮影メモ
          </div>
          <textarea
            value={plan.shootingMemo}
            onChange={(event) => onPlanChange({ shootingMemo: event.target.value })}
            className="mt-2 min-h-14 w-full resize-y rounded-lg border border-transparent bg-transparent px-2 py-1 text-xs leading-5 text-slate-400 outline-none transition focus:border-violet-400/45 focus:bg-slate-950/35"
          />
        </div>

        <div className="flex flex-wrap gap-1.5 pt-1">
          {tags.map((tag) => (
            <Badge key={tag} tone={tagTones[index % tagTones.length]}>
              {tag}
            </Badge>
          ))}
        </div>
      </div>
    </article>
  );
}

function SceneDetail({
  label,
  value,
  readOnly = false,
  onChange
}: {
  label: string;
  value: string;
  readOnly?: boolean;
  onChange?: (value: string) => void;
}) {
  return (
    <label className="grid gap-1 text-xs leading-relaxed">
      <span className="font-semibold text-slate-500">{label}</span>
      <textarea
        value={value}
        readOnly={readOnly}
        onChange={(event) => onChange?.(event.target.value)}
        className={cn(
          "min-h-10 resize-y rounded-lg border px-2 py-1 text-slate-300 outline-none transition",
          readOnly
            ? "border-slate-800/70 bg-slate-950/26"
            : "border-transparent bg-transparent focus:border-violet-400/45 focus:bg-slate-950/35"
        )}
      />
    </label>
  );
}
