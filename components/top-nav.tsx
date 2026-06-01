import {
  Bell,
  Bot,
  ChevronDown,
  Crown,
  FileText,
  FolderOpen,
  Hash,
  LayoutDashboard,
  Megaphone,
  PenLine,
  Video
} from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "ダッシュボード", icon: LayoutDashboard, active: true },
  { label: "記事作成", icon: PenLine },
  { label: "動画制作", icon: Video },
  { label: "ショート動画", icon: Hash },
  { label: "SNS投稿", icon: Megaphone },
  { label: "LP制作", icon: FileText },
  { label: "素材管理", icon: FolderOpen }
];

export function TopNav({
  isChatOpen,
  onOpenChat
}: {
  isChatOpen: boolean;
  onOpenChat: () => void;
}) {
  return (
    <header className="sticky top-0 z-20 -mx-4 border-b border-slate-800/90 bg-[#07101d]/88 px-4 py-3 backdrop-blur-xl md:-mx-6 md:px-6">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <nav className="studio-scrollbar flex min-w-0 gap-1 overflow-x-auto pb-1">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.label}
                className={cn(
                  "group inline-flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-sm transition duration-200 active:translate-y-px",
                  item.active
                    ? "border-violet-400/35 bg-violet-500/15 text-violet-100"
                    : "border-transparent text-slate-400 hover:bg-white/[0.05] hover:text-slate-100"
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={isChatOpen ? "primary" : "soft"}
            className="h-10"
            onClick={onOpenChat}
          >
            <Bot className="size-4" />
            AIチャット
          </Button>
          <Button variant="primary" className="h-10">
            <Crown className="size-4" />
            アップグレード
          </Button>
          <Button variant="ghost" className="relative size-10 px-0" aria-label="通知">
            <Bell className="size-4" />
            <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-rose-400" />
          </Button>
          <button className="inline-flex h-10 items-center gap-2 rounded-xl border border-transparent px-2 text-sm font-semibold text-slate-100 transition hover:bg-white/[0.05]">
            <span className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-slate-200 to-slate-600 text-xs text-slate-950">
              N
            </span>
            ナガケン
            <ChevronDown className="size-4 text-slate-500" />
          </button>
        </div>
      </div>
    </header>
  );
}
