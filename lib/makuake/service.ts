import {
  generateShortForProjects,
  getScoutState,
  getSourceUrl,
  getTokyoDateKey,
  getDailyFetchStatus,
  markFetchCompleted,
  setMetadata,
  upsertProjects,
  writeFetchLog
} from "@/lib/makuake/db";
import { normalizeProject } from "@/lib/makuake/scoring";
import { scrapeComingSoonProjects } from "@/lib/makuake/scraper";
import type { RefreshResult } from "@/lib/makuake/types";

export async function refreshComingSoonProjects(): Promise<RefreshResult> {
  const todayKey = getTokyoDateKey();
  const fetchStatus = getDailyFetchStatus(todayKey);

  if (!fetchStatus.canFetchToday) {
    return {
      state: getScoutState(),
      refreshed: false,
      message: "本日は2回取得済みです。Makuakeへのアクセスは1日2回に制限しています。"
    };
  }

  const sourceUrl = getSourceUrl();

  try {
    const rawProjects = await scrapeComingSoonProjects(sourceUrl);
    const projects = rawProjects.filter(isValidRawProject).map(normalizeProject);

    if (projects.length === 0) {
      const message =
        "Makuakeからプロジェクトを抽出できませんでした。既存キャッシュを保持しています。";

      setMetadata("fetch_message", message);
      writeFetchLog("empty", 0, message);

      return {
        state: getScoutState(),
        refreshed: false,
        message
      };
    }

    upsertProjects(projects);
    markFetchCompleted(
      projects.length,
      `${projects.length}件を取得し、SQLiteへ保存しました。追加カードが止まるまで全件走査します。`
    );

    return {
      state: getScoutState(),
      refreshed: true,
      message: `${projects.length}件を取得し、ガジェットスコアを更新しました。追加カードが止まるまで全件走査済みです。`
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? `取得に失敗しました。既存キャッシュを表示します。${error.message}`
        : "取得に失敗しました。既存キャッシュを表示します。";

    setMetadata("fetch_message", message);
    writeFetchLog("error", 0, message);

    return {
      state: getScoutState(),
      refreshed: false,
      message
    };
  }
}

export function createApprovedShort(projectIds: string[]) {
  return generateShortForProjects(projectIds);
}

function isValidRawProject(project: { title?: string; description?: string }) {
  const title = project.title?.trim() ?? "";
  const description = project.description?.trim() ?? "";

  return Boolean(
    title.length >= 8 &&
      title !== "もうすぐ開始" &&
      !title.startsWith("ホーム") &&
      !description.startsWith("ホームもうすぐ開始 表示設定")
  );
}
