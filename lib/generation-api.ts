import type {
  GeneratedContent,
  GenerationIconKey,
  ProjectDetail,
  ShotListItem,
  ThumbnailScene
} from "@/data/mockProjects";

export type GenerationActionRequestId = GenerationIconKey | "all";

export type GeneratedContentPatch = Omit<GeneratedContent, "activeTabId" | "tabs">;

export type GenerateRequestBody = {
  actionId: GenerationActionRequestId;
  project: ProjectDetail;
};

export type GenerateResponseBody = {
  generatedContent: GeneratedContentPatch;
  thumbnailScenes: ThumbnailScene[];
  shotList: ShotListItem[];
  model: string;
};

export type GenerateErrorBody = {
  error: string;
  details?: string;
};

const generationActionRequestIds = new Set<GenerationActionRequestId>([
  "articleOutline",
  "articleBody",
  "specTable",
  "longScript",
  "shortScript",
  "description",
  "pinnedComment",
  "thumbnail",
  "all"
]);

export function isGenerationActionRequestId(
  value: unknown
): value is GenerationActionRequestId {
  return (
    typeof value === "string" &&
    generationActionRequestIds.has(value as GenerationActionRequestId)
  );
}
