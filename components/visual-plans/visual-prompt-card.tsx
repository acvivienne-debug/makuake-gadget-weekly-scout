"use client";

import { Copy, ImageOff, RefreshCcw, Send, Sparkles } from "lucide-react";
import type { ProjectDetail } from "@/data/mockProjects";
import type { VisualPlan, VisualPrompt } from "@/data/mockVisualPlans";
import { Badge, Button } from "@/components/ui";

export function PromptBuilderCard({
  project,
  plan,
  onStatusChange,
  onPromptChange,
  onRegenerate
}: {
  project: ProjectDetail;
  plan: VisualPlan;
  onStatusChange: (message: string) => void;
  onPromptChange: (updates: Partial<VisualPrompt>) => void;
  onRegenerate: () => void;
}) {
  const promptJa = resolvePrompt(plan.prompt.promptJa, project);
  const promptEn = resolvePrompt(plan.prompt.promptEn, project);
  const promptBundle = [
    `# ${project.product.name} / ${plan.sceneName}`,
    "",
    "## 日本語プロンプト",
    promptJa,
    "",
    "## English Prompt",
    promptEn,
    "",
    "## Negative Prompt",
    plan.prompt.negativePrompt,
    "",
    `Aspect Ratio: ${plan.prompt.aspectRatio}`,
    `Text Overlay: ${plan.prompt.textOverlay}`
  ].join("\n");

  async function copyText(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      onStatusChange(`${label}をコピーしました。`);
    } catch {
      onStatusChange(`${label}のコピーに失敗しました。テキスト欄から手動でコピーできます。`);
    }
  }

  function updatePrompt(updates: Partial<VisualPrompt>) {
    onPromptChange(updates);
    onStatusChange(`${plan.sceneName}のプロンプト編集を保存しました。`);
  }

  return (
    <aside className="sticky top-24 grid max-h-[calc(100dvh-7rem)] gap-3 overflow-y-auto rounded-2xl border border-violet-300/20 bg-[#0b1422]/96 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.07)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-200/75">
            Prompt Builder
          </p>
          <h3 className="mt-1 text-base font-bold text-white">
            {plan.sceneName}プロンプト
          </h3>
        </div>
        <Badge tone="violet">{plan.prompt.aspectRatio}</Badge>
      </div>

      <div className="rounded-xl border border-amber-300/20 bg-amber-300/8 p-3">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-100">
          <ImageOff className="size-4" />
          画像生成は未実装
        </div>
        <p className="mt-2 text-xs leading-5 text-amber-100/72">
          このMVPでは外部APIを呼ばず、生成サービスに貼り付けるためのプロンプトだけを作成します。
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-xs font-bold text-slate-400">用途</span>
          <select
            value={plan.prompt.useCase}
            onChange={(event) =>
              updatePrompt({
                useCase: event.target.value as VisualPrompt["useCase"]
              })
            }
            className="h-10 rounded-xl border border-slate-800 bg-slate-950/42 px-3 text-sm text-slate-100 outline-none focus:border-violet-400/45"
          >
            <option value="thumbnail">サムネイル</option>
            <option value="scene-reference">参考画像</option>
          </select>
        </label>
        <label className="grid gap-2">
          <span className="text-xs font-bold text-slate-400">比率</span>
          <select
            value={plan.prompt.aspectRatio}
            onChange={(event) =>
              updatePrompt({
                aspectRatio: event.target.value as VisualPrompt["aspectRatio"]
              })
            }
            className="h-10 rounded-xl border border-slate-800 bg-slate-950/42 px-3 text-sm text-slate-100 outline-none focus:border-violet-400/45"
          >
            <option value="16:9">16:9</option>
            <option value="9:16">9:16</option>
            <option value="1:1">1:1</option>
            <option value="4:5">4:5</option>
          </select>
        </label>
      </div>

      <div className="grid gap-2">
        <PromptBlock
          label="日本語プロンプト"
          value={promptJa}
          onChange={(promptJaValue) => updatePrompt({ promptJa: promptJaValue })}
          onCopy={() => copyText("日本語プロンプト", promptJa)}
        />
        <PromptBlock
          label="English Prompt"
          value={promptEn}
          onChange={(promptEnValue) => updatePrompt({ promptEn: promptEnValue })}
          onCopy={() => copyText("English prompt", promptEn)}
        />
        <PromptBlock
          label="Negative Prompt"
          value={plan.prompt.negativePrompt}
          onChange={(negativePrompt) => updatePrompt({ negativePrompt })}
          onCopy={() => copyText("ネガティブプロンプト", plan.prompt.negativePrompt)}
          minHeight="min-h-24"
        />
      </div>

      <label className="grid gap-2 rounded-xl border border-slate-800 bg-white/[0.035] p-3">
        <span className="text-xs font-bold text-slate-300">サムネ文字案</span>
        <input
          value={plan.prompt.textOverlay}
          onChange={(event) => updatePrompt({ textOverlay: event.target.value })}
          className="rounded-lg border border-slate-800 bg-slate-950/42 px-3 py-2 text-sm font-bold text-white outline-none focus:border-violet-400/45"
        />
      </label>

      <div className="flex flex-wrap gap-1.5">
        {plan.prompt.styleKeywords.map((keyword) => (
          <Badge key={keyword} tone="cyan">
            {keyword}
          </Badge>
        ))}
      </div>

      <label className="grid gap-2">
        <span className="text-xs font-bold text-slate-400">スタイルキーワード</span>
        <input
          value={plan.prompt.styleKeywords.join(", ")}
          onChange={(event) =>
            updatePrompt({ styleKeywords: parseKeywords(event.target.value) })
          }
          className="rounded-xl border border-slate-800 bg-slate-950/42 px-3 py-2 text-xs leading-5 text-slate-200 outline-none focus:border-violet-400/45"
        />
      </label>

      <div className="grid gap-2 sm:grid-cols-2 2xl:grid-cols-1">
        <Button
          type="button"
          variant="soft"
          className="h-10"
          onClick={onRegenerate}
        >
          <RefreshCcw className="size-4" />
          ダミー再生成
        </Button>
        <Button
          type="button"
          variant="soft"
          className="h-10"
          onClick={() => copyText("プロンプト一式", promptBundle)}
        >
          <Copy className="size-4" />
          一式コピー
        </Button>
        <Button
          type="button"
          variant="primary"
          className="h-10"
          onClick={() =>
            onStatusChange(
              `${plan.sceneName}を生成キューに追加しました。画像生成連携は後で接続します。`
            )
          }
        >
          <Send className="size-4" />
          キューに追加
        </Button>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950/32 p-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
          <Sparkles className="size-4 text-violet-200" />
          作成メモ
        </div>
        <textarea
          value={plan.prompt.generationMemo}
          onChange={(event) => updatePrompt({ generationMemo: event.target.value })}
          className="mt-2 min-h-20 w-full resize-y rounded-lg border border-transparent bg-transparent px-2 py-1 text-xs leading-5 text-slate-400 outline-none transition focus:border-violet-400/45 focus:bg-slate-950/35"
        />
      </div>
    </aside>
  );
}

function PromptBlock({
  label,
  value,
  minHeight = "min-h-32",
  onChange,
  onCopy
}: {
  label: string;
  value: string;
  minHeight?: string;
  onChange: (value: string) => void;
  onCopy: () => void;
}) {
  return (
    <label className="grid gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-slate-400">{label}</span>
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-violet-100 transition hover:bg-violet-400/12"
        >
          <Copy className="size-3.5" />
          コピー
        </button>
      </div>
      <textarea
        value={value}
        aria-label={label}
        onChange={(event) => onChange(event.target.value)}
        className={`${minHeight} studio-scrollbar resize-y rounded-xl border border-slate-800 bg-slate-950/42 px-3 py-2 text-xs leading-5 text-slate-200 outline-none`}
      />
    </label>
  );
}

function parseKeywords(value: string) {
  return value
    .split(/[、,]/)
    .map((keyword) => keyword.trim())
    .filter(Boolean);
}

function resolvePrompt(template: string, project: ProjectDetail) {
  return template
    .replaceAll("{productName}", project.product.name)
    .replaceAll("{tags}", project.product.tags.join(", "));
}
