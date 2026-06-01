import {
  Archive,
  FileText,
  Image,
  MessageSquareText,
  Newspaper,
  PlaySquare,
  Sparkles,
  Table2,
  Video,
  WandSparkles
} from "lucide-react";
import {
  type GenerationIconKey,
  type ProjectDetail
} from "@/data/mockProjects";
import { Button, Panel } from "@/components/ui";
import type { GenerationActionRequestId } from "@/lib/generation-api";
import { cn } from "@/lib/utils";

const actionStyles: Record<
  GenerationIconKey,
  {
    icon: typeof Newspaper;
    tone: string;
  }
> = {
  articleOutline: {
    icon: Newspaper,
    tone: "text-cyan-200 border-cyan-300/35 bg-cyan-300/10"
  },
  articleBody: {
    icon: FileText,
    tone: "text-violet-200 border-violet-300/35 bg-violet-300/10"
  },
  specTable: {
    icon: Table2,
    tone: "text-emerald-200 border-emerald-300/35 bg-emerald-300/10"
  },
  longScript: {
    icon: PlaySquare,
    tone: "text-amber-200 border-amber-300/35 bg-amber-300/10"
  },
  shortScript: {
    icon: Video,
    tone: "text-rose-200 border-rose-300/35 bg-rose-300/10"
  },
  description: {
    icon: Archive,
    tone: "text-cyan-200 border-cyan-300/35 bg-cyan-300/10"
  },
  pinnedComment: {
    icon: MessageSquareText,
    tone: "text-amber-200 border-amber-300/35 bg-amber-300/10"
  },
  thumbnail: {
    icon: Image,
    tone: "text-emerald-200 border-emerald-300/35 bg-emerald-300/10"
  }
};

export function AiGenerationMenu({
  project,
  generationStatus,
  generatingActionId,
  onGenerate
}: {
  project: ProjectDetail;
  generationStatus: string;
  generatingActionId: GenerationActionRequestId | null;
  onGenerate: (actionId: GenerationIconKey | "all") => void;
}) {
  const isGenerating = generatingActionId !== null;

  return (
    <Panel className="animate-rise" style={{ "--delay": 1 } as React.CSSProperties}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-white">AI生成メニュー</h2>
        <Button variant="soft" className="h-9 px-3 text-xs">
          履歴
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {project.generationActions.map((action, index) => {
          const style = actionStyles[action.id];
          const Icon = style.icon;
          const isActiveAction = generatingActionId === action.id;

          return (
            <button
              key={action.id}
              type="button"
              disabled={isGenerating}
              onClick={() => onGenerate(action.id)}
              aria-busy={isActiveAction}
              className={cn(
                "group grid min-h-[5.15rem] grid-cols-[2.75rem_minmax(0,1fr)] items-center gap-3 rounded-2xl border border-slate-700/50 bg-white/[0.045] p-3 text-left shadow-studio-inset transition duration-200 hover:border-violet-300/35 hover:bg-white/[0.075] active:translate-y-px disabled:cursor-wait disabled:opacity-65",
                isActiveAction && "border-violet-300/45 bg-violet-400/10"
              )}
              style={{ "--delay": index + 2 } as React.CSSProperties}
            >
              <span
                className={cn(
                  "grid size-11 place-items-center rounded-xl border transition group-hover:scale-[1.03]",
                  style.tone
                )}
              >
                <Icon className="size-5" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold text-slate-100">
                  {action.title}
                </span>
                <span className="mt-1 block truncate text-xs text-slate-400">
                  {isActiveAction ? "ローカル生成中..." : action.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <Button
        type="button"
        variant="primary"
        disabled={isGenerating}
        aria-busy={generatingActionId === "all"}
        className="mt-4 h-14 w-full text-sm font-bold disabled:cursor-wait disabled:opacity-70"
        onClick={() => onGenerate("all")}
      >
        <WandSparkles className="size-5" />
        <span className="grid text-center leading-tight">
          すべてを一括生成
          <span className="text-xs font-medium text-violet-100/80">
            記事・動画・SNSをまとめて生成
          </span>
        </span>
        <Sparkles className="size-4 text-violet-100" />
      </Button>
      <div className="mt-3 rounded-xl border border-violet-300/20 bg-violet-300/8 px-3 py-2 text-xs font-medium text-violet-100">
        {generationStatus}
      </div>
    </Panel>
  );
}
