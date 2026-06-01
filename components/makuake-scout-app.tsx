"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  BarChart3,
  Bookmark,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Database,
  ExternalLink,
  FileText,
  Filter,
  Gauge,
  LayoutDashboard,
  ListChecks,
  Loader2,
  MessageSquareText,
  PlaySquare,
  RefreshCw,
  Save,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Video,
  WandSparkles,
  XCircle
} from "lucide-react";
import type {
  GeneratedShortPackage,
  MakuakeProject,
  ManualSelectionUrl,
  ScoutCategory,
  ScoutState,
  UserFeedback
} from "@/lib/makuake/types";
import { cn } from "@/lib/utils";

type ViewId = "dashboard" | "weekly" | "manual" | "projects" | "script" | "saved";
type SortId = "recommended" | "score" | "shorts" | "start";
type ScriptSource = "weekly" | "manual";

const views: Array<{ id: ViewId; label: string; icon: typeof LayoutDashboard }> = [
  { id: "dashboard", label: "ダッシュボード", icon: LayoutDashboard },
  { id: "weekly", label: "今週の5選", icon: Star },
  { id: "manual", label: "任意の5選", icon: BadgeCheck },
  { id: "projects", label: "プロジェクト一覧", icon: Search },
  { id: "script", label: "ショート台本生成", icon: PlaySquare },
  { id: "saved", label: "保存済み候補", icon: Bookmark }
];

const categoryOptions: Array<ScoutCategory | "すべて"> = [
  "すべて",
  "ガジェット",
  "PC周辺機器",
  "オーディオ",
  "映像機器",
  "ウェアラブル",
  "スマートホーム",
  "ライフスタイル",
  "食品",
  "ファッション",
  "体験",
  "その他"
];

export function MakuakeScoutApp({ initialState }: { initialState: ScoutState }) {
  const [state, setState] = useState(initialState);
  const [activeView, setActiveView] = useState<ViewId>("dashboard");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ScoutCategory | "すべて">("すべて");
  const [sortId, setSortId] = useState<SortId>("recommended");
  const [status, setStatus] = useState(initialState.meta.fetchMessage);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [scriptSource, setScriptSource] = useState<ScriptSource>("weekly");
  const [selectedProjectId, setSelectedProjectId] = useState(
    initialState.weeklyTop[0]?.id ?? initialState.projects[0]?.id ?? ""
  );
  const selectedProject = useMemo(
    () =>
      state.projects.find((project) => project.id === selectedProjectId) ??
      state.weeklyTop[0] ??
      state.projects[0],
    [selectedProjectId, state.projects, state.weeklyTop]
  );
  const filteredProjects = useMemo(
    () => filterProjects(state.projects, query, category, sortId),
    [category, query, sortId, state.projects]
  );
  const scriptProjects = scriptSource === "manual" ? state.manualTop : state.weeklyTop;
  const highShortsCount = state.projects.filter(
    (project) => project.fit.shorts >= 82 && !project.excludedReason
  ).length;
  const gadgetCount = state.projects.filter(
    (project) =>
      project.category !== "食品" &&
      project.category !== "ファッション" &&
      project.category !== "体験"
  ).length;
  const isPublicDemo = state.meta.dailyFetchLimit === 0;

  useEffect(() => {
    setIsApproved(false);
  }, [scriptSource, scriptProjects.map((project) => project.id).join("|")]);

  async function handleRefresh() {
    if (!state.meta.canFetchToday) {
      setStatus(
        isPublicDemo
          ? "公開デモではMakuakeへアクセスしません。ローカルのCodex App Serverで取得機能を利用してください。"
          : "本日は2回取得済みです。次回取得可能時刻までキャッシュを使います。"
      );
      return;
    }

    const confirmed = window.confirm(
      `Makuakeへアクセスします。取得は1日2回までで、本日残り${state.meta.remainingFetchesToday}回です。結果はSQLiteへキャッシュ保存します。実行しますか？`
    );

    if (!confirmed) {
      setStatus("取得をキャンセルしました。既存キャッシュを表示しています。");
      return;
    }

    setIsRefreshing(true);
    setStatus("Codex App ServerでMakuake coming-soonを取得中です...");

    try {
      const response = await fetch("/api/scout/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ confirmed: true })
      });
      const data = (await response.json()) as
        | { state: ScoutState; message: string }
        | { error: string };

      if (!response.ok && "error" in data) {
        throw new Error(data.error);
      }

      if ("state" in data) {
        setState(data.state);
        setStatus(data.message);
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "取得に失敗しました。");
    } finally {
      setIsRefreshing(false);
    }
  }

  async function handleProjectSave(
    projectId: string,
    saved: boolean,
    note: string,
    userFeedback?: UserFeedback
  ) {
    setStatus(
      userFeedback
        ? "選抜フィードバックを学習中です..."
        : isPublicDemo
          ? "候補メモを公開デモの一時保存へ反映中です..."
          : "候補メモをSQLiteへ保存中です..."
    );

    try {
      const response = await fetch("/api/scout/project", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ projectId, saved, note, userFeedback })
      });
      const data = (await response.json()) as ScoutState | { error: string };

      if (!response.ok || "error" in data) {
        throw new Error("error" in data ? data.error : "保存に失敗しました。");
      }

      setState(data);
      if (userFeedback === "selected") {
        setStatus("採用フィードバックを保存しました。類似カテゴリとキーワードを上げます。");
      } else if (userFeedback === "rejected") {
        setStatus("除外フィードバックを保存しました。類似傾向を下げます。");
      } else {
        setStatus(saved ? "保存済み候補に追加しました。" : "保存済み候補から外しました。");
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "保存に失敗しました。");
    }
  }

  async function handleGenerateShort() {
    if (!isApproved) {
      setStatus("生成前に、選抜5件の確認チェックを入れてください。");
      return;
    }

    if (scriptProjects.length < 5) {
      setStatus(
        scriptSource === "manual"
          ? "任意の5選はまだ5件そろっていません。プロジェクト一覧で採用を追加してください。"
          : "今週の5選が5件未満です。取得キャッシュを更新してください。"
      );
      return;
    }

    setIsGenerating(true);
    setStatus("60秒以内の構成案、ナレーション、投稿文を生成中です...");

    try {
      const response = await fetch("/api/scout/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          approved: true,
          projectIds: scriptProjects.slice(0, 5).map((project) => project.id)
        })
      });
      const data = (await response.json()) as ScoutState | { error: string };

      if (!response.ok || "error" in data) {
        throw new Error("error" in data ? data.error : "生成に失敗しました。");
      }

      setState(data);
      setStatus(
        isPublicDemo
          ? "ショート動画用の台本セットを生成し、公開デモの一時保存へ反映しました。"
          : "ショート動画用の台本セットを生成し、SQLiteへ保存しました。"
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "生成に失敗しました。");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <main className="min-h-[100dvh] bg-[#f6f7fb] text-slate-950">
      <div className="lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
        <Sidebar activeView={activeView} onViewChange={setActiveView} />
        <div className="min-w-0 px-4 pb-8 md:px-6 xl:px-8">
          <TopBar
            meta={state.meta}
            isRefreshing={isRefreshing}
            status={status}
            onRefresh={handleRefresh}
          />

          <div className="mx-auto grid max-w-[102rem] gap-4 2xl:grid-cols-[minmax(0,1fr)_26rem]">
            <div className="min-w-0">
              {activeView === "dashboard" ? (
                <DashboardView
                  state={state}
                  filteredProjects={filteredProjects.slice(0, 5)}
                  stats={{
                    total: state.projects.length,
                    gadgetCount,
                    highShortsCount,
                    manualCount: state.manualTop.length + state.manualSelectionUrls.length,
                    savedCount: state.savedProjects.length
                  }}
                  query={query}
                  category={category}
                  sortId={sortId}
                  onQueryChange={setQuery}
                  onCategoryChange={setCategory}
                  onSortChange={setSortId}
                  onProjectSelect={setSelectedProjectId}
                  onProjectSave={handleProjectSave}
                  onViewChange={setActiveView}
                />
              ) : null}

              {activeView === "weekly" ? (
                <WeeklyView
                  projects={state.weeklyTop}
                  onProjectSelect={setSelectedProjectId}
                  onProjectSave={handleProjectSave}
                  onViewChange={setActiveView}
                />
              ) : null}

              {activeView === "manual" ? (
                <ManualSelectionView
                  projects={state.manualTop}
                  manualSelectionUrls={state.manualSelectionUrls}
                  onProjectSelect={setSelectedProjectId}
                  onProjectSave={handleProjectSave}
                  onViewChange={setActiveView}
                  onUseForScript={() => {
                    setScriptSource("manual");
                    setActiveView("script");
                  }}
                />
              ) : null}

              {activeView === "projects" ? (
                <ProjectsView
                  projects={filteredProjects}
                  query={query}
                  category={category}
                  sortId={sortId}
                  onQueryChange={setQuery}
                  onCategoryChange={setCategory}
                  onSortChange={setSortId}
                  onProjectSelect={setSelectedProjectId}
                  onProjectSave={handleProjectSave}
                />
              ) : null}

              {activeView === "script" ? (
                <ScriptView
                  projects={scriptProjects}
                  weeklyCount={state.weeklyTop.length}
                  manualCount={state.manualTop.length}
                  scriptSource={scriptSource}
                  generatedShort={state.generatedShort}
                  isApproved={isApproved}
                  isGenerating={isGenerating}
                  onScriptSourceChange={setScriptSource}
                  onApprovedChange={setIsApproved}
                  onGenerate={handleGenerateShort}
                />
              ) : null}

              {activeView === "saved" ? (
                <SavedView
                  projects={state.savedProjects}
                  onProjectSelect={setSelectedProjectId}
                  onProjectSave={handleProjectSave}
                  onViewChange={setActiveView}
                />
              ) : null}
            </div>

            <RightRail
              weeklyTop={state.weeklyTop}
              selectedProject={selectedProject}
              generatedShort={state.generatedShort}
              onProjectSelect={setSelectedProjectId}
              onScriptOpen={() => setActiveView("script")}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

