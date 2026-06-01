import {
  type GeneratedContent,
  type GenerationResultId,
  type ProjectDetail,
  type ShotListItem,
  type ThumbnailScene
} from "@/data/mockProjects";
import type { VisualPlan, VisualPrompt } from "@/data/mockVisualPlans";
import { VisualPlanPanel } from "@/components/visual-plans/visual-plan-panel";
import { Panel } from "@/components/ui";
import { cn } from "@/lib/utils";

export function WorkspaceTabs({
  project,
  visualPlans,
  activeTabId,
  onTabChange,
  onGeneratedContentChange,
  onThumbnailSceneChange,
  onShotListChange,
  onCopyShotList,
  onVisualPlanChange,
  onVisualPromptChange,
  onRegenerateVisualPrompt
}: {
  project: ProjectDetail;
  visualPlans: VisualPlan[];
  activeTabId: GenerationResultId;
  onTabChange: (tabId: GenerationResultId) => void;
  onGeneratedContentChange: (updates: Partial<GeneratedContent>) => void;
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
  const { generatedContent } = project;

  return (
    <Panel className="animate-rise p-0" style={{ "--delay": 5 } as React.CSSProperties}>
      <div className="studio-scrollbar flex gap-1 overflow-x-auto border-b border-slate-800 px-3 pt-3">
        {generatedContent.tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            aria-pressed={tab.id === activeTabId}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "relative shrink-0 px-3 py-3 text-sm font-medium transition active:translate-y-px",
              tab.id === activeTabId
                ? "text-violet-100"
                : "text-slate-400 hover:text-slate-100"
            )}
          >
            {tab.label}
            {tab.id === activeTabId ? (
              <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-studio-violet" />
            ) : null}
          </button>
        ))}
      </div>

      <div className="p-4 md:p-5">
        {activeTabId === "thumbnailIdeas" ? (
          <VisualPlanPanel
            project={project}
            visualPlans={visualPlans}
            onThumbnailSceneChange={onThumbnailSceneChange}
            onShotListChange={onShotListChange}
            onCopyShotList={onCopyShotList}
            onVisualPlanChange={onVisualPlanChange}
            onVisualPromptChange={onVisualPromptChange}
            onRegenerateVisualPrompt={onRegenerateVisualPrompt}
          />
        ) : (
          <GeneratedResultPanel
            project={project}
            activeTabId={activeTabId}
            onGeneratedContentChange={onGeneratedContentChange}
          />
        )}
      </div>
    </Panel>
  );
}

function GeneratedResultPanel({
  project,
  activeTabId,
  onGeneratedContentChange
}: {
  project: ProjectDetail;
  activeTabId: GenerationResultId;
  onGeneratedContentChange: (updates: Partial<GeneratedContent>) => void;
}) {
  const { generatedContent } = project;
  const activeTab = generatedContent.tabs.find((tab) => tab.id === activeTabId);

  return (
    <div className="grid gap-4">
      <div>
        <h2 className="flex items-center gap-2 text-base font-bold text-white">
          <span className="size-2 rounded-full bg-violet-300" />
          生成結果: {activeTab?.label ?? "プレビュー"}
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          ローカル生成または仮データの結果です。タブ切り替えと表示領域の確認に使えます。
        </p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-950/28 p-4">
        {renderGeneratedContent(project, activeTabId, onGeneratedContentChange)}
      </div>
    </div>
  );
}

