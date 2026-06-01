import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { scoutSeedProjects } from "@/data/scoutSeedProjects";
import { buildShortPackage } from "@/lib/makuake/content";
import { normalizeProject, selectWeeklyProjects } from "@/lib/makuake/scoring";
import type {
  GeneratedShortPackage,
  MakuakeProject,
  ManualSelectionUrl,
  ScoutMeta,
  ScoutState,
  UserFeedback
} from "@/lib/makuake/types";

const DATABASE_PATH = join(process.cwd(), ".codex-app-server", "makuake-scout.sqlite");
const DEFAULT_SOURCE_URL = "https://www.makuake.com/discover/coming-soon";
const SCORING_VERSION = "2026-05-13.2";
const DAILY_FETCH_LIMIT = 2;

type ProjectRow = {
  id: string;
  source_url: string;
  title: string;
  description: string;
  image_url: string;
  start_at: string;
  category: MakuakeProject["category"];
  keywords_json: string;
  score: number;
  score_breakdown_json: string;
  fit_json: string;
  selection_reason: string;
  excluded_reason: string;
  saved: number;
  note: string;
  user_feedback: UserFeedback | string;
  last_seen_at: string;
  created_at: string;
  updated_at: string;
};

type MetadataRow = {
  key: string;
  value: string;
};

type CountRow = {
  count: number;
};

type GeneratedRow = {
  week_id: string;
  project_ids_json: string;
  generated_json: string;
  approved_at: string;
  created_at: string;
  updated_at: string;
};

type SelectionExampleRow = {
  url: string;
  title: string;
  category: MakuakeProject["category"];
  keywords_json: string;
  feedback: UserFeedback | string;
  source: string;
  created_at: string;
  updated_at: string;
};

type LearningSignal = {
  category: MakuakeProject["category"];
  keywords: string[];
  userFeedback: Exclude<UserFeedback, "">;
  saved: boolean;
  strength: "project" | "url";
};

let initialized = false;