function Sidebar({
  activeView,
  onViewChange
}: {
  activeView: ViewId;
  onViewChange: (viewId: ViewId) => void;
}) {
  return (
    <aside className="border-b border-slate-200 bg-white px-4 py-4 lg:sticky lg:top-0 lg:h-[100dvh] lg:border-b-0 lg:border-r lg:px-5">
      <div className="flex items-center gap-3">
        <div className="grid size-10 place-items-center rounded-lg border border-slate-200 bg-slate-950 text-white">
          <Gauge className="size-5" />
        </div>
        <div>
          <p className="text-lg font-bold">Makuake Scout</p>
          <p className="text-xs font-semibold text-slate-500">Gadget Weekly</p>
        </div>
      </div>

      <nav className="mt-6 grid gap-1">
        {views.map((view) => {
          const Icon = view.icon;
          const active = view.id === activeView;

          return (
            <button
              key={view.id}
              type="button"
              onClick={() => onViewChange(view.id)}
              className={cn(
                "inline-flex h-11 items-center gap-3 rounded-lg px-3 text-left text-sm font-semibold transition active:translate-y-px",
                active
                  ? "bg-slate-950 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
              )}
            >
              <Icon className="size-4" />
              {view.label}
            </button>
          );
        })}
      </nav>

      <div className="mt-8 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <div className="flex items-center gap-2 text-sm font-bold">
          <Database className="size-4 text-slate-700" />
          Codex App Server
        </div>
        <p className="mt-2 text-xs leading-5 text-slate-500">
          Playwright取得、SQLiteキャッシュ、ローカル生成APIをNext.js側で処理します。
        </p>
      </div>

      <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
        <div className="flex items-center gap-2 text-sm font-bold text-amber-950">
          <ShieldCheck className="size-4" />
          取得ルール
        </div>
        <p className="mt-2 text-xs leading-5 text-amber-900">
          Makuakeへのアクセスは1日2回まで。以降はSQLiteのキャッシュを表示します。
        </p>
      </div>
    </aside>
  );
}

