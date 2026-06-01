export type VideoType = "レビュー" | "PR" | "比較" | "使い方" | "Shorts";

export type GenerationIconKey =
  | "articleOutline"
  | "articleBody"
  | "specTable"
  | "longScript"
  | "shortScript"
  | "description"
  | "pinnedComment"
  | "thumbnail";

export type AssetType = "image" | "video" | "pdf" | "folder";

export type ProjectStatus = "企画中" | "撮影前" | "撮影中" | "編集中" | "公開済み";

export type ChatRole = "user" | "assistant";

export type GenerationResultId =
  | "outline"
  | "longScript"
  | "shortScript"
  | "articleBody"
  | "specTable"
  | "description"
  | "pinnedComment"
  | "snsPost"
  | "thumbnailIdeas";

export interface ProjectSummary {
  id: string;
  name: string;
  updatedAt: string;
  isActive: boolean;
  thumbnailAccent: string;
  status: ProjectStatus;
}

export interface ProductInfo {
  name: string;
  officialUrl: string;
  tags: string[];
  targetAudience: string;
  videoTypes: VideoType[];
  selectedVideoType: VideoType;
  memo: string;
  memoPlaceholder: string;
}

export interface GenerationAction {
  id: GenerationIconKey;
  title: string;
  description: string;
}

export interface GenerationTab {
  id: GenerationResultId;
  label: string;
}

export interface GeneratedContent {
  activeTabId: GenerationResultId;
  tabs: GenerationTab[];
  outline: string[];
  longScript: string[];
  shortScript: string[];
  articleBody: string;
  specTable: Array<{
    label: string;
    value: string;
  }>;
  description: string;
  pinnedComment: string;
  snsPosts: Array<{
    channel: string;
    body: string;
  }>;
}

export interface ImageGenerationPrompt {
  useCase: "thumbnail" | "scene-reference";
  aspectRatio: "16:9" | "9:16" | "1:1" | "4:5";
  promptJa: string;
  promptEn: string;
  negativePrompt: string;
  styleKeywords: string[];
  notes: string;
}

export interface ThumbnailScene {
  id: string;
  title: string;
  intent: string;
  distance: string;
  background: string;
  lighting: string;
  props: string;
  tags: string[];
  palette: {
    a: string;
    b: string;
    x: string;
    y: string;
  };
  imagePrompt?: ImageGenerationPrompt;
}

export interface ShotListItem {
  id: string;
  label: string;
  checked: boolean;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
}

export interface LibraryAsset {
  id: string;
  name: string;
  dateLabel: string;
  type: AssetType;
  swatch?: {
    a: string;
    b: string;
  };
}

export interface ExportOption {
  id: string;
  label: string;
  kind: "wordpress" | "text" | "subtitle" | "data" | "zip";
}

export interface ProjectDetail extends ProjectSummary {
  product: ProductInfo;
  generationActions: GenerationAction[];
  generatedContent: GeneratedContent;
  thumbnailScenes: ThumbnailScene[];
  shotList: ShotListItem[];
  preview: {
    durationLabel: string;
    thumbnailSwatches: string[];
  };
  assets: LibraryAsset[];
  exportOptions: ExportOption[];
  chatMessages: ChatMessage[];
}

export const mockProjectList: ProjectSummary[] = [
  {
    id: "ringconn-gen-2-air",
    name: "RingConn Gen 2 Air",
    updatedAt: "2024/05/21",
    isActive: true,
    status: "編集中",
    thumbnailAccent: "from-studio-violet/80 to-slate-700"
  },
  {
    id: "oxs-thunder-duo",
    name: "OXS Thunder Duo",
    updatedAt: "2024/05/18",
    isActive: false,
    status: "撮影前",
    thumbnailAccent: "from-cyan-400/70 to-slate-700"
  },
  {
    id: "looi-robot",
    name: "LOOI Robot",
    updatedAt: "2024/05/15",
    isActive: false,
    status: "企画中",
    thumbnailAccent: "from-amber-300/70 to-slate-700"
  },
  {
    id: "soundpeats-h3",
    name: "SOUNDPEATS H3",
    updatedAt: "2024/05/10",
    isActive: false,
    status: "公開済み",
    thumbnailAccent: "from-rose-300/70 to-slate-700"
  }
];

