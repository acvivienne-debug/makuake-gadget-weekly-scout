import type { ExportOption, ProjectDetail } from "@/data/mockProjects";

type ExportFile = {
  name: string;
  content: string;
  type: string;
};

const encoder = new TextEncoder();
const crcTable = createCrcTable();

export function exportProjectFile(project: ProjectDetail, option: ExportOption) {
  const baseName = slugify(project.product.name || project.name);

  if (option.kind === "wordpress") {
    downloadBlob(
      `${baseName}-wordpress-draft.html`,
      new Blob([buildWordPressDraft(project)], { type: "text/html;charset=utf-8" })
    );
    return "WordPress下書きHTMLを書き出しました";
  }

  if (option.kind === "text") {
    downloadBlob(
      `${baseName}-premiere-captions.txt`,
      new Blob([buildPremiereCaptions(project)], { type: "text/plain;charset=utf-8" })
    );
    return "Premiere用テロップ.txtを書き出しました";
  }

  if (option.kind === "subtitle") {
    downloadBlob(
      `${baseName}.srt`,
      new Blob([buildSrt(project)], { type: "application/x-subrip;charset=utf-8" })
    );
    return "SRT字幕ファイルを書き出しました";
  }

  if (option.kind === "data") {
    downloadBlob(
      `${baseName}-script-data.csv`,
      new Blob([buildCsv(project)], { type: "text/csv;charset=utf-8" })
    );
    return "CSV/台本データを書き出しました";
  }

  const zipFiles = buildZipFiles(project);
  downloadBlob(`${baseName}-bundle.zip`, createZipBlob(zipFiles));
  return "プロジェクト一式ZIPを書き出しました";
}

export function buildClipboardText(project: ProjectDetail) {
  return [
    `# ${project.product.name}`,
    "",
    "## 撮影カットリスト",
    ...project.shotList.map((item) => `- [${item.checked ? "x" : " "}] ${item.label}`),
    "",
    "## サムネ・構図案",
    ...project.thumbnailScenes.map(
      (scene) =>
        `- ${scene.title}: ${scene.intent} / ${scene.distance} / ${scene.background}`
    )
  ].join("\n");
}

function buildWordPressDraft(project: ProjectDetail) {
  const content = project.generatedContent;

  return [
    "<!doctype html>",
    '<html lang="ja">',
    "<head>",
    '<meta charset="utf-8" />',
    `<title>${escapeHtml(project.product.name)} レビュー下書き</title>`,
    "</head>",
    "<body>",
    `<h1>${escapeHtml(project.product.name)} レビュー</h1>`,
    `<p>${escapeHtml(content.articleBody)}</p>`,
    "<h2>構成案</h2>",
    "<ol>",
    ...content.outline.map((item) => `<li>${escapeHtml(item)}</li>`),
    "</ol>",
    "<h2>スペック表</h2>",
    "<table>",
    ...content.specTable.map(
      (row) =>
        `<tr><th>${escapeHtml(row.label)}</th><td>${escapeHtml(row.value)}</td></tr>`
    ),
    "</table>",
    "<h2>概要欄</h2>",
    `<pre>${escapeHtml(content.description)}</pre>`,
    "</body>",
    "</html>"
  ].join("\n");
}

function buildPremiereCaptions(project: ProjectDetail) {
  const lines = [
    ...project.generatedContent.longScript,
    ...project.generatedContent.shortScript
  ];

  return lines
    .map((line, index) => `${String(index + 1).padStart(2, "0")}\t${line}`)
    .join("\n");
}

function buildSrt(project: ProjectDetail) {
  const lines = project.generatedContent.longScript;

  return lines
    .map((line, index) => {
      const startSeconds = index * 6;
      const endSeconds = startSeconds + 5;

      return [
        String(index + 1),
        `${formatSrtTime(startSeconds)} --> ${formatSrtTime(endSeconds)}`,
        line,
        ""
      ].join("\n");
    })
    .join("\n");
}

function buildCsv(project: ProjectDetail) {
  const rows = [
    ["type", "index", "text"],
    ...project.generatedContent.outline.map((item, index) => [
      "outline",
      String(index + 1),
      item
    ]),
    ...project.generatedContent.longScript.map((item, index) => [
      "longScript",
      String(index + 1),
      item
    ]),
    ...project.generatedContent.shortScript.map((item, index) => [
      "shortScript",
      String(index + 1),
      item
    ]),
    ["description", "1", project.generatedContent.description],
    ["pinnedComment", "1", project.generatedContent.pinnedComment]
  ];

  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}

