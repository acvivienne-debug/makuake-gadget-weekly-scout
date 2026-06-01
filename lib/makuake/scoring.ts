import { createHash } from "node:crypto";
import type {
  ContentFit,
  MakuakeProject,
  RawMakuakeProject,
  ScoreBreakdown,
  ScoutCategory
} from "@/lib/makuake/types";

const gadgetKeywords: Array<[string, number]> = [
  ["ガジェット", 18],
  ["AI", 16],
  ["IoT", 15],
  ["スマート", 14],
  ["アプリ", 10],
  ["デバイス", 13],
  ["ワイヤレス", 12],
  ["Bluetooth", 10],
  ["USB", 9],
  ["充電", 12],
  ["バッテリー", 11],
  ["電動", 14],
  ["イヤホン", 15],
  ["ヘッドホン", 13],
  ["スピーカー", 12],
  ["翻訳", 12],
  ["ノイズキャンセリング", 12],
  ["ドック", 14],
  ["キーボード", 12],
  ["マウス", 10],
  ["PC", 10],
  ["モニター", 13],
  ["プロジェクター", 15],
  ["カメラ", 13],
  ["映像共有", 18],
  ["受信機", 8],
  ["端末", 8],
  ["配線", 6],
  ["スタンド", 8],
  ["ウェアラブル", 15],
  ["リング", 10],
  ["センサー", 12],
  ["ロボット", 13],
  ["自動", 8],
  ["LED", 8],
  ["ランプ", 9],
  ["OLED", 11],
  ["防犯", 9],
  ["車載", 10],
  ["家電", 12]
];

const videoHookKeywords: Array<[string, number]> = [
  ["小型", 8],
  ["手のひら", 9],
  ["1秒", 8],
  ["ワンタッチ", 7],
  ["置くだけ", 7],
  ["世界初", 10],
  ["日本初", 9],
  ["リアルタイム", 10],
  ["一台", 6],
  ["1台", 6],
  ["同時", 6],
  ["最大", 5],
  ["不要", 5],
  ["多機能", 8],
  ["変形", 8],
  ["軽量", 7],
  ["高速", 7],
  ["省スペース", 7],
  ["ケーブル", 6],
  ["24時間", 7],
  ["撮影", 7],
  ["健康", 6],
  ["デスク", 8],
  ["旅行", 4],
  ["屋外", 5]
];

const exclusionKeywords: Array<[string, number, ScoutCategory]> = [
  ["食品", 35, "食品"],
  ["フード", 32, "食品"],
  ["スイーツ", 34, "食品"],
  ["肉", 34, "食品"],
  ["魚", 28, "食品"],
  ["米", 28, "食品"],
  ["酒", 35, "食品"],
  ["ワイン", 35, "食品"],
  ["コーヒー", 28, "食品"],
  ["ファッション", 34, "ファッション"],
  ["アパレル", 34, "ファッション"],
  ["服", 28, "ファッション"],
  ["財布", 24, "ファッション"],
  ["バッグ", 24, "ファッション"],
  ["Tシャツ", 34, "ファッション"],
  ["時計", 32, "ファッション"],
  ["メイク", 30, "ファッション"],
  ["傘", 22, "ライフスタイル"],
  ["ポン酢", 36, "食品"],
  ["いちじく", 36, "食品"],
  ["タオル", 26, "ライフスタイル"],
  ["包丁", 24, "ライフスタイル"],
  ["ソファ", 24, "ライフスタイル"],
  ["キャップ", 24, "ファッション"],
  ["革", 18, "ファッション"],
  ["体験", 36, "体験"],
  ["宿泊", 36, "体験"],
  ["旅行プラン", 36, "体験"],
  ["イベント", 30, "体験"],
  ["レストラン", 35, "体験"]
];

const categoryHints: Array<[ScoutCategory, string[]]> = [
  ["スマートホーム", ["スマートホーム", "家電", "防犯", "センサー", "照明", "ロボット", "ランプ"]],
  ["PC周辺機器", ["PC", "USB", "ドック", "キーボード", "マウス", "モニター", "デスク"]],
  ["オーディオ", ["イヤホン", "ヘッドホン", "スピーカー", "オーディオ", "音声", "翻訳"]],
  ["映像機器", ["プロジェクター", "カメラ", "撮影", "映像", "映像共有", "4K", "スクリーン"]],
  ["ウェアラブル", ["ウェアラブル", "リング", "腕時計", "ヘルス", "健康", "睡眠"]],
  ["ガジェット", ["ガジェット", "AI", "IoT", "スマート", "デバイス", "自動", "電動"]]
];

