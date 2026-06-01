import {
  Box,
  Copy,
  FileText,
  FolderOpen,
  LayoutDashboard,
  Menu,
  Plus,
  Search,
  Settings,
  Trash2,
  Video
} from "lucide-react";
import { templateItems, type ProjectSummary } from "@/data/mockProjects";
import { Badge, Button, TinyDot } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";

export function Sidebar({
  projects,
  selectedProjectId,
  onSelectProject,
  onCreateProject,
  onDuplicateProject,
  onDeleteProject
}: {
  projects: ProjectSummary[];
  selectedProjectId: string;
  onSelectProject: (projectId: string) => void;
  onCreateProject: () => void;
  onDuplicateProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const filteredProjects = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return projects;
    }

    return projects.filter((project) =>
      `${project.name} ${project.status} ${project.updatedAt}`
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [projects, query]);
  const selectedProject = projects.find((project) => project.id === selectedProjectId);

  return (
    <aside className="glass-panel rounded-none border-x-0 border-t-0 p-4 lg:sticky lg:top-0 lg:h-[100dvh] lg:w-[17.5rem] lg:overflow-y-auto lg:border-l-0 lg:border-r lg:rounded-none">
      <div className="flex items-center gap-3">
        <Button variant="ghost" className="size-10 shrink-0 px-0" aria-label="メニュー">
          <Menu className="size-5" />
        </Button>
        <div>
          <p className="text-base font-bold tracking-tight text-white">
            Gadget Content Studio
          </p>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-slate-500">
            by NAGAKEN
          </p>
        </div>
      </div>

      <Button
        type="button"
        variant="primary"
        className="mt-5 w-full justify-start py-3 lg:mt-5"
        onClick={onCreateProject}
      >
        <Plus className="size-4" />
        新規プロジェクト
      </Button>

      <div className="mt-6 space-y-6 lg:mt-7">
        <SidebarGroup
          title="プロジェクト"
          action={<Search className="size-4 text-slate-500" />}
        >
          <label className="flex w-full items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/35 px-2 py-2 text-sm text-slate-400 transition focus-within:border-violet-400/45">
            <Search className="size-4" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="プロジェクト検索"
              className="min-w-0 flex-1 bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-500"
            />
          </label>
          <div className="studio-scrollbar -mx-1 mt-2 flex gap-2 overflow-x-auto px-1 pb-1 lg:mx-0 lg:grid lg:grid-cols-1 lg:overflow-visible lg:px-0 lg:pb-0">
            {filteredProjects.map((project) => {
              const isSelected = project.id === selectedProjectId;

              return (
                <button
                  key={project.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => onSelectProject(project.id)}
                  className={cn(
                    "flex w-[16rem] shrink-0 items-center gap-3 rounded-xl border p-2 text-left transition duration-200 active:translate-y-px lg:w-full",
                    isSelected
                      ? "border-violet-400/35 bg-violet-500/18"
                      : "border-transparent bg-transparent hover:border-slate-700/70 hover:bg-white/[0.04]"
                  )}
                >
                  <span
                    className={cn(
                      "grid size-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-gradient-to-br",
                      project.thumbnailAccent
                    )}
                  >
                    <span className="ring-visual size-full" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-slate-100">
                      {project.name}
                    </span>
                    <span className="mt-1 flex min-w-0 items-center gap-2">
                      <span className="truncate text-xs text-slate-400">
                        更新: {project.updatedAt}
                      </span>
                      <Badge
                        tone={project.status === "公開済み" ? "mint" : "violet"}
                        className="min-h-5 shrink-0 rounded-md px-1.5 text-[0.62rem]"
                      >
                        {project.status}
                      </Badge>
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          {filteredProjects.length === 0 ? (
            <p className="mt-3 rounded-xl border border-slate-800 bg-slate-950/35 px-3 py-2 text-xs text-slate-500">
              該当するプロジェクトはありません
            </p>
          ) : null}
          {selectedProject ? (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="soft"
                className="h-9 text-xs"
                onClick={() => onDuplicateProject(selectedProject.id)}
              >
                <Copy className="size-3.5" />
                複製
              </Button>
              <Button
                type="button"
                variant="soft"
                className="h-9 text-xs text-rose-100 hover:bg-rose-400/10"
                onClick={() => onDeleteProject(selectedProject.id)}
                disabled={projects.length <= 1}
              >
                <Trash2 className="size-3.5" />
                削除
              </Button>
            </div>
          ) : null}
        </SidebarGroup>

        <SidebarGroup title="テンプレート" className="hidden lg:block">
          <div className="grid gap-1">
            {templateItems.map((template, index) => (
              <button
                key={template}
                className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left text-sm text-slate-300 transition hover:bg-white/[0.05] hover:text-white"
              >
                {index === 1 || index === 2 ? (
                  <Video className="size-4 text-slate-500" />
                ) : (
                  <FileText className="size-4 text-slate-500" />
                )}
                {template}
              </button>
            ))}
          </div>
        </SidebarGroup>

        <div className="hidden gap-1 border-t border-slate-800 pt-4 lg:grid">
          <button className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left text-sm text-slate-300 transition hover:bg-white/[0.05] hover:text-white">
            <FolderOpen className="size-4 text-slate-500" />
            素材ライブラリ
          </button>
          <button className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left text-sm text-slate-300 transition hover:bg-white/[0.05] hover:text-white">
            <Settings className="size-4 text-slate-500" />
            設定
          </button>
        </div>
      </div>

      <div className="mt-8 hidden rounded-xl border border-slate-800 bg-slate-950/40 p-3 lg:block">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-slate-700">
            <Box className="size-5 text-violet-100" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Codex App Server</p>
            <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
              <TinyDot />
              接続中
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function SidebarGroup({
  title,
  action,
  children,
  className
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="text-sm font-bold text-slate-200">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}
