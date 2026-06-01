export type ContentFitLabel = "ブログ向き" | "YouTube向き" | "ショート向き";

export type UserFeedback = "selected" | "rejected" | "";

export type ScoutCategory =
  | "ガジェット"
  | "PC周辺機器"
  | "オーディオ"
  | "映像機器"
  | "ウェアラブル"
  | "スマートホーム"
  | "ライフスタイル"
  | "食品"
  | "ファッション"
  | "体験"
  | "その他";

export type ScoreBreakdown = {
  gadgetKeyword: number;
  videoHook: number;
  categoryFit: number;
  freshness: number;
  exclusionPenalty: number;
};

export type ContentFit = {
  blog: number;
  youtube: number;
  shorts: number;
  primary: ContentFitLabel;
};

export type MakuakeProject = {
  id: string;
  sourceUrl: string;
  title: string;
  description: string;
  imageUrl: string;
  startAt: string;
  category: ScoutCategory;
  keywords: string[];
  score: number;
  scoreBreakdown: ScoreBreakdown;
  fit: ContentFit;
  selectionReason: string;
  excludedReason: string;
  saved: boolean;
  note: string;
  userFeedback: UserFeedback;
  learnedBoost: number;
  learnedReason: string;
  lastSeenAt: string;
  createdAt: string;
  updatedAt: string;
};

export type RawMakuakeProject = {
  sourceUrl: string;
  title: string;
  description?: string;
  imageUrl?: string;
  startAt?: string;
};

export type ScoutMeta = {
  sourceUrl: string;
  lastFetchedAt: string;
  lastFetchDate: string;
  canFetchToday: boolean;
  fetchesToday: number;
  dailyFetchLimit: number;
  remainingFetchesToday: number;
  todayKey: string;
  nextAllowedAt: string;
  accessPolicy: string;
  fetchMessage: string;
};

export type ShortScriptLine = {
  time: string;
  label: string;
  text: string;
};

export type GeneratedShortPackage = {
  weekId: string;
  projectIds: string[];
  createdAt: string;
  approvedAt: string;
  structure: ShortScriptLine[];
  narration: string;
  title: string;
  description: string;
  hashtags: string[];
  xPost: string;
};

export type ManualSelectionUrl = {
  sourceUrl: string;
  title: string;
  category: ScoutCategory;
  keywords: string[];
  feedback: Exclude<UserFeedback, "">;
  source: string;
  updatedAt: string;
};

export type ScoutState = {
  projects: MakuakeProject[];
  weeklyTop: MakuakeProject[];
  manualTop: MakuakeProject[];
  manualSelectionUrls: ManualSelectionUrl[];
  savedProjects: MakuakeProject[];
  generatedShort: GeneratedShortPackage | null;
  meta: ScoutMeta;
};

export type RefreshResult = {
  state: ScoutState;
  refreshed: boolean;
  message: string;
};
