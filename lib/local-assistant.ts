import {
  type GeneratedContent,
  type GenerationIconKey,
  type GenerationResultId,
  type ProductInfo,
  type ProjectDetail,
  type ProjectStatus,
  type ShotListItem
} from "@/data/mockProjects";
import {
  createMockGenerationPatch,
  generationTargetTabs
} from "@/lib/mock-generation";

export type LocalAssistantResult = {
  project: ProjectDetail;
  reply: string;
  activeTabId?: GenerationResultId;
};

const projectStatuses: ProjectStatus[] = [
  "企画中",
  "撮影前",
  "撮影中",
  "編集中",
  "公開済み"
];

const generationLabels: Record<GenerationIconKey | "all", string> = {
  articleOutline: "記事構成",
  articleBody: "記事本文",
  specTable: "スペック表",
  longScript: "長編台本",
  shortScript: "Shorts台本",
  description: "概要欄",
  pinnedComment: "固定コメント",
  thumbnail: "サムネ・構図案",
  all: "主要コンテンツ一式"
};

export function runLocalAssistantCommand(
  project: ProjectDetail,
  rawMessage: string
): LocalAssistantResult {
  const message = rawMessage.trim();
  const normalized = message.toLowerCase();

  if (!message) {
    return {
      project,
      reply: "入力が空でした。例: 「Shorts台本を作って」「タグに軽量を追加」「メモ: 睡眠訴求を強める」"
    };
  }

  if (matchesAny(normalized, ["help", "ヘルプ", "使い方", "できること"])) {
    return {
      project,
      reply:
        "ローカルチャットでできること:\n・「記事構成を作って」「Shorts台本を作って」「概要欄を短く」\n・「サムネ構図を作って」「撮影カットに外箱アップを追加」\n・「タグに防水, 軽量を追加」「メモ: 競合比較を入れる」\n・「ステータスを撮影前に変更」"
    };
  }

  const status = projectStatuses.find((candidate) => message.includes(candidate));
  if (status && matchesAny(message, ["ステータス", "状態", "進捗"])) {
    return {
      project: {
        ...project,
        status
      },
      reply: `${project.product.name}のステータスを「${status}」に変更しました。`
    };
  }

  if (matchesAny(message, ["タグ"])) {
    const tags = extractTags(message);

    if (tags.length > 0) {
      const nextTags = Array.from(new Set([...project.product.tags, ...tags]));

      return {
        project: {
          ...project,
          product: {
            ...project.product,
            tags: nextTags
          }
        },
        reply: `タグを追加しました: ${tags.join(" / ")}`
      };
    }

    return {
      project,
      reply: `現在のタグは「${project.product.tags.join(" / ")}」です。追加する場合は「タグに〇〇を追加」と送ってください。`
    };
  }

  if (matchesAny(message, ["メモ"])) {
    const memo = extractBodyAfterMarker(message, ["メモ:", "メモ：", "メモ"]);

    if (memo) {
      const nextMemo = project.product.memo
        ? `${project.product.memo}\n${memo}`
        : memo;

      return {
        project: {
          ...project,
          product: {
            ...project.product,
            memo: nextMemo
          }
        },
        reply: "商品メモに追記しました。"
      };
    }
  }

  if (
    matchesAny(message, ["カット", "撮影"]) &&
    matchesAny(message, ["追加", "足して", "入れて"])
  ) {
    const label = extractShotLabel(message, project.product);
    const item: ShotListItem = {
      id: createAssistantId("shot"),
      label,
      checked: false
    };

    return {
      project: {
        ...project,
        shotList: [...project.shotList, item]
      },
      reply: `撮影カットリストに「${label}」を追加しました。`,
      activeTabId: "thumbnailIdeas"
    };
  }

  if (matchesAny(normalized, ["sns", "x投稿", "instagram", "インスタ"])) {
    const patch = createMockGenerationPatch(project, "all");

    return {
      project: {
        ...project,
        generatedContent: {
          ...project.generatedContent,
          snsPosts: patch.generatedContent.snsPosts,
          activeTabId: "snsPost"
        }
      },
      reply: `${project.product.name}向けのSNS投稿案を更新しました。`,
      activeTabId: "snsPost"
    };
  }

  const actionId = detectGenerationAction(message, normalized);

  if (actionId) {
    return applyGenerationAction(project, actionId, message);
  }

  return {
    project,
    reply:
      "このMVPではローカルルールで操作しています。「Shorts台本を作って」「概要欄を生成」「タグに軽量を追加」「撮影カットに装着アップを追加」のように送ってください。"
  };
}

