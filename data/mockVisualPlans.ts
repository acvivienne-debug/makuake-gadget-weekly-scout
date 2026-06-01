export type VisualPromptUseCase = "thumbnail" | "scene-reference";

export type VisualAspectRatio = "16:9" | "9:16" | "1:1" | "4:5";

export interface VisualPrompt {
  useCase: VisualPromptUseCase;
  aspectRatio: VisualAspectRatio;
  promptJa: string;
  promptEn: string;
  negativePrompt: string;
  styleKeywords: string[];
  textOverlay: string;
  generationMemo: string;
}

export interface VisualPlan {
  id: string;
  sceneLabel: string;
  sceneName: string;
  intent: string;
  cameraDistance: string;
  cameraAngle: string;
  composition: string;
  background: string;
  lighting: string;
  props: string;
  shootingMemo: string;
  priority: "高" | "中" | "低";
  tags: string[];
  palette: {
    a: string;
    b: string;
    x: string;
    y: string;
  };
  prompt: VisualPrompt;
}

export const visualPlanMetrics = [
  { label: "構図案", value: "5" },
  { label: "生成用プロンプト", value: "10" },
  { label: "推奨比率", value: "16:9" },
  { label: "画像生成", value: "未接続" }
];

export const mockVisualPlans: VisualPlan[] = [
  {
    id: "sleep-benefit",
    sceneLabel: "シーン01",
    sceneName: "睡眠訴求",
    intent: "眠りの質と軽い装着感を一目で伝える",
    cameraDistance: "手元寄りのミドルクローズ",
    cameraAngle: "ベッド脇から斜め45度、リング面にハイライト",
    composition: "左下に手元、右上に余白。サムネ文字は右側に2行で配置",
    background: "濃いブラウンの寝具、木目サイドテーブル、スマホの睡眠スコア画面",
    lighting: "低めの暖色キーライト、リングの外周だけに細いリムライト",
    props: "枕、布団、スマホ、柔らかい時計表示",
    shootingMemo: "寝具のしわを少し残し、生活感を消しすぎない",
    priority: "高",
    tags: ["睡眠", "明暗", "リラックス"],
    palette: {
      a: "#35251d",
      b: "#0d111a",
      x: "24%",
      y: "28%"
    },
    prompt: {
      useCase: "thumbnail",
      aspectRatio: "16:9",
      promptJa:
        "{productName}を装着した手元のクローズアップ。暗めの寝室、濃いブラウンの寝具、木目サイドテーブル、スマホに睡眠スコアが表示されている。リングの外周に細いハイライト、右側に大きな文字を置ける余白。高級ガジェットレビューのサムネイル、リアルな写真、浅い被写界深度。",
      promptEn:
        "Close-up of a hand wearing {productName}, dark bedroom scene, deep brown bedding, wooden side table, smartphone showing sleep score, thin rim light on the ring edge, clean negative space on the right for large thumbnail text, premium gadget review thumbnail, realistic photography, shallow depth of field.",
      negativePrompt:
        "low quality, blurry, distorted fingers, extra fingers, broken ring shape, messy text, watermark, logo, overexposed, cartoon, anime",
      styleKeywords: ["premium gadget", "dark bedroom", "rim light", "negative space"],
      textOverlay: "睡眠、ここまで見える",
      generationMemo: "文字入れ前提。右側の余白を必ず残す"
    }
  },
  {
    id: "daily-use",
    sceneLabel: "シーン02",
    sceneName: "日常利用",
    intent: "水回りでも外さなくていい安心感を伝える",
    cameraDistance: "手首と蛇口を含めた寄り",
    cameraAngle: "蛇口側からロー気味、手の動きが見える角度",
    composition: "中央に手元、奥に水滴。商品は水しぶきの手前で見せる",
    background: "白い洗面台、ステンレス蛇口、水滴、白いタオル",
    lighting: "自然光に近いソフトライト、反射は控えめ",
    props: "タオル、洗面台、透明な水しぶき",
    shootingMemo: "水滴は細かく、商品が濡れても清潔に見える状態にする",
    priority: "高",
    tags: ["日常", "防水", "生活感"],
    palette: {
      a: "#b9c4cd",
      b: "#1e3a4c",
      x: "58%",
      y: "18%"
    },
    prompt: {
      useCase: "scene-reference",
      aspectRatio: "16:9",
      promptJa:
        "{productName}を装着した手を洗面台で洗っているシーン。白い洗面台、ステンレス蛇口、細かな水滴、清潔なタオル。商品が水回りで使える安心感を伝える、自然光風のソフトライト、リアルな商品レビュー写真。",
      promptEn:
        "A hand wearing {productName} near a bathroom sink, white basin, stainless faucet, fine water droplets, clean towel, showing confidence for everyday water exposure, soft natural light, realistic gadget review photography.",
      negativePrompt:
        "dirty sink, harsh flash, deformed hand, extra fingers, unreadable product, heavy splash covering product, watermark, logo",
      styleKeywords: ["clean bathroom", "water resistant", "daily use", "soft light"],
      textOverlay: "つけたまま生活",
      generationMemo: "防水感を出すが、水しぶきで商品を隠さない"
    }
  },
  {
    id: "business-use",
    sceneLabel: "シーン03",
    sceneName: "ビジネス利用",
    intent: "PC作業や仕事中にも馴染む控えめさを見せる",
    cameraDistance: "キーボード上の手元アップ",
    cameraAngle: "斜め上から35度、リングとキー配列が同時に見える角度",
    composition: "左に手元、右奥にノートPC。手前に余白を残して安定感を出す",
    background: "ノートPC、黒いデスク、資料、細身のペン",
    lighting: "画面光と斜め上からの細い白色光",
    props: "ノートPC、メモ帳、細身のペン、黒いデスクマット",
    shootingMemo: "アクセサリー感を出しすぎず、仕事道具として見せる",
    priority: "中",
    tags: ["ビジネス", "作業", "スマート"],
    palette: {
      a: "#4a433a",
      b: "#111827",
      x: "46%",
      y: "34%"
    },
    prompt: {
      useCase: "thumbnail",
      aspectRatio: "16:9",
      promptJa:
        "{productName}を装着した手がノートPCで作業している。黒いデスク、薄いノートPC、資料、細身のペン。リングは控えめだが視認できる。画面光と白色の細いキーライト、仕事中でも自然に使えるガジェット感、リアルな写真。",
      promptEn:
        "A hand wearing {productName} working on a laptop, black desk, slim laptop, documents and a fine pen, the ring is subtle but visible, screen glow plus narrow white key light, natural business gadget usage, realistic photography.",
      negativePrompt:
        "office stock photo, fake text, distorted keyboard, extra fingers, oversized ring, cluttered desk, watermark",
      styleKeywords: ["desk setup", "business use", "minimal", "screen glow"],
      textOverlay: "仕事中も邪魔しない",
      generationMemo: "リングを大きくしすぎない。自然な装着感を優先"
    }
  },
  {
    id: "active-scene",
    sceneLabel: "シーン04",
    sceneName: "アクティブシーン",
    intent: "外出時や運動中でも軽く使える印象を作る",
    cameraDistance: "胸元から手元までの中景",
    cameraAngle: "屋外で少し低め、手元の動きと背景の抜けを入れる",
    composition: "人物の手元を右寄せ、左側に抜けた背景。動きの余韻を残す",
    background: "ランニングウェア、屋外の抜けた背景、朝の光",
    lighting: "朝の斜光、輪郭が出るバックライト",
    props: "スポーツウェア、ワイヤレスイヤホン、スマホ",
    shootingMemo: "汗や運動感は出しすぎず、軽快さと清潔感を重視",
    priority: "中",
    tags: ["外出", "軽量", "アクティブ"],
    palette: {
      a: "#1d3b4b",
      b: "#25212b",
      x: "36%",
      y: "22%"
    },
    prompt: {
      useCase: "scene-reference",
      aspectRatio: "16:9",
      promptJa:
        "屋外で{productName}を装着した手元。ランニングウェア、ワイヤレスイヤホン、朝の斜光、背景は軽くボケた街並み。外出や軽い運動でも使える印象、清潔感のあるリアルなガジェットレビュー写真。",
      promptEn:
        "Outdoor hand shot wearing {productName}, running wear, wireless earbuds, morning angled sunlight, softly blurred city background, suggesting everyday activity and light exercise, clean realistic gadget review photography.",
      negativePrompt:
        "extreme sports, sweaty messy look, motion blur covering product, deformed fingers, low quality, watermark, logo",
      styleKeywords: ["outdoor", "active", "morning light", "clean motion"],
      textOverlay: "軽い、だから続く",
      generationMemo: "スポーツ広告よりもレビュー素材として自然に"
    }
  },
  {
    id: "size-comparison",
    sceneLabel: "シーン05",
    sceneName: "サイズ比較",
    intent: "小ささ、薄さ、比較対象とのサイズ感を直感的に伝える",
    cameraDistance: "真上からのフラットレイ",
    cameraAngle: "完全俯瞰、歪みを抑えたレンズ",
    composition: "中央に商品、左右に比較対象。下部に文字を置ける余白",
    background: "マットグレーの天板、余計な柄なし",
    lighting: "影を薄くした均一なトップライト",
    props: "500円玉、AirPodsケース、定規、外箱",
    shootingMemo: "比較対象は少なめ。商品が埋もれないよう間隔を広めに取る",
    priority: "高",
    tags: ["サイズ感", "比較", "ミニマル"],
    palette: {
      a: "#c3c7cc",
      b: "#3a424f",
      x: "72%",
      y: "26%"
    },
    prompt: {
      useCase: "thumbnail",
      aspectRatio: "16:9",
      promptJa:
        "{productName}を中央に置いた真上からのフラットレイ。500円玉、AirPodsケース、定規、外箱を比較対象として配置。マットグレーの天板、均一なトップライト、下部にサムネ文字を置ける余白。小ささと薄さが伝わるリアルな商品写真。",
      promptEn:
        "Top-down flat lay with {productName} in the center, 500 yen coin, AirPods case, ruler and product box as size references, matte gray tabletop, even top light, clean bottom space for thumbnail text, realistic product photography showing compact size and thinness.",
      negativePrompt:
        "too many objects, clutter, wrong scale, distorted product, fake coins, unreadable ruler, watermark, logo, low quality",
      styleKeywords: ["flat lay", "size comparison", "minimal", "top light"],
      textOverlay: "この小ささで何ができる？",
      generationMemo: "比較対象を置きすぎず、余白とスケール感を優先"
    }
  }
];