function TopBar({
  meta,
  isRefreshing,
  status,
  onRefresh
}: {
  meta: ScoutState["meta"];
  isRefreshing: boolean;
  status: string;
  onRefresh: () => void;
}) {
  return (
    <header className="mx-auto max-w-[102rem] py-5">
      <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-[0_20px_50px_-35px_rgba(15,23,42,0.45)] 2xl:flex-row 2xl:items-center 2xl:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
            Weekly Research Workspace
          </p>
          <h1 className="mt-1 text-2xl font-bold md:text-3xl">
            今週のMakuake注目ガジェット5選
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            「もうすぐ開始」からガジェット候補を抽出し、短尺動画向けの5件をスコアで選抜します。
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] 2xl:min-w-[34rem]">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
              <Clock3 className="size-3.5" />
              最終取得
            </div>
            <p className="mt-1 truncate text-sm font-semibold text-slate-900">
              {meta.lastFetchedAt ? formatDateTime(meta.lastFetchedAt) : "未取得。初期デモデータを表示中"}
            </p>
            <p className="mt-1 truncate text-xs text-slate-500">{status}</p>
          </div>
          <button
            type="button"
            disabled={isRefreshing || !meta.canFetchToday}
            onClick={onRefresh}
            className="inline-flex h-full min-h-14 items-center justify-center gap-2 rounded-lg border border-slate-950 bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-slate-800 active:translate-y-px disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-200 disabled:text-slate-500"
          >
            {isRefreshing ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            {meta.canFetchToday ? `今すぐ取得（残り${meta.remainingFetchesToday}回）` : "本日上限"}
          </button>
        </div>
      </div>
    </header>
  );
}

