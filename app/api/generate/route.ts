import { NextResponse } from "next/server";
import type { ProductInfo, ProjectDetail } from "@/data/mockProjects";
import {
  type GenerateErrorBody,
  type GenerateRequestBody,
  type GenerateResponseBody,
  isGenerationActionRequestId
} from "@/lib/generation-api";
import { createMockGenerationPatch } from "@/lib/mock-generation";

export const runtime = "nodejs";

const LOCAL_GENERATOR_NAME = "codex-local-template-v1";

export async function POST(request: Request) {
  let body: GenerateRequestBody;

  try {
    body = (await request.json()) as GenerateRequestBody;
  } catch {
    return NextResponse.json<GenerateErrorBody>(
      { error: "リクエストJSONを読み込めませんでした。" },
      { status: 400 }
    );
  }

  if (!isGenerationActionRequestId(body.actionId) || !isProjectDetail(body.project)) {
    return NextResponse.json<GenerateErrorBody>(
      { error: "生成リクエストの形式が不正です。" },
      { status: 400 }
    );
  }

  const patch = createMockGenerationPatch(body.project, body.actionId);

  return NextResponse.json<GenerateResponseBody>({
    generatedContent: {
      outline: patch.generatedContent.outline,
      longScript: patch.generatedContent.longScript,
      shortScript: patch.generatedContent.shortScript,
      articleBody: patch.generatedContent.articleBody,
      specTable: patch.generatedContent.specTable,
      description: patch.generatedContent.description,
      pinnedComment: patch.generatedContent.pinnedComment,
      snsPosts: patch.generatedContent.snsPosts
    },
    thumbnailScenes: patch.thumbnailScenes ?? body.project.thumbnailScenes,
    shotList: patch.shotList ?? body.project.shotList,
    model: LOCAL_GENERATOR_NAME
  });
}

function isProjectDetail(value: unknown): value is ProjectDetail {
  if (!value || typeof value !== "object") {
    return false;
  }

  const project = value as ProjectDetail;

  return Boolean(project.id && project.product && isProductInfo(project.product));
}

function isProductInfo(value: unknown): value is ProductInfo {
  if (!value || typeof value !== "object") {
    return false;
  }

  const product = value as ProductInfo;

  return (
    typeof product.name === "string" &&
    typeof product.officialUrl === "string" &&
    Array.isArray(product.tags) &&
    typeof product.targetAudience === "string" &&
    typeof product.selectedVideoType === "string" &&
    typeof product.memo === "string"
  );
}