export function ensureDatabase() {
  if (initialized) {
    return;
  }

  mkdirSync(dirname(DATABASE_PATH), { recursive: true });
  executeSql(`
    CREATE TABLE IF NOT EXISTS metadata (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      source_url TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      image_url TEXT NOT NULL,
      start_at TEXT NOT NULL,
      category TEXT NOT NULL,
      keywords_json TEXT NOT NULL,
      score INTEGER NOT NULL,
      score_breakdown_json TEXT NOT NULL,
      fit_json TEXT NOT NULL,
      selection_reason TEXT NOT NULL,
      excluded_reason TEXT NOT NULL,
      saved INTEGER NOT NULL DEFAULT 0,
      note TEXT NOT NULL DEFAULT '',
      user_feedback TEXT NOT NULL DEFAULT '',
      last_seen_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS fetch_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fetched_at TEXT NOT NULL,
      source_url TEXT NOT NULL,
      project_count INTEGER NOT NULL,
      status TEXT NOT NULL,
      message TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS weekly_content (
      week_id TEXT PRIMARY KEY,
      project_ids_json TEXT NOT NULL,
      generated_json TEXT NOT NULL,
      approved_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS selection_examples (
      url TEXT PRIMARY KEY,
      title TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL,
      keywords_json TEXT NOT NULL,
      feedback TEXT NOT NULL,
      source TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  initialized = true;
  ensureColumn("projects", "user_feedback", "TEXT NOT NULL DEFAULT ''");

  const [{ count = 0 } = { count: 0 }] = querySql<CountRow>(
    "SELECT COUNT(*) AS count FROM projects;"
  );

  if (Number(count) === 0) {
    upsertProjects(scoutSeedProjects.map(normalizeProject));
    setMetadata("seeded_at", new Date().toISOString());
    setMetadata(
      "fetch_message",
      "初期デモデータを表示中。取得ボタンからMakuakeの最新キャッシュへ更新できます。"
    );
  }

  const [scoringVersionRow] = querySql<MetadataRow>(
    "SELECT key, value FROM metadata WHERE key = 'scoring_version' LIMIT 1;"
  );

  if (scoringVersionRow?.value !== SCORING_VERSION) {
    rescoreCachedProjects();
    setMetadata("scoring_version", SCORING_VERSION);
  }

  const removedInvalidCount = purgeInvalidProjects();

  if (removedInvalidCount > 0) {
    setMetadata(
      "fetch_message",
      `${removedInvalidCount}件の不正な抽出行を除外しました。次回取得から調整済みセレクタを使います。`
    );
  }
}

export function getScoutState(): ScoutState {
  ensureDatabase();
  purgeInvalidProjects();
  purgeSeedProjectsWhenRealDataExists();

  const projects = getProjects();
  const weeklyTop = selectWeeklyProjects(projects);
  const manualTop = selectManualTopProjects(projects);
  const manualSelectionUrls = getManualSelectionUrls();
  const savedProjects = projects.filter((project) => project.saved);
  const generatedShort = getLatestGeneratedShort();

  return {
    projects,
    weeklyTop,
    manualTop,
    manualSelectionUrls,
    savedProjects,
    generatedShort,
    meta: getScoutMeta()
  };
}

export function getProjects() {
  ensureDatabase();

  const projects = querySql<ProjectRow>(
    "SELECT * FROM projects ORDER BY score DESC, updated_at DESC;"
  ).map(projectFromRow);

  return applyLearningToProjects(projects, getSelectionExamples()).sort(
    (a, b) => b.score - a.score || b.fit.shorts - a.fit.shorts
  );
}

export function getProjectsByIds(ids: string[]) {
  ensureDatabase();

  if (ids.length === 0) {
    return [];
  }

  const projects = getProjects();
  const projectMap = new Map(projects.map((project) => [project.id, project]));

  return ids
    .map((id) => projectMap.get(id))
    .filter((project): project is MakuakeProject => Boolean(project));
}

export function upsertProjects(projects: MakuakeProject[]) {
  ensureDatabase();

  if (projects.length === 0) {
    return;
  }

  const selectedExampleUrls = new Set(
    querySql<{ url: string }>("SELECT url FROM selection_examples WHERE feedback = 'selected';").map(
      (row) => normalizeProjectUrl(row.url)
    )
  );
  const statements = projects.map((project) => {
    const updatedAt = new Date().toISOString();
    const projectUrl = normalizeProjectUrl(project.sourceUrl);
    const learnedFeedback = selectedExampleUrls.has(projectUrl) ? "selected" : project.userFeedback;
    const learnedSaved = learnedFeedback === "selected" ? true : project.saved;

    return `
      INSERT INTO projects (
        id,
        source_url,
        title,
        description,
        image_url,
        start_at,
        category,
        keywords_json,
        score,
        score_breakdown_json,
        fit_json,
        selection_reason,
        excluded_reason,
        saved,
        note,
        user_feedback,
        last_seen_at,
        created_at,
        updated_at
      ) VALUES (
        ${sqlString(project.id)},
        ${sqlString(project.sourceUrl)},
        ${sqlString(project.title)},
        ${sqlString(project.description)},
        ${sqlString(project.imageUrl)},
        ${sqlString(project.startAt)},
        ${sqlString(project.category)},
        ${sqlString(JSON.stringify(project.keywords))},
        ${project.score},
        ${sqlString(JSON.stringify(project.scoreBreakdown))},
        ${sqlString(JSON.stringify(project.fit))},
        ${sqlString(project.selectionReason)},
        ${sqlString(project.excludedReason)},
        ${learnedSaved ? 1 : 0},
        ${sqlString(project.note)},
        ${sqlString(learnedFeedback)},
        ${sqlString(project.lastSeenAt)},
        ${sqlString(project.createdAt)},
        ${sqlString(updatedAt)}
      )
      ON CONFLICT(id) DO UPDATE SET
        source_url = excluded.source_url,
        title = excluded.title,
        description = excluded.description,
        image_url = excluded.image_url,
        start_at = excluded.start_at,
        category = excluded.category,
        keywords_json = excluded.keywords_json,
        score = excluded.score,
        score_breakdown_json = excluded.score_breakdown_json,
        fit_json = excluded.fit_json,
        selection_reason = excluded.selection_reason,
        excluded_reason = excluded.excluded_reason,
        saved = CASE
          WHEN projects.user_feedback = '' AND excluded.user_feedback <> '' THEN excluded.saved
          ELSE projects.saved
        END,
        note = projects.note,
        user_feedback = CASE
          WHEN projects.user_feedback = '' THEN excluded.user_feedback
          ELSE projects.user_feedback
        END,
        last_seen_at = excluded.last_seen_at,
        created_at = projects.created_at,
        updated_at = excluded.updated_at;
    `;
  });

  executeSql(`BEGIN TRANSACTION;${statements.join("\n")}COMMIT;`);
  purgeSeedProjectsWhenRealDataExists();
}

export function updateProjectNote(
  projectId: string,
  note: string,
  saved: boolean,
  userFeedback?: UserFeedback
) {
  ensureDatabase();
  const feedbackUpdate =
    userFeedback === undefined
      ? "user_feedback = user_feedback"
      : `user_feedback = ${sqlString(userFeedback)}`;

  executeSql(`
    UPDATE projects
    SET note = ${sqlString(note)},
        saved = ${saved ? 1 : 0},
        ${feedbackUpdate},
        updated_at = ${sqlString(new Date().toISOString())}
    WHERE id = ${sqlString(projectId)};
  `);

  return getScoutState();
}

export function importSelectedProjectUrls(urls: string[]) {
  ensureDatabase();

  const normalizedUrls = Array.from(
    new Set(urls.map(normalizeProjectUrl).filter((url): url is string => Boolean(url)))
  );

  if (normalizedUrls.length === 0) {
    return {
      state: getScoutState(),
      imported: 0,
      matched: 0,
      storedExamples: 0
    };
  }

  const now = new Date().toISOString();
  const existingRows = querySql<{ id: string; source_url: string }>(
    `SELECT id, source_url FROM projects WHERE source_url IN (${normalizedUrls.map(sqlString).join(", ")});`
  );
  const existingUrls = new Set(existingRows.map((row) => normalizeProjectUrl(row.source_url)));
  const markStatements = existingRows.map(
    (row) => `
      UPDATE projects
      SET saved = 1,
          user_feedback = 'selected',
          updated_at = ${sqlString(now)}
      WHERE id = ${sqlString(row.id)};
    `
  );
  const exampleStatements = normalizedUrls
    .filter((url) => !existingUrls.has(url))
    .map((url) => {
      const example = buildSelectionExampleFromUrl(url);

      return `
        INSERT INTO selection_examples (
          url,
          title,
          category,
          keywords_json,
          feedback,
          source,
          created_at,
          updated_at
        ) VALUES (
          ${sqlString(url)},
          '',
          ${sqlString(example.category)},
          ${sqlString(JSON.stringify(example.keywords))},
          'selected',
          'manual-url',
          ${sqlString(now)},
          ${sqlString(now)}
        )
        ON CONFLICT(url) DO UPDATE SET
          category = excluded.category,
          keywords_json = excluded.keywords_json,
          feedback = 'selected',
          source = excluded.source,
          updated_at = excluded.updated_at;
      `;
    });

  executeSql(`BEGIN TRANSACTION;${[...markStatements, ...exampleStatements].join("\n")}COMMIT;`);

  const matched = existingRows.length;
  const storedExamples = exampleStatements.length;
  setMetadata(
    "fetch_message",
    `今回の選抜URL${normalizedUrls.length}件を学習データとして保存しました。キャッシュ一致${matched}件、外部選抜履歴${storedExamples}件です。`
  );

  return {
    state: getScoutState(),
    imported: normalizedUrls.length,
    matched,
    storedExamples
  };
}

export function saveGeneratedShort(packageData: GeneratedShortPackage) {
  ensureDatabase();
  const now = new Date().toISOString();

  executeSql(`
    INSERT INTO weekly_content (
      week_id,
      project_ids_json,
      generated_json,
      approved_at,
      created_at,
      updated_at
    ) VALUES (
      ${sqlString(packageData.weekId)},
      ${sqlString(JSON.stringify(packageData.projectIds))},
      ${sqlString(JSON.stringify(packageData))},
      ${sqlString(packageData.approvedAt)},
      ${sqlString(now)},
      ${sqlString(now)}
    )
    ON CONFLICT(week_id) DO UPDATE SET
      project_ids_json = excluded.project_ids_json,
      generated_json = excluded.generated_json,
      approved_at = excluded.approved_at,
      updated_at = excluded.updated_at;
  `);

  return getScoutState();
}

export function generateShortForProjects(projectIds: string[]) {
  const projects = getProjectsByIds(projectIds);
  const generatedShort = buildShortPackage(projects);

  return saveGeneratedShort(generatedShort);
}

export function getMetadata(key: string) {
  ensureDatabase();
  const [row] = querySql<MetadataRow>(
    `SELECT key, value FROM metadata WHERE key = ${sqlString(key)} LIMIT 1;`
  );

  return row?.value ?? "";
}

export function setMetadata(key: string, value: string) {
  executeSql(`
    INSERT INTO metadata (key, value)
    VALUES (${sqlString(key)}, ${sqlString(value)})
    ON CONFLICT(key) DO UPDATE SET value = excluded.value;
  `);
}

export function writeFetchLog(status: string, projectCount: number, message: string) {
  executeSql(`
    INSERT INTO fetch_logs (fetched_at, source_url, project_count, status, message)
    VALUES (
      ${sqlString(new Date().toISOString())},
      ${sqlString(getSourceUrl())},
      ${projectCount},
      ${sqlString(status)},
      ${sqlString(message)}
    );
  `);
}

export function markFetchCompleted(projectCount: number, message: string) {
  const now = new Date().toISOString();
  const todayKey = getTokyoDateKey(new Date(now));
  const fetchStatus = getDailyFetchStatus(todayKey);
  const nextFetchCount = Math.min(fetchStatus.fetchesToday + 1, DAILY_FETCH_LIMIT);

  setMetadata("last_fetch_at", now);
  setMetadata("last_fetch_date", todayKey);
  setMetadata("daily_fetch_date", todayKey);
  setMetadata("daily_fetch_count", String(nextFetchCount));
  setMetadata("fetch_message", message);
  writeFetchLog("success", projectCount, message);
}

export function getDailyFetchStatus(todayKey = getTokyoDateKey()) {
  const dailyFetchDate = getMetadata("daily_fetch_date");
  const dailyFetchCount = Number(getMetadata("daily_fetch_count") || "0");
  const lastFetchDate = getMetadata("last_fetch_date");
  const fetchesToday =
    dailyFetchDate === todayKey
      ? clampNumber(Number.isFinite(dailyFetchCount) ? dailyFetchCount : 0, 0, DAILY_FETCH_LIMIT)
      : lastFetchDate === todayKey
        ? 1
        : 0;
  const remainingFetchesToday = Math.max(DAILY_FETCH_LIMIT - fetchesToday, 0);

  return {
    fetchesToday,
    dailyFetchLimit: DAILY_FETCH_LIMIT,
    remainingFetchesToday,
    canFetchToday: remainingFetchesToday > 0,
    todayKey
  };
}

export function getSourceUrl() {
  return process.env.MAKUAKE_COMING_SOON_URL || getMetadata("source_url") || DEFAULT_SOURCE_URL;
}

export function getTokyoDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value ?? "1970";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";

  return `${year}-${month}-${day}`;
}

function getScoutMeta(): ScoutMeta {
  const fetchStatus = getDailyFetchStatus();
  const lastFetchDate = getMetadata("last_fetch_date");

  return {
    sourceUrl: getSourceUrl(),
    lastFetchedAt: getMetadata("last_fetch_at"),
    lastFetchDate,
    canFetchToday: fetchStatus.canFetchToday,
    fetchesToday: fetchStatus.fetchesToday,
    dailyFetchLimit: fetchStatus.dailyFetchLimit,
    remainingFetchesToday: fetchStatus.remainingFetchesToday,
    todayKey: fetchStatus.todayKey,
    nextAllowedAt: fetchStatus.canFetchToday
      ? `今すぐ取得可能（本日残り${fetchStatus.remainingFetchesToday}回）`
      : `${getNextTokyoDateKey()} 00:00 JST`,
    accessPolicy: "Makuakeへのアクセスは1日2回まで。取得結果はSQLiteへキャッシュ保存します。",
    fetchMessage: getMetadata("fetch_message")
  };
}

function getLatestGeneratedShort() {
  const [row] = querySql<GeneratedRow>(
    "SELECT * FROM weekly_content ORDER BY updated_at DESC LIMIT 1;"
  );

  if (!row) {
    return null;
  }

  return parseJson<GeneratedShortPackage | null>(row.generated_json, null);
}

function projectFromRow(row: ProjectRow): MakuakeProject {
  return {
    id: row.id,
    sourceUrl: row.source_url,
    title: row.title,
    description: row.description,
    imageUrl: row.image_url,
    startAt: row.start_at,
    category: row.category,
    keywords: parseJson<string[]>(row.keywords_json, []),
    score: Number(row.score),
    scoreBreakdown: parseJson(row.score_breakdown_json, {
      gadgetKeyword: 0,
      videoHook: 0,
      categoryFit: 0,
      freshness: 0,
      exclusionPenalty: 0
    }),
    fit: parseJson(row.fit_json, {
      blog: 0,
      youtube: 0,
      shorts: 0,
      primary: "ブログ向き"
    }),
    selectionReason: row.selection_reason,
    excludedReason: row.excluded_reason,
    saved: Boolean(row.saved),
    note: row.note,
    userFeedback: isUserFeedback(row.user_feedback) ? row.user_feedback : "",
    learnedBoost: 0,
    learnedReason: "",
    lastSeenAt: row.last_seen_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function rescoreCachedProjects() {
  const rows = querySql<ProjectRow>("SELECT * FROM projects;");

  if (rows.length === 0) {
    return;
  }

  const projects = rows.map((row) => {
    const rescored = normalizeProject({
      sourceUrl: row.source_url,
      title: row.title,
      description: row.description,
      imageUrl: row.image_url,
      startAt: row.start_at
    });

    return {
      ...rescored,
      saved: Boolean(row.saved),
      note: row.note,
      userFeedback: isUserFeedback(row.user_feedback) ? row.user_feedback : "",
      createdAt: row.created_at,
      lastSeenAt: row.last_seen_at
    };
  });

  upsertProjects(projects);
}

function purgeInvalidProjects() {
  const [{ count = 0 } = { count: 0 }] = querySql<CountRow>(`
    SELECT COUNT(*) AS count
    FROM projects
    WHERE title = 'もうすぐ開始'
      OR title LIKE 'ホーム%'
      OR description LIKE 'ホームもうすぐ開始 表示設定%';
  `);

  if (Number(count) === 0) {
    return 0;
  }

  executeSql(`
    DELETE FROM projects
    WHERE title = 'もうすぐ開始'
      OR title LIKE 'ホーム%'
      OR description LIKE 'ホームもうすぐ開始 表示設定%';
  `);

  return Number(count);
}

function purgeSeedProjectsWhenRealDataExists() {
  const [{ count: realCount = 0 } = { count: 0 }] = querySql<CountRow>(`
    SELECT COUNT(*) AS count
    FROM projects
    WHERE source_url NOT LIKE '%/demo-%';
  `);

  if (Number(realCount) === 0) {
    return 0;
  }

  const [{ count: seedCount = 0 } = { count: 0 }] = querySql<CountRow>(`
    SELECT COUNT(*) AS count
    FROM projects
    WHERE source_url LIKE '%/demo-%';
  `);

  if (Number(seedCount) === 0) {
    return 0;
  }

  executeSql("DELETE FROM projects WHERE source_url LIKE '%/demo-%';");

  return Number(seedCount);
}

function ensureColumn(tableName: string, columnName: string, definition: string) {
  const columns = querySql<{ name: string }>(`PRAGMA table_info(${tableName});`);

  if (columns.some((column) => column.name === columnName)) {
    return;
  }

  executeSql(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition};`);
}