export function normalizeProject(raw: RawMakuakeProject): MakuakeProject {
  const now = new Date().toISOString();
  const sourceUrl = raw.sourceUrl.trim();
  const title = normalizeText(raw.title) || "名称未取得のプロジェクト";
  const description = normalizeText(raw.description ?? "");
  const text = `${title} ${description}`;
  const scoreBreakdown = scoreText(text);
  const category = inferCategory(text, scoreBreakdown);
  const keywords = extractKeywords(text);
  const score = clampScore(
    20 +
      scoreBreakdown.gadgetKeyword +
      scoreBreakdown.videoHook +
      scoreBreakdown.categoryFit +
      scoreBreakdown.freshness -
      scoreBreakdown.exclusionPenalty
  );
  const fit = inferContentFit(score, scoreBreakdown, keywords, text);
  const excludedReason = buildExcludedReason(scoreBreakdown, category, score);

  return {
    id: createProjectId(sourceUrl || title),
    sourceUrl,
    title,
    description,
    imageUrl: raw.imageUrl?.trim() ?? "",
    startAt: normalizeDateLabel(raw.startAt ?? ""),
    category,
    keywords,
    score,
    scoreBreakdown,
    fit,
    selectionReason: buildSelectionReason(title, keywords, scoreBreakdown, fit),
    excludedReason,
    saved: false,
    note: "",
    userFeedback: "",
    learnedBoost: 0,
    learnedReason: "",
    lastSeenAt: now,
    createdAt: now,
    updatedAt: now
  };
}

export function selectWeeklyProjects(projects: MakuakeProject[]) {
  const hardExcludedCategories = new Set<ScoutCategory>(["食品", "ファッション", "体験"]);
  const usable = projects.filter((project) => !hardExcludedCategories.has(project.category));
  const primary = usable.filter((project) => !project.excludedReason || project.score >= 35);
  const fallback = usable.filter((project) => !primary.some((item) => item.id === project.id));
  const lastResort = projects.filter(
    (project) =>
      !primary.some((item) => item.id === project.id) &&
      !fallback.some((item) => item.id === project.id)
  );

  return [...primary, ...fallback, ...lastResort]
    .sort((a, b) => weeklyRankScore(b) - weeklyRankScore(a))
    .slice(0, 5);
}

export function isLikelyVideoProject(project: MakuakeProject) {
  return project.score >= 58 && project.fit.shorts >= 64 && !project.excludedReason;
}

function scoreText(text: string): ScoreBreakdown {
  const gadgetKeyword = sumKeywordScore(text, gadgetKeywords, 46);
  const videoHook = sumKeywordScore(text, videoHookKeywords, 22);
  const exclusionPenalty = sumExclusionPenalty(text);
  const categoryFit = gadgetKeyword >= 26 ? 8 : gadgetKeyword >= 14 ? 5 : 0;
  const freshness = /近日|開始|予定|先行|初公開|新/.test(text) ? 4 : 0;

  return {
    gadgetKeyword,
    videoHook,
    categoryFit,
    freshness,
    exclusionPenalty
  };
}

function sumKeywordScore(
  text: string,
  keywords: Array<[string, number]>,
  max: number
) {
  const normalized = text.toLowerCase();
  const score = keywords.reduce((total, [keyword, weight]) => {
    return containsKeyword(normalized, keyword) ? total + weight : total;
  }, 0);

  return Math.min(score, max);
}

function sumExclusionPenalty(text: string) {
  const normalized = text.toLowerCase();

  return Math.min(
    exclusionKeywords.reduce((total, [keyword, weight]) => {
      return containsKeyword(normalized, keyword) ? total + weight : total;
    }, 0),
    58
  );
}

