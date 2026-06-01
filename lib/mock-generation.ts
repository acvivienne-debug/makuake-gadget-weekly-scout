import {
  type GeneratedContent,
  type GenerationIconKey,
  type GenerationResultId,
  type ProductInfo,
  type ProjectDetail,
  type ShotListItem,
  type ThumbnailScene
} from "@/data/mockProjects";

export const generationTargetTabs: Record<GenerationIconKey, GenerationResultId> = {
  articleOutline: "outline",
  articleBody: "articleBody",
  specTable: "specTable",
  longScript: "longScript",
  shortScript: "shortScript",
  description: "description",
  pinnedComment: "pinnedComment",
  thumbnail: "thumbnailIdeas"
};

export type GenerationPatch = {
  generatedContent: GeneratedContent;
  thumbnailScenes?: ThumbnailScene[];
  shotList?: ShotListItem[];
};

function pickTags(product: ProductInfo) {
  const [primary = "特徴", secondary = "使いやすさ", tertiary = "実用性"] =
    product.tags;

  return { primary, secondary, tertiary };
}

function productContext(product: ProductInfo) {
  const tags = product.tags.length > 0 ? product.tags.join(" / ") : "特徴未入力";
  const memo = product.memo.trim() || "メモは未入力";

  return {
    tags,
    memo,
    target: product.targetAudience || "ターゲット未入力"
  };
}

function createGeneratedContent(product: ProductInfo): GeneratedContent {
  const { primary, secondary, tertiary } = pickTags(product);
  const context = productContext(product);

  return {
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
      `結論: ${product.name}は「${primary}」を軸に紹介する`,
      `検証ポイント: ${secondary}、${tertiary}、日常利用での違和感`,
      `ターゲット: ${context.target}`,
      `注意点: ${context.memo}を撮影前チェックに反映する`
    ],
    longScript: [
      `0:00 オープニング: ${product.name}を${product.selectedVideoType}企画として紹介`,
      `1:00 外観と装着感: ${context.tags}を順番に見せる`,
      `3:30 実使用テスト: ${context.target}が気にする場面で検証`,
      `7:00 まとめ: ${primary}を重視する人に向くかを判断`
    ],
    shortScript: [
      `0-3秒: 「${product.name}、ここが気になる」でフック`,
      `4-9秒: ${primary}と${secondary}をテンポよく見せる`,
      `10-13秒: ${context.target}向けの一言レビュー`,
      `14-15秒: 詳細レビューへ誘導`
    ],
    articleBody:
      `${product.name}は、${context.target}に向けて「${primary}」をわかりやすく伝えたい商品です。今回の仮生成では、${context.tags}を中心に、実際の撮影で押さえるべき見せ場を整理しています。${context.memo !== "メモは未入力" ? `メモとして「${context.memo}」も反映しています。` : ""}`,
    specTable: [
      { label: "商品名", value: product.name },
      { label: "公式URL", value: product.officialUrl },
      { label: "主な特徴", value: context.tags },
      { label: "想定ターゲット", value: context.target },
      { label: "動画タイプ", value: product.selectedVideoType }
    ],
    description:
      `${product.name}を${product.selectedVideoType}形式でチェックします。\n\n主なポイント:\n${product.tags.map((tag) => `- ${tag}`).join("\n")}\n\n想定視聴者: ${context.target}`,
    pinnedComment:
      `${product.name}で追加検証してほしいポイントはありますか？ ${primary}や${secondary}について、気になるところをコメントで教えてください。`,
    snsPosts: [
      {
        channel: "X",
        body: `${product.name}の${product.selectedVideoType}企画を準備中。注目ポイントは${primary}、${secondary}、${tertiary}。`
      },
      {
        channel: "Instagram",
        body: `${product.name}の撮影カットを整理しました。${context.target}に刺さる見せ方を検証します。`
      }
    ]
  };
}