function DashboardView({
  state,
  filteredProjects,
  stats,
  query,
  category,
  sortId,
  onQueryChange,
  onCategoryChange,
  onSortChange,
  onProjectSelect,
  onProjectSave,
  onViewChange
}: {
  state: ScoutState;
  filteredProjects: MakuakeProject[];
  stats: {
    total: number;
    gadgetCount: number;
    highShortsCount: number;
    manualCount: number;
    savedCount: number;
  };
  query: string;
  category: ScoutCategory | "すべて";
  sortId: SortId;
  onQueryChange: (value: string) => void;
  onCategoryChange: (value: ScoutCategory | "すべて") => void;
  onSortChange: (value: SortId) => void;
  onProjectSelect: (projectId: string) => void;
  onProjectSave: (
    projectId: string,
    saved: boolean,
    note: string,
    userFeedback?: UserFeedback
  ) => void;
  onViewChange: (viewId: ViewId) => void;
}) {
  return (
    <div className="grid gap-4">
      <StatsGrid stats={stats} />

      <Panel>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg font-bold">注目のガジェット候補</h2>
            <p className="mt-1 text-sm text-slate-500">
              食品・ファッション・体験寄りは減点し、ショートで見せやすい順に並べています。
            </p>
          </div>
          <button
            type="button"
            onClick={() => onViewChange("projects")}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            すべて見る
            <ChevronRight className="size-4" />
          </button>
        </div>

        <FilterBar
          query={query}
          category={category}
          sortId={sortId}
          onQueryChange={onQueryChange}
          onCategoryChange={onCategoryChange}
          onSortChange={onSortChange}
        />

        <ProjectList
          projects={filteredProjects}
          onProjectSelect={onProjectSelect}
          onProjectSave={onProjectSave}
        />
      </Panel>

      <Panel>
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <h2 className="text-lg font-bold">スコアリング方針</h2>
            <div className="mt-4 grid gap-3">
              <RuleRow
                icon={Sparkles}
                title="ガジェット系キーワードを加点"
                body="AI、IoT、充電、PC周辺機器、オーディオ、映像機器、ウェアラブルなどを強く評価します。"
              />
              <RuleRow
                icon={Video}
                title="ショート動画で映える要素を加点"
                body="小型、多機能、リアルタイム、手のひらサイズなど、冒頭で引きが作れる言葉を拾います。"
              />
              <RuleRow
                icon={Filter}
                title="食品・ファッション・体験系は減点"
                body="今週のガジェット5選のテーマから外れやすい候補は、除外理由を表示して優先度を下げます。"
              />
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-sm font-bold">キャッシュ対象</h3>
            <p className="mt-2 break-all text-sm leading-6 text-slate-600">
              {state.meta.sourceUrl}
            </p>
            <div className="mt-4 grid gap-2 text-sm">
              <MetaRow label="今日の日付キー" value={state.meta.todayKey} />
              <MetaRow
                label="本日の取得回数"
                value={`${state.meta.fetchesToday}/${state.meta.dailyFetchLimit}回`}
              />
              <MetaRow label="次回取得可能" value={state.meta.nextAllowedAt} />
              <MetaRow label="保存先" value="SQLite / .codex-app-server" />
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
}

function WeeklyView({
  projects,
  onProjectSelect,
  onProjectSave,
  onViewChange
}: {
  projects: MakuakeProject[];
  onProjectSelect: (projectId: string) => void;
  onProjectSave: (
    projectId: string,
    saved: boolean,
    note: string,
    userFeedback?: UserFeedback
  ) => void;
  onViewChange: (viewId: ViewId) => void;
}) {
  return (
    <Panel>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600">
            Weekly Top 5
          </p>
          <h2 className="mt-1 text-2xl font-bold">今週のショート候補5選</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            ショート向きスコア、用途の見せやすさ、ガジェット感をもとに自動選抜しています。
          </p>
        </div>
        <button
          type="button"
          onClick={() => onViewChange("script")}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 active:translate-y-px"
        >
          <WandSparkles className="size-4" />
          台本を生成する
        </button>
      </div>

      <div className="mt-5 grid gap-3">
        {projects.map((project, index) => (
          <RankedProjectCard
            key={project.id}
            rank={index + 1}
            project={project}
            onProjectSelect={onProjectSelect}
            onProjectSave={onProjectSave}
          />
        ))}
      </div>
    </Panel>
  );
}

function ManualSelectionView({
  projects,
  manualSelectionUrls,
  onProjectSelect,
  onProjectSave,
  onViewChange,
  onUseForScript
}: {
  projects: MakuakeProject[];
  manualSelectionUrls: ManualSelectionUrl[];
  onProjectSelect: (projectId: string) => void;
  onProjectSave: (
    projectId: string,
    saved: boolean,
    note: string,
    userFeedback?: UserFeedback
  ) => void;
  onViewChange: (viewId: ViewId) => void;
  onUseForScript: () => void;
}) {
  const totalManualSelections = projects.length + manualSelectionUrls.length;
  const manualUrlSlots = manualSelectionUrls.slice(0, Math.max(0, 5 - projects.length));
  const hasManualSelections = projects.length > 0 || manualUrlSlots.length > 0;

  return (
    <div className="grid gap-4">
      <Panel>
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">
              Manual Top 5
            </p>
            <h2 className="mt-1 text-2xl font-bold">任意で採用した5選</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              プロジェクト一覧で「採用」を押した候補と、URLで登録した候補を手動選抜枠として保持します。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onViewChange("projects")}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              <Search className="size-4" />
              採用候補を探す
            </button>
            <button
              type="button"
              disabled={projects.length < 5}
              onClick={onUseForScript}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 active:translate-y-px disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
            >
              <WandSparkles className="size-4" />
              この5件で台本へ
            </button>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold">詳細取得済みの採用候補</p>
              <p className="mt-1 text-sm text-slate-500">
                台本生成に使える詳細取得済み候補は{projects.length}/5件。登録済み全体は{totalManualSelections}件です。
              </p>
            </div>
            <span className="rounded-lg bg-emerald-100 px-3 py-1.5 text-sm font-bold text-emerald-800">
              任意採用 {totalManualSelections}
            </span>
          </div>
        </div>

        {!hasManualSelections ? (
          <div className="mt-5 rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
            <BadgeCheck className="mx-auto size-10 text-slate-400" />
            <h3 className="mt-4 text-lg font-bold">任意の5選はまだありません</h3>
            <p className="mt-2 text-sm text-slate-500">
              プロジェクトカードの「採用」を押すと、この枠に追加されます。
            </p>
          </div>
        ) : (
          <div className="mt-5 grid gap-3">
            {projects.map((project, index) => (
              <RankedProjectCard
                key={project.id}
                rank={index + 1}
                project={project}
                onProjectSelect={onProjectSelect}
                onProjectSave={onProjectSave}
              />
            ))}
            {manualUrlSlots.map((item, index) => (
              <ManualUrlRankedCard
                key={item.sourceUrl}
                rank={projects.length + index + 1}
                item={item}
              />
            ))}
          </div>
        )}
      </Panel>

      {manualSelectionUrls.length > 0 ? (
        <Panel>
          <div>
            <h2 className="text-lg font-bold">URLで登録した採用履歴</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              詳細ページを取得していない候補です。次回のcoming-soon取得で一致すると、自動で採用済み候補に昇格します。
            </p>
          </div>
          <div className="mt-4 grid gap-2">
            {manualSelectionUrls.map((item) => (
              <a
                key={item.sourceUrl}
                href={item.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="grid gap-3 rounded-lg border border-slate-200 bg-white p-3 text-left transition hover:border-slate-300 hover:bg-slate-50 md:grid-cols-[minmax(0,1fr)_auto]"
              >
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2">
                    <CategoryBadge category={item.category} />
                    <span className="rounded-lg bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">
                      URL採用履歴
                    </span>
                  </span>
                  <span className="mt-2 block truncate text-sm font-bold">{item.title}</span>
                  <span className="mt-1 block break-all text-xs text-slate-500">
                    {item.sourceUrl}
                  </span>
                  {item.keywords.length > 0 ? (
                    <span className="mt-2 flex flex-wrap gap-1.5">
                      {item.keywords.slice(0, 4).map((keyword) => (
                        <span
                          key={`${item.sourceUrl}-${keyword}`}
                          className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600"
                        >
                          {keyword}
                        </span>
                      ))}
                    </span>
                  ) : null}
                </span>
                <span className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700">
                  <ExternalLink className="size-4" />
                  開く
                </span>
              </a>
            ))}
          </div>
        </Panel>
      ) : null}
    </div>
  );
}

function ProjectsView({
  projects,
  query,
  category,
  sortId,
  onQueryChange,
  onCategoryChange,
  onSortChange,
  onProjectSelect,
  onProjectSave
}: {
  projects: MakuakeProject[];
  query: string;
  category: ScoutCategory | "すべて";
  sortId: SortId;
  onQueryChange: (value: string) => void;
  onCategoryChange: (value: ScoutCategory | "すべて") => void;
  onSortChange: (value: SortId) => void;
  onProjectSelect: (projectId: string) => void;
  onProjectSave: (
    projectId: string,
    saved: boolean,
    note: string,
    userFeedback?: UserFeedback
  ) => void;
}) {
  return (
    <Panel>
      <div>
        <h2 className="text-2xl font-bold">プロジェクト一覧</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          取得キャッシュ内の候補を検索し、メモ付きで保存できます。
        </p>
      </div>
      <FilterBar
        query={query}
        category={category}
        sortId={sortId}
        onQueryChange={onQueryChange}
        onCategoryChange={onCategoryChange}
        onSortChange={onSortChange}
      />
      <ProjectList
        projects={projects}
        onProjectSelect={onProjectSelect}
        onProjectSave={onProjectSave}
      />
    </Panel>
  );
}

function ManualUrlRankedCard({ rank, item }: { rank: number; item: ManualSelectionUrl }) {
  return (
    <div className="grid gap-3 rounded-lg border border-emerald-200 bg-emerald-50/55 p-3 md:grid-cols-[3rem_minmax(0,1fr)_auto]">
      <div className="grid size-11 place-items-center rounded-lg bg-emerald-700 font-mono text-lg font-bold text-white">
        {rank}
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <CategoryBadge category={item.category} />
          <span className="rounded-lg bg-white px-2 py-1 text-xs font-bold text-emerald-700">
            URL採用
          </span>
          <span className="rounded-lg bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700">
            詳細未取得
          </span>
        </div>
        <h3 className="mt-3 truncate text-lg font-bold leading-snug">{item.title}</h3>
        <p className="mt-2 break-all text-xs leading-5 text-slate-600">{item.sourceUrl}</p>
        {item.keywords.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {item.keywords.slice(0, 5).map((keyword) => (
              <span
                key={`${item.sourceUrl}-${keyword}`}
                className="rounded-lg border border-emerald-200 bg-white px-2 py-1 text-xs font-semibold text-emerald-800"
              >
                {keyword}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      <a
        href={item.sourceUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-bold text-emerald-800 transition hover:bg-emerald-100"
      >
        <ExternalLink className="size-4" />
        開く
      </a>
    </div>
  );
}

function ScriptView({
  projects,
  weeklyCount,
  manualCount,
  scriptSource,
  generatedShort,
  isApproved,
  isGenerating,
  onScriptSourceChange,
  onApprovedChange,
  onGenerate
}: {
  projects: MakuakeProject[];
  weeklyCount: number;
  manualCount: number;
  scriptSource: ScriptSource;
  generatedShort: GeneratedShortPackage | null;
  isApproved: boolean;
  isGenerating: boolean;
  onScriptSourceChange: (value: ScriptSource) => void;
  onApprovedChange: (value: boolean) => void;
  onGenerate: () => void;
}) {
  const needsFive = projects.length < 5;

  return (
    <div className="grid gap-4">
      <Panel>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-rose-600">
              Approval Gate
            </p>
            <h2 className="mt-1 text-2xl font-bold">ショート台本生成</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              生成前に5件の内容を確認してください。承認後、60秒以内の構成案、ナレーション、YouTube Shorts文面、X投稿文を作成します。
            </p>
          </div>
          <button
            type="button"
            disabled={!isApproved || isGenerating || needsFive}
            onClick={onGenerate}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 active:translate-y-px disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
          >
            {isGenerating ? <Loader2 className="size-4 animate-spin" /> : <WandSparkles className="size-4" />}
            この5件で生成する
          </button>
        </div>

        <div className="mt-5 grid gap-2 rounded-lg border border-slate-200 bg-white p-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onScriptSourceChange("weekly")}
            className={cn(
              "rounded-lg px-3 py-2 text-left text-sm font-bold transition",
              scriptSource === "weekly"
                ? "bg-slate-950 text-white"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
            )}
          >
            今週の5選
            <span className="mt-1 block text-xs font-semibold opacity-75">{weeklyCount}/5件</span>
          </button>
          <button
            type="button"
            onClick={() => onScriptSourceChange("manual")}
            className={cn(
              "rounded-lg px-3 py-2 text-left text-sm font-bold transition",
              scriptSource === "manual"
                ? "bg-slate-950 text-white"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
            )}
          >
            任意で採用した5選
            <span className="mt-1 block text-xs font-semibold opacity-75">{manualCount}/5件</span>
          </button>
        </div>

        <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={isApproved}
              onChange={(event) => onApprovedChange(event.target.checked)}
              disabled={needsFive}
              className="mt-1 size-4 accent-slate-950"
            />
            <span>
              <span className="block text-sm font-bold">選抜5件を確認し、生成を承認する</span>
              <span className="mt-1 block text-sm leading-6 text-slate-600">
                {needsFive
                  ? "この枠はまだ5件そろっていません。採用候補を追加してください。"
                  : "Makuakeへ追加アクセスせず、SQLiteキャッシュ上の選抜結果だけを使って生成します。"}
              </span>
            </span>
          </label>
        </div>

        <div className="mt-4 grid gap-2">
          {projects.map((project, index) => (
            <div
              key={project.id}
              className="grid gap-3 rounded-lg border border-slate-200 p-3 sm:grid-cols-[2.5rem_minmax(0,1fr)_auto]"
            >
              <span className="grid size-9 place-items-center rounded-lg bg-slate-950 text-sm font-bold text-white">
                {index + 1}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{project.title}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{project.selectionReason}</p>
              </div>
              <FitScores project={project} compact />
            </div>
          ))}
        </div>
      </Panel>

      <GeneratedShortPanel generatedShort={generatedShort} projects={projects} />
    </div>
  );
}

function SavedView({
  projects,
  onProjectSelect,
  onProjectSave,
  onViewChange
}: {
  projects: MakuakeProject[];
  onProjectSelect: (projectId: string) => void;
  onProjectSave: (
    projectId: string,
    saved: boolean,
    note: string,
    userFeedback?: UserFeedback
  ) => void;
  onViewChange: (viewId: ViewId) => void;
}) {
  if (projects.length === 0) {
    return (
      <Panel>
        <div className="grid min-h-72 place-items-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <div>
            <Bookmark className="mx-auto size-10 text-slate-400" />
            <h2 className="mt-4 text-xl font-bold">保存済み候補はまだありません</h2>
            <p className="mt-2 text-sm text-slate-500">
              気になるプロジェクトを保存すると、メモ付きでここに残せます。
            </p>
            <button
              type="button"
              onClick={() => onViewChange("projects")}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-bold text-white"
            >
              候補を探す
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </Panel>
    );
  }

  return (
    <Panel>
      <div>
        <h2 className="text-2xl font-bold">保存済み候補</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          後で比較したい候補とメモをSQLiteに保存しています。
        </p>
      </div>
      <div className="mt-5 grid gap-3">
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onProjectSelect={onProjectSelect}
            onProjectSave={onProjectSave}
          />
        ))}
      </div>
    </Panel>
  );
}

function RightRail({
  weeklyTop,
  selectedProject,
  generatedShort,
  onProjectSelect,
  onScriptOpen
}: {
  weeklyTop: MakuakeProject[];
  selectedProject?: MakuakeProject;
  generatedShort: GeneratedShortPackage | null;
  onProjectSelect: (projectId: string) => void;
  onScriptOpen: () => void;
}) {
  return (
    <aside className="grid gap-4 2xl:sticky 2xl:top-5 2xl:self-start">
      <Panel className="border-amber-200 bg-amber-50">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-bold">今週のショート候補5選</h2>
          <button
            type="button"
            onClick={onScriptOpen}
            className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-white px-2.5 py-1.5 text-xs font-bold text-amber-900 transition hover:bg-amber-100"
          >
            <FileText className="size-3.5" />
            台本へ
          </button>
        </div>
        <div className="grid gap-2">
          {weeklyTop.map((project, index) => (
            <button
              key={project.id}
              type="button"
              onClick={() => onProjectSelect(project.id)}
              className="grid grid-cols-[2rem_3.5rem_minmax(0,1fr)_3.25rem] items-center gap-2 rounded-lg bg-white p-2 text-left shadow-[0_12px_30px_-24px_rgba(15,23,42,0.4)] transition hover:-translate-y-0.5"
            >
              <span className="grid size-7 place-items-center rounded-full bg-amber-100 text-xs font-bold text-amber-800">
                {index + 1}
              </span>
              <ProjectThumb project={project} className="h-12" />
              <span className="min-w-0">
                <span className="block truncate text-xs font-bold">{project.title}</span>
                <span className="mt-1 block truncate text-[0.68rem] text-slate-500">
                  {project.startAt}
                </span>
              </span>
              <span className="rounded-lg bg-emerald-50 px-2 py-1 text-center text-xs font-bold text-emerald-700">
                {project.fit.shorts}
              </span>
            </button>
          ))}
        </div>
      </Panel>

      {selectedProject ? (
        <Panel>
          <h2 className="text-base font-bold">選抜理由</h2>
          <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
            <ProjectThumb project={selectedProject} className="aspect-video rounded-none" />
          </div>
          <div className="mt-4">
            <div className="flex flex-wrap gap-2">
              <ScoreBadge score={selectedProject.score} />
              <CategoryBadge category={selectedProject.category} />
            </div>
            <h3 className="mt-3 text-lg font-bold leading-snug">{selectedProject.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {selectedProject.selectionReason}
            </p>
            <FitScores project={selectedProject} />
          </div>
        </Panel>
      ) : null}

      <Panel>
        <h2 className="text-base font-bold">ショート台本プレビュー</h2>
        {generatedShort ? (
          <div className="mt-4 grid gap-3">
            {generatedShort.structure.map((line) => (
              <div
                key={`${line.time}-${line.label}`}
                className="grid grid-cols-[3rem_minmax(0,1fr)] gap-3 text-sm"
              >
                <span className="font-mono text-xs font-bold text-slate-500">
                  {line.time}
                </span>
                <span>
                  <span className="block font-bold">{line.label}</span>
                  <span className="mt-1 block leading-5 text-slate-600">{line.text}</span>
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm leading-6 text-slate-500">
            5件を確認して承認すると、60秒以内の構成案がここに表示されます。
          </div>
        )}
      </Panel>
    </aside>
  );
}

function StatsGrid({
  stats
}: {
  stats: {
    total: number;
    gadgetCount: number;
    highShortsCount: number;
    manualCount: number;
    savedCount: number;
  };
}) {
  const items = [
    { label: "取得プロジェクト数", value: stats.total, icon: Database, tone: "bg-slate-950 text-white" },
    { label: "ガジェット系候補", value: stats.gadgetCount, icon: Star, tone: "bg-amber-100 text-amber-800" },
    { label: "ショート向き高スコア", value: stats.highShortsCount, icon: Video, tone: "bg-emerald-100 text-emerald-800" },
    { label: "任意採用候補", value: stats.manualCount, icon: BadgeCheck, tone: "bg-cyan-100 text-cyan-800" },
    { label: "保存済み候補", value: stats.savedCount, icon: Bookmark, tone: "bg-rose-100 text-rose-800" }
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <Panel key={item.label} className="p-4">
            <div className="flex items-center gap-3">
              <span className={cn("grid size-11 place-items-center rounded-lg", item.tone)}>
                <Icon className="size-5" />
              </span>
              <div>
                <p className="text-xs font-bold text-slate-500">{item.label}</p>
                <p className="mt-1 font-mono text-3xl font-bold">
                  {item.value}
                </p>
              </div>
            </div>
          </Panel>
        );
      })}
    </div>
  );
}

function FilterBar({
  query,
  category,
  sortId,
  onQueryChange,
  onCategoryChange,
  onSortChange
}: {
  query: string;
  category: ScoutCategory | "すべて";
  sortId: SortId;
  onQueryChange: (value: string) => void;
  onCategoryChange: (value: ScoutCategory | "すべて") => void;
  onSortChange: (value: SortId) => void;
}) {
  return (
    <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_13rem_13rem]">
      <label className="flex min-w-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus-within:border-slate-500">
        <Search className="size-4 text-slate-400" />
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="タイトル、説明、キーワードで検索"
          className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-slate-400"
        />
      </label>
      <label className="grid gap-1">
        <span className="sr-only">カテゴリ</span>
        <select
          value={category}
          onChange={(event) => onCategoryChange(event.target.value as ScoutCategory | "すべて")}
          className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-slate-500"
        >
          {categoryOptions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1">
        <span className="sr-only">並び順</span>
        <select
          value={sortId}
          onChange={(event) => onSortChange(event.target.value as SortId)}
          className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-slate-500"
        >
          <option value="recommended">おすすめ順</option>
          <option value="score">スコア順</option>
          <option value="shorts">ショート向き順</option>
          <option value="start">開始日が早い順</option>
        </select>
      </label>
    </div>
  );
}

function ProjectList({
  projects,
  onProjectSelect,
  onProjectSave
}: {
  projects: MakuakeProject[];
  onProjectSelect: (projectId: string) => void;
  onProjectSave: (
    projectId: string,
    saved: boolean,
    note: string,
    userFeedback?: UserFeedback
  ) => void;
}) {
  if (projects.length === 0) {
    return (
      <div className="mt-5 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
        <Search className="mx-auto size-8 text-slate-400" />
        <p className="mt-3 text-sm font-bold">条件に合うプロジェクトがありません</p>
        <p className="mt-1 text-sm text-slate-500">検索語やカテゴリを変えてみてください。</p>
      </div>
    );
  }

  return (
    <div className="mt-5 grid gap-3">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          onProjectSelect={onProjectSelect}
          onProjectSave={onProjectSave}
        />
      ))}
    </div>
  );
}