function inferCategory(text: string, breakdown: ScoreBreakdown): ScoutCategory {
  for (const [category, hints] of categoryHints) {
    if (hints.some((hint) => text.toLowerCase().includes(hint.toLowerCase()))) {
      return category;
    }
  }

  const negativeCategory = exclusionKeywords.find(([keyword]) =>
    text.toLowerCase().includes(keyword.toLowerCase())
  )?.[2];

  if (negativeCategory && breakdown.gadgetKeyword < 16) {
    return negativeCategory;
  }

  if (breakdown.gadgetKeyword >= 18) {
    return "ガジェット";
  }

  return "その他";
}

function extractKeywords(text: string) {
  const matched = [...gadgetKeywords, ...videoHookKeywords]
    .filter(([keyword]) => containsKeyword(text.toLowerCase(), keyword))
    .map(([keyword]) => keyword);
  const unique = Array.from(new Set(matched));

  return unique.slice(0, 8);
}

function inferContentFit(
  score: number,
  breakdown: ScoreBreakdown,
  keywords: string[],
  text: string
): ContentFit {
  const hasSpecs = /バッテリー|USB|PC|4K|防水|時間|軽量|高速|アプリ|AI/.test(text);
  const hasDemo = /プロジェクター|カメラ|イヤホン|翻訳|ロボット|自動|照明|ドック|多機能/.test(
    text
  );
  const blog = clampScore(34 + score * 0.42 + (hasSpecs ? 14 : 4));
  const youtube = clampScore(35 + score * 0.44 + (hasDemo ? 16 : 5));
  const shorts = clampScore(
    32 + score * 0.45 + breakdown.videoHook * 0.55 + (keywords.length >= 3 ? 5 : 0)
  );
  const primary =
    shorts >= youtube && shorts >= blog
      ? "ショート向き"
      : youtube >= blog
        ? "YouTube向き"
        : "ブログ向き";

  return {
    blog,
    youtube,
    shorts,
    primary
  };
}

function buildSelectionReason(
  title: string,
  keywords: string[],
  breakdown: ScoreBreakdown,
  fit: ContentFit
) {
  const reasons = [];

  if (keywords.length > 0) {
    reasons.push(`${keywords.slice(0, 3).join("・")}の訴求が明確`);
  }

  if (breakdown.videoHook >= 12) {
    reasons.push("冒頭3秒で見せやすい変化や用途がある");
  }

  if (fit.shorts >= 82) {
    reasons.push("短尺で悩みから解決までを圧縮しやすい");
  }

  if (reasons.length === 0) {
    reasons.push(`${title}の用途説明を動画化しやすい`);
  }

  return reasons.slice(0, 2).join("。");
}

function buildExcludedReason(
  breakdown: ScoreBreakdown,
  category: ScoutCategory,
  score: number
) {
  if (breakdown.exclusionPenalty >= 30 && score < 62) {
    return `${category}寄りのため、今週のガジェット5選では優先度を下げています`;
  }

  if (score < 35) {
    return "ガジェット要素が弱いため候補外に近いスコアです";
  }

  return "";
}

function weeklyRankScore(project: MakuakeProject) {
  const categoryBonus: Record<ScoutCategory, number> = {
    ガジェット: 28,
    PC周辺機器: 28,
    オーディオ: 26,
    映像機器: 28,
    ウェアラブル: 28,
    スマートホーム: 24,
    ライフスタイル: 5,
    食品: -40,
    ファッション: -34,
    体験: -40,
    その他: 0
  };

  return project.score + categoryBonus[project.category] + project.fit.shorts * 0.18;
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function containsKeyword(normalizedText: string, keyword: string) {
  const normalizedKeyword = keyword.toLowerCase();

  if (keyword === "リング") {
    return /スマートリング|リング型|指輪/.test(normalizedText);
  }

  return normalizedText.includes(normalizedKeyword);
}

function normalizeDateLabel(value: string) {
  const trimmed = normalizeText(value);

  if (!trimmed) {
    return "開始予定日未取得";
  }

  return trimmed;
}

function createProjectId(value: string) {
  return createHash("sha1").update(value).digest("hex").slice(0, 14);
}

function clampScore(value: number) {
  return Math.max(0, Math.min(99, Math.round(value)));
}