function getSelectionExamples(): LearningSignal[] {
  return querySql<SelectionExampleRow>("SELECT * FROM selection_examples;")
    .map((row) => ({
      category: row.category,
      keywords: parseJson<string[]>(row.keywords_json, []),
      userFeedback: (row.feedback === "rejected" ? "rejected" : "selected") as Exclude<
        UserFeedback,
        ""
      >,
      saved: row.feedback === "selected",
      strength: "url" as const
    }))
    .filter((signal) => isProjectCategory(signal.category));
}

function getManualSelectionUrls(): ManualSelectionUrl[] {
  return querySql<SelectionExampleRow>(
    "SELECT * FROM selection_examples WHERE feedback = 'selected' ORDER BY updated_at DESC;"
  )
    .filter((row) => isProjectCategory(row.category))
    .map((row) => ({
      sourceUrl: normalizeProjectUrl(row.url),
      title: row.title || buildUrlSelectionTitle(row.url),
      category: row.category,
      keywords: parseJson<string[]>(row.keywords_json, []),
      feedback: "selected",
      source: row.source,
      updatedAt: row.updated_at
    }));
}

function selectManualTopProjects(projects: MakuakeProject[]) {
  return projects
    .filter((project) => project.userFeedback === "selected")
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
    .slice(0, 5);
}

