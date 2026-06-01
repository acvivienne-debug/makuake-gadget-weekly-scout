import {
  Archive,
  Download,
  File,
  FileArchive,
  FileVideo,
  Folder,
  Image,
  Maximize2,
  Play,
  Upload
} from "lucide-react";
import {
  type AssetType,
  type ExportOption,
  type ProjectDetail
} from "@/data/mockProjects";
import { Button, Panel } from "@/components/ui";
import { cn } from "@/lib/utils";

const assetIcons: Record<AssetType, typeof Image> = {
  image: Image,
  video: FileVideo,
  pdf: File,
  folder: Folder
};

const exportIcons: Record<ExportOption["kind"], typeof Download> = {
  wordpress: Archive,
  text: Download,
  subtitle: Download,
  data: Download,
  zip: FileArchive
};

export function RightColumn({
  project,
  exportStatus,
  onAddAssets,
  onExport
}: {
  project: ProjectDetail;
  exportStatus: string;
  onAddAssets: (files: File[]) => void;
  onExport: (option: ExportOption) => void;
}) {
  const { assets, exportOptions, preview } = project;

  return (
    <aside className="grid gap-4 xl:sticky xl:top-[5.75rem] xl:self-start">
      <Panel className="animate-rise" style={{ "--delay": 2 } as React.CSSProperties}>
        <h2 className="mb-4 text-base font-bold text-white">プレビューエリア</h2>
        <div className="overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-950/50">
          <div className="ring-visual relative aspect-video">
            <div className="absolute inset-0 bg-gradient-to-t from-black/72 via-transparent to-black/16" />
            <button
              className="absolute left-1/2 top-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-slate-950/58 text-white backdrop-blur transition hover:scale-105 active:scale-95"
              aria-label="動画プレビューを再生"
            >
              <Play className="ml-1 size-7 fill-current" />
            </button>
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs font-semibold text-white">
              <span>{preview.durationLabel}</span>
              <Maximize2 className="size-4" />
            </div>
          </div>
          <div className="grid grid-cols-5 gap-2 p-3">
            {preview.thumbnailSwatches.map((thumb, index) => (
              <button
                key={`${thumb}-${index}`}
                className={cn(
                  "aspect-video rounded-lg border bg-gradient-to-br transition hover:scale-[1.03]",
                  thumb,
                  index === 0 ? "border-violet-400/70" : "border-slate-700/60"
                )}
                aria-label={`サムネ候補 ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </Panel>

      <Panel className="animate-rise" style={{ "--delay": 3 } as React.CSSProperties}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-bold text-white">素材ライブラリ</h2>
          <button className="text-xs font-semibold text-slate-400 transition hover:text-white">
            すべて表示
          </button>
        </div>

        <label className="mb-4 flex w-full cursor-pointer items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-700 bg-slate-950/35 px-4 py-5 text-center text-xs text-slate-400 transition hover:border-violet-400/45 hover:text-slate-200">
          <Upload className="size-5" />
          <span>
            ファイルをドラッグ＆ドロップ
            <span className="block text-slate-500">またはクリックしてアップロード</span>
          </span>
          <input
            type="file"
            multiple
            className="sr-only"
            onChange={(event) => {
              const files = Array.from(event.target.files ?? []);

              if (files.length > 0) {
                onAddAssets(files);
                event.target.value = "";
              }
            }}
          />
        </label>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3">
          {assets.map((asset) => {
            const Icon = assetIcons[asset.type];

            return (
              <button
                key={asset.id}
                className="group overflow-hidden rounded-xl border border-slate-800 bg-slate-950/35 text-left transition hover:border-slate-600 hover:bg-white/[0.055]"
              >
                {asset.type === "image" || asset.type === "video" ? (
                  <span
                    className="thumb-scene block aspect-[1.28/1] border-b border-slate-800"
                    style={
                      {
                        "--a": asset.swatch?.a ?? "#253144",
                        "--b": asset.swatch?.b ?? "#0f172a"
                      } as React.CSSProperties
                    }
                  />
                ) : (
                  <span className="grid aspect-[1.28/1] place-items-center border-b border-slate-800 bg-slate-900/80">
                    <Icon
                      className={cn(
                        "size-9",
                        asset.type === "folder"
                          ? "text-amber-300"
                          : asset.name.includes("manual")
                            ? "text-lime-300"
                            : "text-rose-300"
                      )}
                    />
                  </span>
                )}
                <span className="block min-w-0 p-2.5">
                  <span className="block truncate text-xs font-bold text-slate-100">
                    {asset.name}
                  </span>
                  <span className="mt-1 block truncate text-[0.68rem] text-slate-500">
                    {asset.dateLabel}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </Panel>

      <Panel className="animate-rise" style={{ "--delay": 4 } as React.CSSProperties}>
        <h2 className="mb-4 text-base font-bold text-white">出力・エクスポート</h2>
        <div className="grid gap-2">
          {exportOptions.map((item) => {
            const Icon = exportIcons[item.kind];

            return (
              <Button
                key={item.id}
                type="button"
                variant="soft"
                className="h-11 justify-start rounded-xl"
                onClick={() => onExport(item)}
              >
                <Icon className="size-4" />
                {item.label}
              </Button>
            );
          })}
        </div>
        <p className="mt-3 rounded-xl border border-slate-800 bg-slate-950/35 px-3 py-2 text-xs text-slate-400">
          {exportStatus}
        </p>
      </Panel>
    </aside>
  );
}