function renderGeneratedContent(
  project: ProjectDetail,
  activeTabId: GenerationResultId,
  onGeneratedContentChange: (updates: Partial<GeneratedContent>) => void
) {
  const content = project.generatedContent;

  if (activeTabId === "outline") {
    return (
      <EditableList
        items={content.outline}
        onChange={(items) => onGeneratedContentChange({ outline: items })}
      />
    );
  }

  if (activeTabId === "longScript") {
    return (
      <EditableList
        items={content.longScript}
        onChange={(items) => onGeneratedContentChange({ longScript: items })}
      />
    );
  }

  if (activeTabId === "shortScript") {
    return (
      <EditableList
        items={content.shortScript}
        onChange={(items) => onGeneratedContentChange({ shortScript: items })}
      />
    );
  }

  if (activeTabId === "articleBody") {
    return (
      <EditableTextArea
        value={content.articleBody}
        minHeight="min-h-56"
        onChange={(articleBody) => onGeneratedContentChange({ articleBody })}
      />
    );
  }

  if (activeTabId === "specTable") {
    return (
      <EditableTextArea
        value={content.specTable.map((row) => `${row.label}: ${row.value}`).join("\n")}
        minHeight="min-h-48"
        onChange={(value) =>
          onGeneratedContentChange({ specTable: parseSpecTable(value) })
        }
      />
    );
  }

  if (activeTabId === "description") {
    return (
      <EditableTextArea
        value={content.description}
        minHeight="min-h-56"
        onChange={(description) => onGeneratedContentChange({ description })}
      />
    );
  }

  if (activeTabId === "pinnedComment") {
    return (
      <EditableTextArea
        value={content.pinnedComment}
        minHeight="min-h-32"
        onChange={(pinnedComment) => onGeneratedContentChange({ pinnedComment })}
      />
    );
  }

  if (activeTabId === "snsPost") {
    return (
      <div className="grid gap-3 md:grid-cols-2">
        {content.snsPosts.map((post, index) => (
          <article
            key={post.channel}
            className="rounded-xl border border-slate-800 bg-white/[0.035] p-4"
          >
            <input
              value={post.channel}
              onChange={(event) =>
                onGeneratedContentChange({
                  snsPosts: updatePost(content.snsPosts, index, {
                    channel: event.target.value
                  })
                })
              }
              className="w-full bg-transparent text-xs font-bold text-violet-200 outline-none"
            />
            <textarea
              value={post.body}
              onChange={(event) =>
                onGeneratedContentChange({
                  snsPosts: updatePost(content.snsPosts, index, {
                    body: event.target.value
                  })
                })
              }
              className="mt-2 min-h-32 w-full resize-y rounded-xl border border-slate-800 bg-slate-950/35 px-3 py-2 text-sm leading-6 text-slate-200 outline-none focus:border-violet-400/50"
            />
          </article>
        ))}
      </div>
    );
  }

  return null;
}

function EditableList({
  items,
  onChange
}: {
  items: string[];
  onChange: (items: string[]) => void;
}) {
  return (
    <div className="grid gap-3">
      {items.map((item, index) => (
        <label
          key={`${index}-${item}`}
          className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3 rounded-xl border border-slate-800 bg-white/[0.035] p-3 text-sm text-slate-200"
        >
          <span className="grid size-8 place-items-center rounded-lg bg-violet-400/15 text-xs font-bold text-violet-100">
            {index + 1}
          </span>
          <textarea
            value={item}
            onChange={(event) => onChange(updateListItem(items, index, event.target.value))}
            className="min-h-11 resize-y self-center rounded-lg border border-transparent bg-transparent px-2 py-1 leading-6 text-slate-200 outline-none transition focus:border-violet-400/45 focus:bg-slate-950/35"
          />
        </label>
      ))}
      <textarea
        value={items.join("\n")}
        onChange={(event) => onChange(parseLines(event.target.value))}
        className="min-h-32 resize-y rounded-xl border border-slate-800 bg-slate-950/35 px-3 py-3 text-sm leading-6 text-slate-300 outline-none transition focus:border-violet-400/45"
        aria-label="まとめて編集"
      />
    </div>
  );
}

function EditableTextArea({
  value,
  onChange,
  minHeight
}: {
  value: string;
  onChange: (value: string) => void;
  minHeight: string;
}) {
  return (
    <textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={cn(
        "w-full resize-y rounded-xl border border-slate-800 bg-white/[0.035] px-3 py-3 text-sm leading-7 text-slate-200 outline-none transition focus:border-violet-400/45",
        minHeight
      )}
    />
  );
}

function parseLines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseSpecTable(value: string) {
  return parseLines(value).map((line) => {
    const [label, ...rest] = line.split(":");

    return {
      label: label.trim() || "項目",
      value: rest.join(":").trim() || "-"
    };
  });
}

function updateListItem(items: string[], index: number, value: string) {
  return items.map((item, itemIndex) => (itemIndex === index ? value : item));
}

function updatePost(
  posts: GeneratedContent["snsPosts"],
  index: number,
  updates: Partial<GeneratedContent["snsPosts"][number]>
) {
  return posts.map((post, postIndex) =>
    postIndex === index ? { ...post, ...updates } : post
  );
}