function applyLearningToProjects(projects: MakuakeProject[], examples: LearningSignal[]) {
  const profile = buildLearningProfile(projects, examples);

  if (profile.feedbackCount === 0) {
    return projects;
  }

  return projects.map((project) => {
    const categoryBoost = profile.categoryWeights.get(project.category) ?? 0;
    const keywordBoost = project.keywords.reduce(
      (total, keyword) => total + (profile.keywordWeights.get(keyword) ?? 0),
      0
    );
    const directBoost =
      project.userFeedback === "selected"
        ? 24
        : project.userFeedback === "rejected"
          ? -48
          : 0;
    const savedBoost = project.saved ? 4 : 0;
    const learnedBoost = clampNumber(
      Math.round(categoryBoost + keywordBoost + directBoost + savedBoost),
      -55,
      42
    );

    if (learnedBoost === 0) {
      return project;
    }

    const nextScore = clampNumber(project.score + learnedBoost, 0, 99);
    const learnedReason = buildLearnedReason(project, categoryBoost, keywordBoost, learnedBoost);
    const nextExcludedReason =
      project.userFeedback === "selected"
        ? ""
        : project.userFeedback === "rejected"
          ? "あなたが除外した候補です。今後の選抜では強く下げます。"
          : project.excludedReason;

    return {
      ...project,
      score: nextScore,
      fit: {
        ...project.fit,
        shorts: clampNumber(project.fit.shorts + Math.round(learnedBoost * 0.35), 0, 99)
      },
      learnedBoost,
      learnedReason,
      excludedReason: nextExcludedReason
    };
  });
}