export const templateItems = [
  "レビュー記事テンプレ",
  "YouTube台本テンプレ",
  "Shorts台本テンプレ",
  "LPテンプレート"
];

export function createInitialChatMessages(productName: string): ChatMessage[] {
  return [
    {
      id: "assistant-welcome",
      role: "assistant",
      content: `${productName}の制作アシスタントです。外部AIなしのローカル処理で、構成案、台本、概要欄、構図案、メモ、タグ、撮影カットを整理できます。`,
      createdAt: "2024-05-21T09:00:00.000Z"
    }
  ];
}

export const currentProject: ProjectDetail = {
  ...mockProjectList[0],
  product: {
    name: "RingConn Gen 2 Air",
    officialUrl: "https://ringconn.com/gen2air",
    tags: [
      "睡眠計測",
      "軽量",
      "2.5g",
      "最大12日間バッテリー",
      "防水 IP68",
      "健康管理",
      "アプリ連携"
    ],
    targetAudience: "ガジェット好き / 睡眠改善したい人 / 健康意識が高い人",
    videoTypes: ["レビュー", "PR", "比較", "使い方", "Shorts"],
    selectedVideoType: "レビュー",
    memo: "",
    memoPlaceholder: "この商品の訴求したいポイントやメモを入力..."
  },
  generationActions: [
    {
      id: "articleOutline",
      title: "記事構成を生成",
      description: "ブログ記事の構成案を作成"
    },
    {
      id: "articleBody",
      title: "記事本文を生成",
      description: "SEO記事の本文を生成"
    },
    {
      id: "specTable",
      title: "スペック表を生成",
      description: "比較しやすい表を自動作成"
    },
    {
      id: "longScript",
      title: "長編台本を生成",
      description: "YouTube動画の台本を作成"
    },
    {
      id: "shortScript",
      title: "ショート動画を生成",
      description: "Shorts用台本を複数パターン作成"
    },
    {
      id: "description",
      title: "概要欄を生成",
      description: "YouTube概要欄を作成"
    },
    {
      id: "pinnedComment",
      title: "固定コメントを生成",
      description: "固定コメントを作成"
    },
    {
      id: "thumbnail",
      title: "サムネ構成を生成",
      description: "サムネの構図案を提案"
    }
  ],
  generatedContent: {
    activeTabId: "thumbnailIdeas",
    tabs: [
      { id: "outline", label: "構成案" },
      { id: "longScript", label: "台本（長編）" },
      { id: "shortScript", label: "台本（Shorts）" },
      { id: "articleBody", label: "記事本文" },
      { id: "specTable", label: "スペック表" },
      { id: "description", label: "概要欄" },
      { id: "pinnedComment", label: "固定コメント" },
      { id: "snsPost", label: "SNS投稿" },
      { id: "thumbnailIdeas", label: "サムネ・構図案" }
    ],
    outline: [
      "結論: 睡眠計測を気軽に始めたい人向け",
      "装着感とバッテリーの実用性",
      "アプリ画面で確認すべきポイント",
      "購入前に確認したい注意点"
    ],
    longScript: [
      "冒頭: 指輪型ヘルスケアデバイスの使いやすさを提示",
      "検証: 睡眠、日常、防水、バッテリーを順に確認",
      "まとめ: スマートウォッチが苦手な人への代替案として締める"
    ],
    shortScript: [
      "0-3秒: 指輪なのに睡眠がわかる、というフック",
      "4-10秒: 軽さ、防水、アプリ画面をテンポよく表示",
      "11-15秒: 誰におすすめかを一言で締める"
    ],
    articleBody:
      "RingConn Gen 2 Airは、腕時計をつけたまま寝るのが苦手な人でも試しやすい指輪型の健康管理デバイスです。軽さとバッテリー持ちを軸に、日常利用での負担感を確認します。",
    specTable: [
      { label: "重量", value: "約2.5g" },
      { label: "防水", value: "IP68" },
      { label: "バッテリー", value: "最大12日間" },
      { label: "主な用途", value: "睡眠計測 / 健康管理" }
    ],
    description:
      "RingConn Gen 2 Airを実際の生活シーンでチェック。睡眠計測、装着感、防水、バッテリーを中心にレビューします。",
    pinnedComment:
      "気になる検証項目があればコメントで教えてください。次回の比較動画で取り上げます。",
    snsPosts: [
      {
        channel: "X",
        body: "指輪型デバイスで睡眠計測。腕時計が苦手な人向けにRingConn Gen 2 Airを検証中です。"
      },
      {
        channel: "Instagram",
        body: "軽さ、防水、アプリ連携。日常に溶け込むスマートリングの使い勝手を撮影しました。"
      }
    ]
  },
  thumbnailScenes: [
    {
      id: "sleep-benefit",
      title: "シーン① 睡眠訴求",
      intent: "眠りの質と軽い装着感を一枚で伝える",
      distance: "手元寄りのミドルクローズ",
      background: "濃いブラウンの寝具と木目サイドテーブル",
      lighting: "低めの暖色キーライト、リング縁に細いハイライト",
      props: "枕、布団、スマホ、柔らかい時計表示",
      tags: ["睡眠", "明暗", "リラックス"],
      palette: {
        a: "#35251d",
        b: "#0d111a",
        x: "24%",
        y: "28%"
      }
    },
    {
      id: "daily-use",
      title: "シーン② 日常利用",
      intent: "水回りでも外さなくていい安心感を示す",
      distance: "手首と蛇口を含めた寄り",
      background: "白い洗面台、ステンレス蛇口、水滴",
      lighting: "自然光に近いソフトライト",
      props: "タオル、洗面台、透明な水しぶき",
      tags: ["日常", "防水", "生活感"],
      palette: {
        a: "#b9c4cd",
        b: "#1e3a4c",
        x: "58%",
        y: "18%"
      }
    },
    {
      id: "business-use",
      title: "シーン③ ビジネス利用",
      intent: "スーツやPC作業に馴染む控えめさを見せる",
      distance: "キーボード上の手元アップ",
      background: "ノートPC、黒いデスク、資料",
      lighting: "画面光と斜め上からの細い白色光",
      props: "ノートPC、メモ帳、細身のペン",
      tags: ["ビジネス", "作業", "スマート"],
      palette: {
        a: "#4a433a",
        b: "#111827",
        x: "46%",
        y: "34%"
      }
    },
    {
      id: "active-scene",
      title: "シーン④ アクティブシーン",
      intent: "外出時や運動中の記録用途を想起させる",
      distance: "胸元から手元までの中景",
      background: "ランニングウェア、屋外の抜けた背景",
      lighting: "朝の斜光、輪郭が出るバックライト",
      props: "スポーツウェア、ワイヤレスイヤホン",
      tags: ["外出", "軽量", "アクティブ"],
      palette: {
        a: "#1d3b4b",
        b: "#25212b",
        x: "36%",
        y: "22%"
      }
    },
    {
      id: "size-comparison",
      title: "シーン⑤ サイズ比較",
      intent: "小ささとリングの薄さを直感的に伝える",
      distance: "真上からのフラットレイ",
      background: "マットグレーの天板",
      lighting: "影を薄くした均一なトップライト",
      props: "500円玉、AirPodsケース、定規",
      tags: ["サイズ感", "比較", "ミニマル"],
      palette: {
        a: "#c3c7cc",
        b: "#3a424f",
        x: "72%",
        y: "26%"
      }
    }
  ],
  shotList: [
    { id: "unboxing", label: "開封シーン", checked: true },
    { id: "included-items", label: "内容物の確認", checked: true },
    { id: "wearing", label: "装着シーン", checked: true },
    { id: "front-closeup", label: "正面からのアップ", checked: true },
    { id: "angle-closeup", label: "斜めからのアップ", checked: true },
    { id: "app-operation", label: "アプリ画面の操作", checked: true },
    { id: "battery-charge", label: "バッテリー充電", checked: true },
    { id: "waterproof-test", label: "防水テスト", checked: true },
    { id: "size-comparison", label: "サイズ比較", checked: false },
    { id: "daily-scene", label: "日常シーン", checked: false },
    { id: "outdoor-scene", label: "外出シーン", checked: false }
  ],
  preview: {
    durationLabel: "0:00 / 0:15",
    thumbnailSwatches: [
      "from-slate-700 to-slate-950",
      "from-amber-200/70 to-slate-900",
      "from-studio-violet/60 to-slate-900",
      "from-cyan-200/60 to-slate-950",
      "from-rose-200/60 to-slate-900"
    ]
  },
  assets: [
    {
      id: "img-001",
      name: "IMG_001.jpg",
      dateLabel: "2024/05/20",
      type: "image",
      swatch: { a: "#253144", b: "#0f172a" }
    },
    {
      id: "img-002",
      name: "IMG_002.jpg",
      dateLabel: "2024/05/20",
      type: "image",
      swatch: { a: "#b9aa94", b: "#0f172a" }
    },
    {
      id: "img-003",
      name: "IMG_003.mov",
      dateLabel: "2024/05/20",
      type: "video",
      swatch: { a: "#253144", b: "#475569" }
    },
    {
      id: "spec-sheet",
      name: "spec_sheet.pdf",
      dateLabel: "2024/05/20",
      type: "pdf"
    },
    {
      id: "manual",
      name: "manual.pdf",
      dateLabel: "2024/05/20",
      type: "pdf"
    },
    {
      id: "other-assets",
      name: "other_assets",
      dateLabel: "12個のファイル",
      type: "folder"
    }
  ],
  exportOptions: [
    { id: "wordpress-draft", label: "WordPressに下書き保存", kind: "wordpress" },
    { id: "premiere-captions", label: "Premiere用テロップ.txt", kind: "text" },
    { id: "srt", label: "SRT字幕ファイル出力", kind: "subtitle" },
    { id: "csv", label: "CSV/台本データ出力", kind: "data" },
    { id: "zip", label: "ZIP出力", kind: "zip" }
  ],
  chatMessages: createInitialChatMessages("RingConn Gen 2 Air")
};