function ProjectCard({
  project,
  onProjectSelect,
  onProjectSave
}: {
  project: MakuakeProject;
  onProjectSelect: (projectId: string) => void;
  onProjectSave: (
    projectId: string,
    saved: boolean,
    note: string,
    userFeedback?: UserFeedback
  ) => void;
}) {
  const [note, setNote] = useState(project.note);

  useEffect(() => {
    setNote(project.note);
  }, [project.note]);

  return (
    <article className="grid gap-4 rounded-lg border border-slate-200 bg-white p-3 transition hover:border-slate-300 hover:shadow-[0_18px_45px_-34px_rgba(15,23,42,0.55)] xl:grid-cols-[16rem_minmax(0,1fr)_14rem]">
      <button
        type="button"
        onClick={() => onProjectSelect(project.id)}
        className="min-w-0 self-start overflow-hidden rounded-lg border border-slate-200 text-left"
        aria-label={`${project.title}を選択`}
      >
        <ProjectThumb project={project} className="aspect-video" />
      </button>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <ScoreBadge score={project.score} />
          <CategoryBadge category={project.category} />
          {project.excludedReason ? (
            <span className="rounded-lg bg-rose-50 px-2 py-1 text-xs font-bold text-rose-700">
              優先度低
            </span>
          ) : null}
        </div>
        <h3 className="mt-3 text-lg font-bold leading-snug">{project.title}</h3>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
          {project.description || "説明文は取得できていません。プロジェクトページで確認してください。"}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {project.keywords.slice(0, 5).map((keyword) => (
            <span
              key={keyword}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-600"
            >
              {keyword}
            </span>
          ))}
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-700">
          <span className="font-bold">選抜理由: </span>
          {project.selectionReason}
        </p>
        {project.learnedReason ? (
          <p className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm leading-6 text-emerald-800">
            <span className="font-bold">学習補正: </span>
            {project.learnedReason}
          </p>
        ) : null}
        {project.excludedReason ? (
          <p className="mt-2 text-sm leading-6 text-rose-700">{project.excludedReason}</p>
        ) : null}
      </div>

      <div className="grid gap-3 border-t border-slate-100 pt-3 xl:border-l xl:border-t-0 xl:pl-4 xl:pt-0">
        <FitScores project={project} />
        <LearningFeedbackControls
          project={project}
          note={note}
          onProjectSave={onProjectSave}
        />
        <div className="grid gap-2">
          <label className="grid gap-1">
            <span className="text-xs font-bold text-slate-500">保存メモ</span>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              onBlur={() => onProjectSave(project.id, project.saved, note)}
              placeholder="紹介角度、撮影時の注意、比較候補など"
              className="min-h-20 resize-y rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-5 outline-none transition focus:border-slate-500 focus:bg-white"
            />
          </label>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <button
              type="button"
              onClick={() => onProjectSave(project.id, !project.saved, note)}
              className={cn(
                "inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-bold transition active:translate-y-px",
                project.saved
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              )}
            >
              {project.saved ? <CheckCircle2 className="size-4" /> : <Bookmark className="size-4" />}
              {project.saved ? "保存済み" : "保存"}
            </button>
            <a
              href={project.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-600 transition hover:bg-slate-50"
              aria-label="Makuakeで開く"
            >
              <ExternalLink className="size-4" />
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}

function RankedProjectCard({
  rank,
  project,
  onProjectSelect,
  onProjectSave
}: {
  rank: number;
  project: MakuakeProject;
  onProjectSelect: (projectId: string) => void;
  onProjectSave: (
    projectId: string,
    saved: boolean,
    note: string,
    userFeedback?: UserFeedback
  ) => void;
}) {
  return (
    <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-3 md:grid-cols-[3rem_12rem_minmax(0,1fr)]">
      <div className="grid size-11 place-items-center rounded-lg bg-slate-950 font-mono text-lg font-bold text-white">
        {rank}
      </div>
      <button
        type="button"
        onClick={() => onProjectSelect(project.id)}
        className="self-start overflow-hidden rounded-lg border border-slate-200 text-left"
      >
        <ProjectThumb project={project} className="aspect-video" />
      </button>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <ScoreBadge score={project.score} />
          <CategoryBadge category={project.category} />
          <span className="rounded-lg bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">
            ショート向き {project.fit.shorts}
          </span>
        </div>
        <h3 className="mt-3 text-xl font-bold leading-snug">{project.title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">{project.description}</p>
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-950">
          <span className="font-bold">選抜理由: </span>
          {project.selectionReason}
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <FitScores project={project} compact />
          <LearningFeedbackControls
            project={project}
            note={project.note}
            onProjectSave={onProjectSave}
            compact
          />
          <button
            type="button"
            onClick={() => onProjectSave(project.id, !project.saved, project.note)}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold transition",
              project.saved
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-slate-200 text-slate-700 hover:bg-slate-50"
            )}
          >
            <Bookmark className="size-4" />
            {project.saved ? "保存済み" : "保存する"}
          </button>
        </div>
      </div>
    </div>
  );
}

function LearningFeedbackControls({
  project,
  note,
  onProjectSave,
  compact = false
}: {
  project: MakuakeProject;
  note: string;
  onProjectSave: (
    projectId: string,
    saved: boolean,
    note: string,
    userFeedback?: UserFeedback
  ) => void;
  compact?: boolean;
}) {
  const selectedActive = project.userFeedback === "selected";
  const rejectedActive = project.userFeedback === "rejected";

  return (
    <div className={cn("grid gap-2", compact ? "grid-cols-2" : "grid-cols-2")}>
      <button
        type="button"
        aria-pressed={selectedActive}
        onClick={() =>
          onProjectSave(
            project.id,
            selectedActive ? project.saved : true,
            note,
            selectedActive ? "" : "selected"
          )
        }
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold transition active:translate-y-px",
          selectedActive
            ? "border-emerald-300 bg-emerald-100 text-emerald-800"
            : "border-slate-200 bg-white text-slate-700 hover:bg-emerald-50 hover:text-emerald-800"
        )}
      >
        <BadgeCheck className="size-4" />
        採用
      </button>
      <button
        type="button"
        aria-pressed={rejectedActive}
        onClick={() =>
          onProjectSave(
            project.id,
            rejectedActive ? project.saved : false,
            note,
            rejectedActive ? "" : "rejected"
          )
        }
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold transition active:translate-y-px",
          rejectedActive
            ? "border-rose-300 bg-rose-100 text-rose-800"
            : "border-slate-200 bg-white text-slate-700 hover:bg-rose-50 hover:text-rose-800"
        )}
      >
        <XCircle className="size-4" />
        除外
      </button>
    </div>
  );
}