function buildLearningProfile(projects: MakuakeProject[], examples: LearningSignal[]) {
  const categoryWeights = new Map<MakuakeProject["category"], number>();
  const keywordWeights = new Map<string, number>();
  let feedbackCount = 0;
  const signals: LearningSignal[] = [
    ...projects
      .filter((project) => project.userFeedback === "selected" || project.userFeedback === "rejected")
      .map((project) => ({
        category: project.category,
        keywords: project.keywords,
        userFeedback: project.userFeedback as Exclude<UserFeedback, "">,
        saved: project.saved,
        strength: "project" as const
      })),
    ...examples
  ];

  for (const signal of signals) {
    feedbackCount += 1;
    const direction = signal.userFeedback === "selected" ? 1 : -1;
    const categoryDelta =
      signal.strength === "project" ? (direction > 0 ? 10 : -13) : direction > 0 ? 3 : -4;
    const keywordDelta =
      signal.strength === "project" ? (direction > 0 ? 5 : -7) : direction > 0 ? 3 : -4;

    categoryWeights.set(
      signal.category,
      (categoryWeights.get(signal.category) ?? 0) + categoryDelta
    );

    for (const keyword of signal.keywords) {
      keywordWeights.set(keyword, (keywordWeights.get(keyword) ?? 0) + keywordDelta);
    }
  }

  return {
    categoryWeights,
    keywordWeights,
    feedbackCount
  };
}