function buildZipFiles(project: ProjectDetail): ExportFile[] {
  const baseName = slugify(project.product.name || project.name);

  return [
    {
      name: `${baseName}/project.json`,
      content: JSON.stringify(project, null, 2),
      type: "application/json;charset=utf-8"
    },
    {
      name: `${baseName}/article.md`,
      content: [`# ${project.product.name}`, "", project.generatedContent.articleBody].join(
        "\n"
      ),
      type: "text/markdown;charset=utf-8"
    },
    {
      name: `${baseName}/script.txt`,
      content: buildPremiereCaptions(project),
      type: "text/plain;charset=utf-8"
    },
    {
      name: `${baseName}/captions.srt`,
      content: buildSrt(project),
      type: "application/x-subrip;charset=utf-8"
    },
    {
      name: `${baseName}/data.csv`,
      content: buildCsv(project),
      type: "text/csv;charset=utf-8"
    }
  ];
}

function createZipBlob(files: ExportFile[]) {
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;
  const date = new Date();
  const dosTime = toDosTime(date);
  const dosDate = toDosDate(date);

  files.forEach((file) => {
    const nameBytes = encoder.encode(file.name);
    const data = encoder.encode(file.content);
    const crc = crc32(data);
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const localView = new DataView(localHeader.buffer);

    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(6, 0, true);
    localView.setUint16(8, 0, true);
    localView.setUint16(10, dosTime, true);
    localView.setUint16(12, dosDate, true);
    localView.setUint32(14, crc, true);
    localView.setUint32(18, data.length, true);
    localView.setUint32(22, data.length, true);
    localView.setUint16(26, nameBytes.length, true);
    localView.setUint16(28, 0, true);
    localHeader.set(nameBytes, 30);
    localParts.push(localHeader, data);

    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const centralView = new DataView(centralHeader.buffer);

    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(8, 0, true);
    centralView.setUint16(10, 0, true);
    centralView.setUint16(12, dosTime, true);
    centralView.setUint16(14, dosDate, true);
    centralView.setUint32(16, crc, true);
    centralView.setUint32(20, data.length, true);
    centralView.setUint32(24, data.length, true);
    centralView.setUint16(28, nameBytes.length, true);
    centralView.setUint16(30, 0, true);
    centralView.setUint16(32, 0, true);
    centralView.setUint16(34, 0, true);
    centralView.setUint16(36, 0, true);
    centralView.setUint32(38, 0, true);
    centralView.setUint32(42, offset, true);
    centralHeader.set(nameBytes, 46);
    centralParts.push(centralHeader);
    offset += localHeader.length + data.length;
  });

  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const endHeader = new Uint8Array(22);
  const endView = new DataView(endHeader.buffer);

  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, files.length, true);
  endView.setUint16(10, files.length, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, offset, true);

  return new Blob([...localParts, ...centralParts, endHeader].map(toBlobPart), {
    type: "application/zip"
  });
}

function toBlobPart(part: Uint8Array) {
  return part.buffer.slice(
    part.byteOffset,
    part.byteOffset + part.byteLength
  ) as ArrayBuffer;
}

function createCrcTable() {
  return Array.from({ length: 256 }, (_, index) => {
    let c = index;

    for (let bit = 0; bit < 8; bit += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }

    return c >>> 0;
  });
}

function crc32(data: Uint8Array) {
  let crc = 0xffffffff;

  data.forEach((byte) => {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  });

  return (crc ^ 0xffffffff) >>> 0;
}

function toDosTime(date: Date) {
  return (
    (date.getHours() << 11) |
    (date.getMinutes() << 5) |
    Math.floor(date.getSeconds() / 2)
  );
}

function toDosDate(date: Date) {
  return (
    ((date.getFullYear() - 1980) << 9) |
    ((date.getMonth() + 1) << 5) |
    date.getDate()
  );
}

function formatSrtTime(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)},000`;
}

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function csvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function slugify(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\u3040-\u30ff\u3400-\u9fff]+/g, "-")
      .replace(/^-+|-+$/g, "") || "gadget-project"
  );
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