function createProjectVariant(
  summary: ProjectSummary,
  product: Partial<ProductInfo>,
  contentPrefix: string
): ProjectDetail {
  return {
    ...currentProject,
    ...summary,
    product: {
      ...currentProject.product,
      name: summary.name,
      ...product
    },
    generatedContent: {
      ...currentProject.generatedContent,
      articleBody: `${summary.name}は、${contentPrefix}を軸にレビューする想定の仮データです。実機検証前のMVPでは、構成や台本の管理フローを確認できるようにしています。`,
      description: `${summary.name}のレビュー用ダミー概要欄です。特徴、撮影ポイント、視聴者への訴求を整理します。`,
      pinnedComment: `${summary.name}で気になる検証項目があればコメントで教えてください。`
    },
    chatMessages: createInitialChatMessages(summary.name)
  };
}

export const mockProjects: ProjectDetail[] = [
  currentProject,
  createProjectVariant(
    mockProjectList[1],
    {
      officialUrl: "https://example.com/oxs-thunder-duo",
      tags: ["デュアルスピーカー", "低遅延", "USB-C", "ゲーム", "映画視聴"],
      targetAudience: "デスク環境を強化したい人 / ゲームや映画をよく見る人",
      selectedVideoType: "比較"
    },
    "音質とデスク設置のしやすさ"
  ),
  createProjectVariant(
    mockProjectList[2],
    {
      officialUrl: "https://example.com/looi-robot",
      tags: ["AIロボット", "スマホ連携", "デスク常駐", "表情", "癒やし"],
      targetAudience: "デスクに置ける相棒ガジェットが欲しい人 / ロボット好き",
      selectedVideoType: "使い方"
    },
    "デスク上での存在感と日常利用"
  ),
  createProjectVariant(
    mockProjectList[3],
    {
      officialUrl: "https://example.com/soundpeats-h3",
      tags: ["ワイヤレスイヤホン", "ANC", "高音質", "通話", "アプリEQ"],
      targetAudience: "コスパ重視のイヤホンを探している人 / 通勤で音楽を聴く人",
      selectedVideoType: "レビュー"
    },
    "音質、ノイズキャンセル、通話品質"
  )
];