function buildLearnedReason(
  project: MakuakeProject,
  categoryBoost: number,
  keywordBoost: number,
  learnedBoost: number
) {
  const direction = learnedBoost > 0 ? "採用傾向" : "除外傾向";
  const matchedKeywords = project.keywords.slice(0, 3).join("・");
  const pieces: string[] = [];

  if (categoryBoost !== 0 || keywordBoost !== 0) {
    pieces.push(`${direction}: ${project.category}`);
  }

  if (matchedKeywords && keywordBoost !== 0) {
    pieces.push(matchedKeywords);
  }

  if (pieces.length === 0) {
    if (project.userFeedback === "selected") {
      pieces.push("この候補を採用済み");
    } else if (project.userFeedback === "rejected") {
      pieces.push("この候補を除外済み");
    } else if (project.saved) {
      pieces.push("保存済み候補");
    }
  }

  return `${pieces.join(" / ")}（${learnedBoost > 0 ? "+" : ""}${learnedBoost}）`;
}

function isUserFeedback(value: string): value is UserFeedback {
  return value === "selected" || value === "rejected" || value === "";
}

function buildSelectionExampleFromUrl(url: string) {
  const slug = getProjectSlug(url);
  const normalizedSlug = slug.toLowerCase();
  const keywords = new Set<string>();
  let category: MakuakeProject["category"] = "ガジェット";

  if (/ai|glass|glasses|view|wear/.test(normalizedSlug)) {
    category = "ウェアラブル";
    keywords.add("AI");
    keywords.add("スマート");
    keywords.add("ウェアラブル");
  }

  if (/smart|made|home|light|lamp/.test(normalizedSlug)) {
    category = "スマートホーム";
    keywords.add("スマート");
    keywords.add("ランプ");
  }

  if (/aqua|marine|water/.test(normalizedSlug)) {
    keywords.add("スマート");
    keywords.add("小型");
  }

  if (/battery|power|charge|(^|[-_])e\d+($|[-_])/.test(normalizedSlug)) {
    keywords.add("充電");
    keywords.add("バッテリー");
  }

  if (keywords.size === 0) {
    keywords.add("ガジェット");
  }

  return {
    category,
    keywords: Array.from(keywords).slice(0, 6)
  };
}

