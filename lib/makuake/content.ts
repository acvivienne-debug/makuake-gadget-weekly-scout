import type {
  GeneratedShortPackage,
  MakuakeProject,
  ShortScriptLine
} from "@/lib/makuake/types";

export function buildShortPackage(
  projects: MakuakeProject[],
  approvedAt = new Date().toISOString()
): GeneratedShortPackage {
  const selected = projects.slice(0, 5);
  const weekId = createWeekId(approvedAt);
  const structure: ShortScriptLine[] = [
    {
      time: "0:00",
      label: "オープニング",
      text: "今週Makuakeで開始予定のガジェットから、ショート向きの5件を紹介します。"
    },
    ...selected.map((project, index) => ({
      time: `0:${String(3 + index * 9).padStart(2, "0")}`,
      label: `${index + 1}つ目`,
      text: `${project.title}。${buildOneLineHook(project)}`
    })),
    {
      time: "0:50",
      label: "まとめ",
      text: "気になるものがあったら、開始予定日とリンクをチェックしておきましょう。"
    }
  ];

  return {
    weekId,
    projectIds: selected.map((project) => project.id),
    createdAt: new Date().toISOString(),
    approvedAt,
    structure,
    narration: buildNarration(selected),
    title: buildShortTitle(selected),
    description: buildDescription(selected),
    hashtags: buildHashtags(selected),
    xPost: buildXPost(selected)
  };
}

function buildNarration(projects: MakuakeProject[]) {
  const lines = [
    "今週Makuakeで開始予定のガジェットから、ショートで見せたい5件を選びました。",
    ...projects.map(
      (project, index) =>
        `${index + 1}つ目は${project.title}。${buildOneLineHook(project)}`
    ),
    "気になるものがあれば、開始予定日とプロジェクトページを確認してみてください。"
  ];

  return lines.join("\n");
}

function buildOneLineHook(project: MakuakeProject) {
  const keyword = project.keywords[0] ?? project.category;
  const secondKeyword = project.keywords[1] ?? "使い勝手";

  if (project.fit.shorts >= 90) {
    return `${keyword}の悩みを、${secondKeyword}で一気に伝えられるのが強みです。`;
  }

  if (project.fit.youtube >= project.fit.blog) {
    return `実際に使う場面を映すと、${keyword}の便利さが伝わりやすい候補です。`;
  }

  return `${keyword}の特徴を、スペックと用途で比較しやすい候補です。`;
}

function buildShortTitle(projects: MakuakeProject[]) {
  const anchor = projects[0]?.keywords[0] ?? "ガジェット";

  return `今週のMakuake注目ガジェット5選｜${anchor}からスマート家電まで`;
}

function buildDescription(projects: MakuakeProject[]) {
  const items = projects
    .map((project, index) => `${index + 1}. ${project.title}（${project.startAt}）`)
    .join("\n");

  return [
    "Makuakeの「もうすぐ開始」から、ショート動画で紹介しやすいガジェット系プロジェクトを5件ピックアップしました。",
    "",
    items,
    "",
    "掲載情報は取得時点のキャッシュをもとにしています。最新情報は各プロジェクトページで確認してください。"
  ].join("\n");
}

function buildHashtags(projects: MakuakeProject[]) {
  const projectKeywords = projects.flatMap((project) => project.keywords.slice(0, 2));
  const tags = [
    "Makuake",
    "ガジェット",
    "クラウドファンディング",
    "ショート動画",
    ...projectKeywords
  ];

  return Array.from(new Set(tags))
    .slice(0, 10)
    .map((tag) => `#${tag.replace(/\s+/g, "")}`);
}

function buildXPost(projects: MakuakeProject[]) {
  const titles = projects
    .map((project, index) => `${index + 1}. ${project.title}`)
    .join("\n");

  return [
    "今週のMakuake注目ガジェット5選の候補を整理しました。",
    titles,
    "短尺で見せやすい順に、用途の分かりやすさとガジェット感で選んでいます。"
  ].join("\n");
}

function createWeekId(isoDate: string) {
  const date = new Date(isoDate);
  const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const day = Math.floor((date.getTime() - start.getTime()) / 86400000) + 1;
  const week = Math.ceil(day / 7);

  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}