function GeneratedShortPanel({
  generatedShort,
  projects
}: {
  generatedShort: GeneratedShortPackage | null;
  projects: MakuakeProject[];
}) {
  const fallbackTitle = projects.length
    ? `今週のMakuake注目ガジェット5選｜${projects[0].keywords[0] ?? "最新候補"}`
    : "";

  if (!generatedShort) {
    return (
      <Panel>
        <div className="grid min-h-64 place-items-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <div>
            <MessageSquareText className="mx-auto size-10 text-slate-400" />
            <h3 className="mt-4 text-xl font-bold">生成結果はまだありません</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              承認チェック後に生成すると、60秒構成、ナレーション、YouTube Shorts文面、X投稿文が表示されます。
            </p>
          </div>
        </div>
      </Panel>
    );
  }

  return (
    <Panel>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
            Generated Package
          </p>
          <h3 className="mt-1 text-2xl font-bold">
            {generatedShort.title || fallbackTitle}
          </h3>
        </div>
        <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">
          {generatedShort.weekId}
        </span>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-lg border border-slate-200 p-4">
          <h4 className="text-sm font-bold">60秒構成案</h4>
          <div className="mt-4 grid gap-3">
            {generatedShort.structure.map((line) => (
              <div
                key={`${line.time}-${line.label}`}
                className="grid grid-cols-[3.5rem_minmax(0,1fr)] gap-3 rounded-lg bg-slate-50 p-3 text-sm"
              >
                <span className="font-mono text-xs font-bold text-slate-500">
                  {line.time}
                </span>
                <span>
                  <span className="block font-bold">{line.label}</span>
                  <span className="mt-1 block leading-6 text-slate-600">{line.text}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4">
          <EditableBox title="60秒以内ナレーション台本" value={generatedShort.narration} />
          <EditableBox title="YouTube Shortsタイトル" value={generatedShort.title} singleLine />
          <EditableBox title="YouTube説明文" value={generatedShort.description} />
          <EditableBox title="ハッシュタグ" value={generatedShort.hashtags.join(" ")} singleLine />
          <EditableBox title="X投稿文" value={generatedShort.xPost} />
        </div>
      </div>
    </Panel>
  );
}

function EditableBox({
  title,
  value,
  singleLine = false
}: {
  title: string;
  value: string;
  singleLine?: boolean;
}) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  return (
    <label className="grid gap-2">
      <span className="text-sm font-bold">{title}</span>
      {singleLine ? (
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          className="h-11 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-slate-500 focus:bg-white"
        />
      ) : (
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          className="min-h-28 resize-y rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-6 outline-none transition focus:border-slate-500 focus:bg-white"
        />
      )}
    </label>
  );
}

function ProjectThumb({
  project,
  className
}: {
  project: MakuakeProject;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!project.imageUrl || failed) {
    return (
      <div
        className={cn(
          "relative grid min-h-12 place-items-center overflow-hidden bg-[linear-gradient(135deg,#e2e8f0,#f8fafc_45%,#dbeafe)]",
          className
        )}
      >
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-950/20 to-transparent" />
        <div className="grid size-12 place-items-center rounded-lg border border-white/70 bg-white/75 text-slate-700 shadow-[0_18px_35px_-24px_rgba(15,23,42,0.6)]">
          <Video className="size-6" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden bg-slate-100", className)}>
      <img
        src={project.imageUrl}
        alt={project.title}
        onError={() => setFailed(true)}
        className="absolute inset-0 h-full w-full object-contain"
      />
    </div>
  );
}

function FitScores({
  project,
  compact = false
}: {
  project: MakuakeProject;
  compact?: boolean;
}) {
  const items = [
    { label: "ブログ向き", value: project.fit.blog, tone: "text-sky-700 bg-sky-50" },
    { label: "YouTube向き", value: project.fit.youtube, tone: "text-rose-700 bg-rose-50" },
    { label: "ショート向き", value: project.fit.shorts, tone: "text-emerald-700 bg-emerald-50" }
  ];

  return (
    <div className={cn("grid gap-2", compact ? "grid-cols-3" : "grid-cols-1")}>
      {items.map((item) => (
        <div
          key={item.label}
          className={cn(
            "rounded-lg px-2 py-2 text-center",
            item.tone,
            compact && "min-w-[4.75rem]"
          )}
        >
          <p className="text-[0.68rem] font-bold">{item.label}</p>
          <p className="font-mono text-lg font-bold leading-tight">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-lg bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800">
      <BarChart3 className="size-3.5" />
      スコア {score}
    </span>
  );
}

function CategoryBadge({ category }: { category: ScoutCategory }) {
  return (
    <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">
      {category}
    </span>
  );
}

function Panel({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "min-w-0 rounded-lg border border-slate-200 bg-white p-4 shadow-[0_18px_45px_-38px_rgba(15,23,42,0.55)] md:p-5",
        className
      )}
    >
      {children}
    </section>
  );
}

function RuleRow({
  icon: Icon,
  title,
  body
}: {
  icon: typeof Sparkles;
  title: string;
  body: string;
}) {
  return (
    <div className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3">
      <span className="grid size-10 place-items-center rounded-lg bg-slate-100 text-slate-700">
        <Icon className="size-4" />
      </span>
      <span>
        <span className="block text-sm font-bold">{title}</span>
        <span className="mt-1 block text-sm leading-6 text-slate-600">{body}</span>
      </span>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-3">
      <span className="text-xs font-bold text-slate-500">{label}</span>
      <span className="min-w-0 break-all text-xs font-semibold text-slate-800">
        {value || "未設定"}
      </span>
    </div>
  );
}

function filterProjects(
  projects: MakuakeProject[],
  query: string,
  category: ScoutCategory | "すべて",
  sortId: SortId
) {
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = projects.filter((project) => {
    const matchesCategory = category === "すべて" || project.category === category;
    const haystack = [
      project.title,
      project.description,
      project.category,
      project.keywords.join(" "),
      project.selectionReason
    ]
      .join(" ")
      .toLowerCase();
    const matchesQuery = !normalizedQuery || haystack.includes(normalizedQuery);

    return matchesCategory && matchesQuery;
  });

  return filtered.sort((a, b) => {
    if (sortId === "score") {
      return b.score - a.score;
    }

    if (sortId === "shorts") {
      return b.fit.shorts - a.fit.shorts;
    }

    if (sortId === "start") {
      return a.startAt.localeCompare(b.startAt, "ja");
    }

    if (a.excludedReason && !b.excludedReason) {
      return 1;
    }

    if (!a.excludedReason && b.excludedReason) {
      return -1;
    }

    return b.fit.shorts - a.fit.shorts || b.score - a.score;
  });
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Tokyo"
  }).format(date);
}