function normalizeProjectUrl(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  try {
    const url = new URL(trimmed);
    const pathParts = url.pathname.split("/").filter(Boolean);

    if (!url.hostname.endsWith("makuake.com") || pathParts[0] !== "project" || !pathParts[1]) {
      return "";
    }

    return `https://www.makuake.com/project/${pathParts[1]}/`;
  } catch {
    return "";
  }
}

function getProjectSlug(url: string) {
  return normalizeProjectUrl(url).split("/").filter(Boolean).pop() ?? "";
}

function buildUrlSelectionTitle(url: string) {
  const slug = getProjectSlug(url);

  if (!slug) {
    return "手動追加したMakuake候補";
  }

  return slug
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.replace(/^\w/, (character) => character.toUpperCase()))
    .join(" ");
}

function isProjectCategory(value: string): value is MakuakeProject["category"] {
  return [
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
  ].includes(value);
}

function clampNumber(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function getNextTokyoDateKey() {
  const now = new Date();
  const next = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  return getTokyoDateKey(next);
}

function executeSql(sql: string) {
  const result = spawnSync("sqlite3", [DATABASE_PATH], {
    input: `${sql}\n`,
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 8
  });

  if (result.status !== 0) {
    throw new Error(result.stderr || "sqlite3 command failed");
  }
}

function querySql<T>(sql: string): T[] {
  const result = spawnSync("sqlite3", ["-json", DATABASE_PATH], {
    input: `${sql}\n`,
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 8
  });

  if (result.status !== 0) {
    throw new Error(result.stderr || "sqlite3 query failed");
  }

  if (!result.stdout.trim()) {
    return [];
  }

  return JSON.parse(result.stdout) as T[];
}

function sqlString(value: string | null | undefined) {
  if (value === null || value === undefined) {
    return "NULL";
  }

  return `'${value.replace(/'/g, "''")}'`;
}

function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