function applyGenerationAction(
  project: ProjectDetail,
  actionId: GenerationIconKey | "all",
  message: string
): LocalAssistantResult {
  const patch = createMockGenerationPatch(project, actionId);
  const targetTabId =
    actionId === "all" ? "thumbnailIdeas" : generationTargetTabs[actionId];
  const generatedContent =
    actionId === "all"
      ? {
          ...patch.generatedContent,
          activeTabId: targetTabId
        }
      : mergeGeneratedContent(
          project.generatedContent,
          patch.generatedContent,
          actionId,
          targetTabId,
          message
        );

  return {
    project: {
      ...project,
      generatedContent,
      thumbnailScenes:
        actionId === "thumbnail" || actionId === "all"
          ? patch.thumbnailScenes ?? project.thumbnailScenes
          : project.thumbnailScenes,
      shotList:
        actionId === "thumbnail" || actionId === "all"
          ? patch.shotList ?? project.shotList
          : project.shotList
    },
    reply: `${project.product.name}の${generationLabels[actionId]}をローカル生成しました。`,
    activeTabId: targetTabId
  };
}

function mergeGeneratedContent(
  currentContent: GeneratedContent,
  generatedContent: GeneratedContent,
  actionId: GenerationIconKey,
  activeTabId: GenerationResultId,
  message: string
): GeneratedContent {
  const nextContent = {
    ...currentContent,
    activeTabId
  };

  switch (actionId) {
    case "articleOutline":
      return { ...nextContent, outline: generatedContent.outline };
    case "articleBody":
      return { ...nextContent, articleBody: generatedContent.articleBody };
    case "specTable":
      return { ...nextContent, specTable: generatedContent.specTable };
    case "longScript":
      return { ...nextContent, longScript: generatedContent.longScript };
    case "shortScript":
      return { ...nextContent, shortScript: generatedContent.shortScript };
    case "description":
      return {
        ...nextContent,
        description: matchesAny(message, ["短く", "短め", "要約"])
          ? shortenDescription(generatedContent.description)
          : generatedContent.description
      };
    case "pinnedComment":
      return { ...nextContent, pinnedComment: generatedContent.pinnedComment };
    case "thumbnail":
      return nextContent;
    default:
      return nextContent;
  }
}

function detectGenerationAction(
  message: string,
  normalized: string
): GenerationIconKey | "all" | null {
  if (matchesAny(message, ["一括", "全部", "すべて", "全て"])) {
    return "all";
  }

  if (matchesAny(message, ["固定コメント"])) {
    return "pinnedComment";
  }

  if (matchesAny(message, ["概要欄", "説明欄", "description"])) {
    return "description";
  }

  if (matchesAny(normalized, ["shorts", "short"]) || matchesAny(message, ["ショート"])) {
    return "shortScript";
  }

  if (matchesAny(message, ["サムネ", "構図", "シーン案", "撮影案"])) {
    return "thumbnail";
  }

  if (matchesAny(message, ["スペック", "仕様表"])) {
    return "specTable";
  }

  if (matchesAny(message, ["長編", "台本"])) {
    return "longScript";
  }

  if (matchesAny(message, ["記事本文", "本文"])) {
    return "articleBody";
  }

  if (matchesAny(message, ["記事構成", "構成案", "構成"])) {
    return "articleOutline";
  }

  return null;
}

function extractTags(message: string) {
  const cleaned = message
    .replace(/タグ/g, " ")
    .replace(/[にをへ]/g, " ")
    .replace(/追加|足して|入れて|登録|してください|して|お願い/g, " ")
    .replace(/[「」『』"']/g, " ");

  return cleaned
    .split(/[、,\s/／]+/)
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0 && tag.length <= 24);
}

function extractBodyAfterMarker(message: string, markers: string[]) {
  const marker = markers.find((candidate) => message.includes(candidate));

  if (!marker) {
    return "";
  }

  return message
    .slice(message.indexOf(marker) + marker.length)
    .replace(/追記|追加|して|ください|お願い/g, " ")
    .trim();
}

function extractShotLabel(message: string, product: ProductInfo) {
  const cleaned = message
    .replace(/撮影カットリスト|カットリスト|撮影カット|カット|撮影/g, " ")
    .replace(/追加|足して|入れて|ください|して|お願い/g, " ")
    .replace(/[にをへ「」『』"']/g, " ")
    .trim();

  return cleaned || `${product.name}の追加カット`;
}

function shortenDescription(description: string) {
  const compact = description
    .split("\n")
    .map((line) => line.replace(/^-\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 4)
    .join(" / ");

  return compact.length > 118 ? `${compact.slice(0, 118)}...` : compact;
}

function matchesAny(value: string, keywords: string[]) {
  return keywords.some((keyword) => value.includes(keyword));
}

function createAssistantId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