function createThumbnailScenes(product: ProductInfo): ThumbnailScene[] {
  const { primary, secondary, tertiary } = pickTags(product);

  return [
    {
      id: "generated-hero",
      title: `シーン① ${primary}訴求`,
      intent: `${product.name}の一番強い特徴を1秒で伝える`,
      distance: "商品と手元を大きく見せるクローズアップ",
      background: "暗めのデスクとアクセント光",
      lighting: "商品エッジに細いハイライト",
      props: "スマホ、外箱、比較対象になる小物",
      tags: [primary, "主役", "強調"],
      palette: { a: "#35251d", b: "#0d111a", x: "24%", y: "28%" }
    },
    {
      id: "generated-daily",
      title: `シーン② ${secondary}の実用感`,
      intent: `${secondary}を日常利用の文脈で見せる`,
      distance: "手元と生活背景を含めた中景",
      background: "生活感のある机、キッチン、またはベッドサイド",
      lighting: "自然光に近い柔らかい光",
      props: "ノート、飲み物、スマホ、ケーブル",
      tags: [secondary, "日常", "使用感"],
      palette: { a: "#b9c4cd", b: "#1e3a4c", x: "58%", y: "18%" }
    },
    {
      id: "generated-target",
      title: "シーン③ ターゲット利用",
      intent: `${product.targetAudience}が自分ごと化しやすい構図`,
      distance: "人物の手元と商品が同時に見える距離",
      background: "ターゲットの日常に近い作業環境",
      lighting: "画面光と斜め上からの白色光",
      props: "PC、スマホ、メモ、普段使いの小物",
      tags: ["ターゲット", tertiary, "共感"],
      palette: { a: "#4a433a", b: "#111827", x: "46%", y: "34%" }
    },
    {
      id: "generated-motion",
      title: "シーン④ 使用シーン",
      intent: `${product.selectedVideoType}動画の中で動きが出るカット`,
      distance: "胸元から手元までの中景",
      background: "外出先、デスク、または移動中の背景",
      lighting: "輪郭が出るバックライト",
      props: "バッグ、イヤホン、スマホ",
      tags: ["B-roll", "動き", product.selectedVideoType],
      palette: { a: "#1d3b4b", b: "#25212b", x: "36%", y: "22%" }
    },
    {
      id: "generated-comparison",
      title: "シーン⑤ 比較・まとめ",
      intent: "サイズ感や価値を一目で比較できる構図",
      distance: "真上からのフラットレイ",
      background: "マットグレーの天板",
      lighting: "影を薄くした均一なトップライト",
      props: "競合品、定規、外箱、スマホ",
      tags: ["比較", "まとめ", "判断材料"],
      palette: { a: "#c3c7cc", b: "#3a424f", x: "72%", y: "26%" }
    }
  ];
}

function createShotList(product: ProductInfo): ShotListItem[] {
  const { primary, secondary } = pickTags(product);

  return [
    { id: "opening", label: `${product.name}の外観カット`, checked: true },
    { id: "package", label: "外箱と内容物の確認", checked: true },
    { id: "main-feature", label: `${primary}が伝わるアップ`, checked: true },
    { id: "secondary-feature", label: `${secondary}の使用シーン`, checked: true },
    { id: "app-or-control", label: "アプリ画面・操作画面", checked: true },
    { id: "target-scene", label: "ターゲット利用シーン", checked: true },
    { id: "comparison", label: "サイズ・競合比較", checked: true },
    { id: "battery", label: "充電・バッテリー説明", checked: false },
    { id: "outdoor", label: "外出シーン", checked: false },
    { id: "summary", label: "まとめ用の決めカット", checked: false }
  ];
}

export function createMockGenerationPatch(
  project: ProjectDetail,
  actionId: GenerationIconKey | "all"
): GenerationPatch {
  const generatedContent = createGeneratedContent(project.product);

  if (actionId === "thumbnail" || actionId === "all") {
    return {
      generatedContent,
      thumbnailScenes: createThumbnailScenes(project.product),
      shotList: createShotList(project.product)
    };
  }

  return { generatedContent };
}
