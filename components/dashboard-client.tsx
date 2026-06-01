"use client";

import { useEffect, useMemo, useState } from "react";
import { AiGenerationMenu } from "@/components/ai-generation-menu";
import { LocalAssistantChat } from "@/components/local-assistant-chat";
import { ProjectInfoCard } from "@/components/project-info-card";
import { RightColumn } from "@/components/right-column";
import { Sidebar } from "@/components/sidebar";
import { TopNav } from "@/components/top-nav";
import { WorkspaceTabs } from "@/components/workspace-tabs";
import {
  createInitialChatMessages,
  mockProjects,
  type ChatMessage,
  type ExportOption,
  type GeneratedContent,
  type GenerationIconKey,
  type GenerationResultId,
  type LibraryAsset,
  type ProductInfo,
  type ProjectDetail,
  type ShotListItem,
  type ThumbnailScene
} from "@/data/mockProjects";
import type {
  GenerateErrorBody,
  GenerateResponseBody,
  GenerationActionRequestId
} from "@/lib/generation-api";
import type { VisualPlan, VisualPrompt } from "@/data/mockVisualPlans";
import { buildClipboardText, exportProjectFile } from "@/lib/export-utils";
import { runLocalAssistantCommand } from "@/lib/local-assistant";
import {
  createMockGenerationPatch,
  generationTargetTabs
} from "@/lib/mock-generation";
import { createDummyVisualPrompt } from "@/lib/visual-prompt-generator";

const PROJECT_INFO_STORAGE_KEY = "gadget-content-studio.project-info.v1";

type StoredProjectInfo = {
  version: 1 | 2;
  selectedProjectId?: string;
  products?: Record<string, Partial<ProductInfo>>;
  projects?: ProjectDetail[];
  visualPlans?: VisualPlan[];
  savedAt?: string;
};

function isStoredProjectInfo(value: unknown): value is StoredProjectInfo {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as StoredProjectInfo;

  return candidate.version === 1 || candidate.version === 2;
}

function restoreProjectsFromStorage(stored: StoredProjectInfo) {
  if (stored.version === 2 && Array.isArray(stored.projects)) {
    return stored.projects.map((project) => {
      const product = {
        ...mockProjects[0].product,
        ...(project.product ?? {})
      };
      const generatedContent = {
        ...mockProjects[0].generatedContent,
        ...(project.generatedContent ?? {})
      };

      return {
        ...project,
        product: {
          ...product,
          name: product.name || project.name || mockProjects[0].product.name,
          officialUrl: product.officialUrl ?? "",
          tags: Array.isArray(product.tags) ? product.tags : mockProjects[0].product.tags,
          targetAudience: product.targetAudience ?? "",
          videoTypes: Array.isArray(product.videoTypes)
            ? product.videoTypes
            : mockProjects[0].product.videoTypes,
          selectedVideoType:
            product.selectedVideoType ?? mockProjects[0].product.selectedVideoType,
          memo: product.memo ?? "",
          memoPlaceholder:
            product.memoPlaceholder ?? mockProjects[0].product.memoPlaceholder
        },
        generatedContent: {
          ...generatedContent,
          activeTabId: generatedContent.activeTabId ?? "thumbnailIdeas",
          tabs: mockProjects[0].generatedContent.tabs,
          outline: Array.isArray(generatedContent.outline)
            ? generatedContent.outline
            : mockProjects[0].generatedContent.outline,
          longScript: Array.isArray(generatedContent.longScript)
            ? generatedContent.longScript
            : mockProjects[0].generatedContent.longScript,
          shortScript: Array.isArray(generatedContent.shortScript)
            ? generatedContent.shortScript
            : mockProjects[0].generatedContent.shortScript,
          articleBody: generatedContent.articleBody ?? "",
          specTable: Array.isArray(generatedContent.specTable)
            ? generatedContent.specTable
            : mockProjects[0].generatedContent.specTable,
          description: generatedContent.description ?? "",
          pinnedComment: generatedContent.pinnedComment ?? "",
          snsPosts: Array.isArray(generatedContent.snsPosts)
            ? generatedContent.snsPosts
            : mockProjects[0].generatedContent.snsPosts
        },
        generationActions: mockProjects[0].generationActions,
        exportOptions: mockProjects[0].exportOptions,
        preview: project.preview ?? mockProjects[0].preview,
        assets: Array.isArray(project.assets) ? project.assets : [],
        thumbnailScenes: Array.isArray(project.thumbnailScenes)
          ? project.thumbnailScenes
          : mockProjects[0].thumbnailScenes,
        shotList: Array.isArray(project.shotList)
          ? project.shotList
          : mockProjects[0].shotList,
        status: project.status ?? "企画中",
        chatMessages: Array.isArray(project.chatMessages)
          ? project.chatMessages
          : createInitialChatMessages(product.name ?? project.name)
      };
    });
  }

  return mockProjects.map((project) => {
    const storedProduct = stored.products?.[project.id];

    if (!storedProduct) {
      return project;
    }

    const product = {
      ...project.product,
      ...storedProduct,
      tags: Array.isArray(storedProduct.tags)
        ? storedProduct.tags
        : project.product.tags,
      videoTypes: project.product.videoTypes,
      memoPlaceholder: project.product.memoPlaceholder
    };

    return {
      ...project,
      name: product.name || project.name,
      product
    };
  });
}

function restoreVisualPlansFromStorage(
  stored: StoredProjectInfo,
  fallbackPlans: VisualPlan[]
) {
  if (stored.version === 2 && Array.isArray(stored.visualPlans)) {
    const fallbackById = new Map(fallbackPlans.map((plan) => [plan.id, plan]));

    return stored.visualPlans.map((plan) => {
      const fallbackPlan = fallbackById.get(plan.id) ?? fallbackPlans[0];

      return {
        ...(fallbackPlan ?? plan),
        ...plan,
        tags: Array.isArray(plan.tags) ? plan.tags : fallbackPlan?.tags ?? [],
        prompt: {
          ...(fallbackPlan?.prompt ?? plan.prompt),
          ...plan.prompt,
          styleKeywords: Array.isArray(plan.prompt?.styleKeywords)
            ? plan.prompt.styleKeywords
            : fallbackPlan?.prompt.styleKeywords ?? []
        }
      };
    });
  }

  return fallbackPlans;
}

export function DashboardClient({
  visualPlans = []
}: {
  visualPlans?: VisualPlan[];
}) {
  const [projects, setProjects] = useState<ProjectDetail[]>(mockProjects);
  const [visualPlanState, setVisualPlanState] = useState<VisualPlan[]>(visualPlans);
  const [selectedProjectId, setSelectedProjectId] = useState(mockProjects[0].id);
  const [activeTabId, setActiveTabId] = useState<GenerationResultId>(
    mockProjects[0].generatedContent.activeTabId
  );
  const [isStorageReady, setIsStorageReady] = useState(false);
  const [storageStatus, setStorageStatus] = useState("保存準備中");
  const [generationStatus, setGenerationStatus] = useState(
    "商品情報を編集して生成ボタンを押してください"
  );
  const [exportStatus, setExportStatus] = useState(
    "出力形式を選ぶとファイルを書き出します"
  );
  const [generatingActionId, setGeneratingActionId] =
    useState<GenerationActionRequestId | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? projects[0],
    [projects, selectedProjectId]
  );

  useEffect(() => {
    try {
      const rawStoredValue = window.localStorage.getItem(PROJECT_INFO_STORAGE_KEY);

      if (!rawStoredValue) {
        setStorageStatus("localStorageに自動保存中");
        return;
      }

      const parsedValue: unknown = JSON.parse(rawStoredValue);

      if (!isStoredProjectInfo(parsedValue)) {
        setStorageStatus("保存データを初期化しました");
        return;
      }

      const restoredProjects = restoreProjectsFromStorage(parsedValue);
      const restoredVisualPlans = restoreVisualPlansFromStorage(
        parsedValue,
        visualPlans
      );
      const restoredProjectIds = new Set(restoredProjects.map((project) => project.id));
      const restoredSelectedProjectId =
        parsedValue.selectedProjectId &&
        restoredProjectIds.has(parsedValue.selectedProjectId)
          ? parsedValue.selectedProjectId
          : restoredProjects[0].id;
      const restoredProject =
        restoredProjects.find((project) => project.id === restoredSelectedProjectId) ??
        restoredProjects[0];

      setProjects(restoredProjects);
      setVisualPlanState(restoredVisualPlans);
      setSelectedProjectId(restoredSelectedProjectId);
      setActiveTabId(restoredProject.generatedContent.activeTabId);
      setStorageStatus("localStorageから復元済み");
    } catch {
      setStorageStatus("保存データを読み込めませんでした");
    } finally {
      setIsStorageReady(true);
    }
  }, []);

  useEffect(() => {
    if (!isStorageReady) {
      return;
    }

    const storedProjectInfo: StoredProjectInfo = {
      version: 2,
      selectedProjectId,
      projects,
      visualPlans: visualPlanState,
      savedAt: new Date().toISOString()
    };

    try {
      window.localStorage.setItem(
        PROJECT_INFO_STORAGE_KEY,
        JSON.stringify(storedProjectInfo)
      );
      setStorageStatus("localStorageに自動保存済み");
    } catch {
      setStorageStatus("localStorageへの保存に失敗しました");
    }
  }, [isStorageReady, projects, selectedProjectId, visualPlanState]);

  function handleSelectProject(projectId: string) {
    const nextProject = projects.find((project) => project.id === projectId);

    setSelectedProjectId(projectId);
    setActiveTabId(nextProject?.generatedContent.activeTabId ?? "thumbnailIdeas");
    setGenerationStatus(`${nextProject?.product.name ?? "プロジェクト"}を選択中`);
  }

  function handleCreateProject() {
    const project = createProjectFromTemplate();

    setProjects((currentProjects) => [...currentProjects, project]);
    setSelectedProjectId(project.id);
    setActiveTabId(project.generatedContent.activeTabId);
    setGenerationStatus(`${project.product.name}を作成しました`);
    setExportStatus("新規プロジェクトを作成しました");
  }

  function handleDuplicateProject(projectId: string) {
    const sourceProject = projects.find((project) => project.id === projectId);

    if (!sourceProject) {
      return;
    }

    const duplicatedProject = cloneProject(sourceProject, `${sourceProject.name} コピー`);

    setProjects((currentProjects) => [...currentProjects, duplicatedProject]);
    setSelectedProjectId(duplicatedProject.id);
    setActiveTabId(duplicatedProject.generatedContent.activeTabId);
    setGenerationStatus(`${sourceProject.name}を複製しました`);
    setExportStatus("プロジェクトを複製しました");
  }

  function handleDeleteProject(projectId: string) {
    if (projects.length <= 1) {
      setExportStatus("最後のプロジェクトは削除できません");
      return;
    }

    const targetProject = projects.find((project) => project.id === projectId);

    if (!targetProject) {
      return;
    }

    const confirmed = window.confirm(`${targetProject.name}を削除しますか？`);

    if (!confirmed) {
      return;
    }

    const remainingProjects = projects.filter((project) => project.id !== projectId);
    const nextProject = remainingProjects[0];

    setProjects(remainingProjects);
    setSelectedProjectId(nextProject.id);
    setActiveTabId(nextProject.generatedContent.activeTabId);
    setGenerationStatus(`${targetProject.name}を削除しました`);
    setExportStatus("プロジェクトを削除しました");
  }

  function handleProjectMetaChange(updates: Partial<ProjectDetail>) {
    setProjects((currentProjects) =>
      currentProjects.map((project) =>
        project.id === selectedProjectId ? touchProject({ ...project, ...updates }) : project
      )
    );
  }

  function handleProductChange(updates: Partial<ProductInfo>) {
    setProjects((currentProjects) =>
      currentProjects.map((project) => {
        if (project.id !== selectedProjectId) {
          return project;
        }

        const nextProduct = {
          ...project.product,
          ...updates
        };

        return {
          ...touchProject(project),
          name: nextProduct.name,
          product: nextProduct
        };
      })
    );
  }

  function handleGeneratedContentChange(updates: Partial<GeneratedContent>) {
    setProjects((currentProjects) =>
      currentProjects.map((project) =>
        project.id === selectedProjectId
          ? touchProject({
              ...project,
              generatedContent: {
                ...project.generatedContent,
                ...updates,
                activeTabId
              }
            })
          : project
      )
    );
  }

  function handleThumbnailSceneChange(
    sceneId: string,
    updates: Partial<ThumbnailScene>
  ) {
    setProjects((currentProjects) =>
      currentProjects.map((project) =>
        project.id === selectedProjectId
          ? touchProject({
              ...project,
              thumbnailScenes: project.thumbnailScenes.map((scene) =>
                scene.id === sceneId ? { ...scene, ...updates } : scene
              )
            })
          : project
      )
    );
  }

  function handleShotListChange(itemId: string, updates: Partial<ShotListItem>) {
    setProjects((currentProjects) =>
      currentProjects.map((project) =>
        project.id === selectedProjectId
          ? touchProject({
              ...project,
              shotList: project.shotList.map((item) =>
                item.id === itemId ? { ...item, ...updates } : item
              )
            })
          : project
      )
    );
  }

  function handleVisualPlanChange(planId: string, updates: Partial<VisualPlan>) {
    setVisualPlanState((currentPlans) =>
      currentPlans.map((plan) =>
        plan.id === planId
          ? {
              ...plan,
              ...updates
            }
          : plan
      )
    );
    setGenerationStatus("構図案を更新しました");
  }

  function handleVisualPromptChange(
    planId: string,
    updates: Partial<VisualPrompt>
  ) {
    setVisualPlanState((currentPlans) =>
      currentPlans.map((plan) =>
        plan.id === planId
          ? {
              ...plan,
              prompt: {
                ...plan.prompt,
                ...updates
              }
            }
          : plan
      )
    );
    setGenerationStatus("画像生成用プロンプトを更新しました");
  }

  function handleRegenerateVisualPrompt(planId: string) {
    setVisualPlanState((currentPlans) =>
      currentPlans.map((plan) =>
        plan.id === planId
          ? {
              ...plan,
              prompt: createDummyVisualPrompt(selectedProject.product, plan)
            }
          : plan
      )
    );
    setGenerationStatus(
      `${selectedProject.product.name}の情報から画像生成用プロンプトをダミー再生成しました`
    );
  }

  function handleSendChatMessage(message: string) {
    const result = runLocalAssistantCommand(selectedProject, message);
    const userMessage = createChatMessage("user", message);
    const assistantMessage = createChatMessage("assistant", result.reply);

    setProjects((currentProjects) =>
      currentProjects.map((project) => {
        if (project.id !== selectedProjectId) {
          return project;
        }

        return touchProject({
          ...result.project,
          chatMessages: [
            ...(project.chatMessages?.length
              ? project.chatMessages
              : createInitialChatMessages(project.product.name)),
            userMessage,
            assistantMessage
          ]
        });
      })
    );

    if (result.activeTabId) {
      setActiveTabId(result.activeTabId);
    }

    setGenerationStatus(`チャット操作を反映しました: ${result.reply.split("\n")[0]}`);
  }

  function handleClearChatMessages() {
    setProjects((currentProjects) =>
      currentProjects.map((project) =>
        project.id === selectedProjectId
          ? touchProject({
              ...project,
              chatMessages: createInitialChatMessages(project.product.name)
            })
          : project
      )
    );
    setGenerationStatus("チャット履歴を初期化しました");
  }

  async function handleCopyShotList() {
    try {
      await navigator.clipboard.writeText(buildClipboardText(selectedProject));
      setExportStatus("撮影カットリストをコピーしました");
    } catch {
      setExportStatus("クリップボードへコピーできませんでした");
    }
  }

  function handleAddAssets(files: File[]) {
    const assets = files.map(fileToAsset);

    setProjects((currentProjects) =>
      currentProjects.map((project) =>
        project.id === selectedProjectId
          ? touchProject({
              ...project,
              assets: [...assets, ...project.assets]
            })
          : project
      )
    );
    setExportStatus(`${assets.length}件の素材を追加しました`);
  }

  function handleExport(option: ExportOption) {
    try {
      const message = exportProjectFile(selectedProject, option);
      setExportStatus(message);
    } catch {
      setExportStatus("ファイルを書き出せませんでした");
    }
  }

  async function handleGenerate(actionId: GenerationIconKey | "all") {
    const targetTabId =
      actionId === "all" ? "thumbnailIdeas" : generationTargetTabs[actionId];
    const actionLabel =
      actionId === "all"
        ? "すべて"
        : selectedProject.generationActions.find((action) => action.id === actionId)
            ?.title ?? "生成";
    const projectForRequest = selectedProject;

    setGeneratingActionId(actionId);
    setGenerationStatus(
      `${projectForRequest.product.name} の「${actionLabel}」をローカル生成中...`
    );

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          actionId,
          project: projectForRequest
        })
      });
      const responseData = (await response.json().catch(() => null)) as
        | GenerateResponseBody
        | GenerateErrorBody
        | null;

      if (!response.ok || !responseData || "error" in responseData) {
        const errorMessage =
          responseData && "error" in responseData
            ? [responseData.error, responseData.details].filter(Boolean).join(" ")
            : "ローカル生成サーバーから応答を取得できませんでした。";

        throw new Error(errorMessage);
      }

      const shouldUpdateScenes = actionId === "thumbnail" || actionId === "all";

      setProjects((currentProjects) =>
        currentProjects.map((project) => {
          if (project.id !== projectForRequest.id) {
            return project;
          }

          return touchProject({
            ...project,
            generatedContent: {
              ...project.generatedContent,
              ...responseData.generatedContent,
              activeTabId: targetTabId
            },
            thumbnailScenes: shouldUpdateScenes
              ? responseData.thumbnailScenes
              : project.thumbnailScenes,
            shotList: shouldUpdateScenes ? responseData.shotList : project.shotList
          });
        })
      );
      setActiveTabId(targetTabId);
      setGenerationStatus(
        `${projectForRequest.product.name} の「${actionLabel}」をローカル生成しました（${responseData.model}）`
      );
    } catch (error) {
      const fallbackPatch = createMockGenerationPatch(projectForRequest, actionId);

      setProjects((currentProjects) =>
        currentProjects.map((project) => {
          if (project.id !== projectForRequest.id) {
            return project;
          }

          return touchProject({
            ...project,
            generatedContent: {
              ...fallbackPatch.generatedContent,
              activeTabId: targetTabId
            },
            thumbnailScenes: fallbackPatch.thumbnailScenes ?? project.thumbnailScenes,
            shotList: fallbackPatch.shotList ?? project.shotList
          });
        })
      );
      setActiveTabId(targetTabId);
      setGenerationStatus(
        `ローカル生成に失敗したため仮データを表示しています: ${
          error instanceof Error ? error.message : "不明なエラー"
        }`
      );
    } finally {
      setGeneratingActionId(null);
    }
  }

  return (
    <main className="min-h-[100dvh]">
      <div className="lg:flex">
        <Sidebar
          projects={projects}
          selectedProjectId={selectedProject.id}
          onSelectProject={handleSelectProject}
          onCreateProject={handleCreateProject}
          onDuplicateProject={handleDuplicateProject}
          onDeleteProject={handleDeleteProject}
        />
        <div className="min-w-0 flex-1 px-4 pb-6 md:px-6">
          <TopNav
            isChatOpen={isChatOpen}
            onOpenChat={() => setIsChatOpen(true)}
          />
          <div className="mx-auto grid max-w-[104rem] gap-4 pt-4 xl:grid-cols-[minmax(0,1fr)_23rem]">
            <div className="grid min-w-0 content-start gap-4 self-start">
              <div className="grid gap-4 2xl:grid-cols-[minmax(30rem,0.95fr)_minmax(30rem,1.05fr)]">
                <ProjectInfoCard
                  project={selectedProject}
                  onProductChange={handleProductChange}
                  onProjectMetaChange={handleProjectMetaChange}
                  storageStatus={storageStatus}
                />
                <AiGenerationMenu
                  project={selectedProject}
                  generationStatus={generationStatus}
                  generatingActionId={generatingActionId}
                  onGenerate={handleGenerate}
                />
              </div>
              <WorkspaceTabs
                project={selectedProject}
                visualPlans={visualPlanState}
                activeTabId={activeTabId}
                onTabChange={setActiveTabId}
                onGeneratedContentChange={handleGeneratedContentChange}
                onThumbnailSceneChange={handleThumbnailSceneChange}
                onShotListChange={handleShotListChange}
                onCopyShotList={handleCopyShotList}
                onVisualPlanChange={handleVisualPlanChange}
                onVisualPromptChange={handleVisualPromptChange}
                onRegenerateVisualPrompt={handleRegenerateVisualPrompt}
              />
            </div>
            <RightColumn
              project={selectedProject}
              exportStatus={exportStatus}
              onAddAssets={handleAddAssets}
              onExport={handleExport}
            />
          </div>
        </div>
      </div>
      <LocalAssistantChat
        project={selectedProject}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        onSendMessage={handleSendChatMessage}
        onClearMessages={handleClearChatMessages}
      />
    </main>
  );
}

function createProjectFromTemplate(): ProjectDetail {
  const baseProject = mockProjects[0];
  const id = createId("project");
  const name = "新規ガジェット";

  return {
    ...cloneSerializable(baseProject),
    id,
    name,
    updatedAt: getTodayLabel(),
    isActive: false,
    status: "企画中",
    product: {
      ...baseProject.product,
      name,
      officialUrl: "",
      tags: ["新製品", "レビュー候補", "撮影準備"],
      targetAudience: "この商品のターゲットを入力",
      selectedVideoType: "レビュー",
      memo: ""
    },
    assets: [],
    generatedContent: {
      ...baseProject.generatedContent,
      activeTabId: "thumbnailIdeas"
    },
    chatMessages: createInitialChatMessages(name)
  };
}

function cloneProject(project: ProjectDetail, name: string): ProjectDetail {
  const clonedProject = cloneSerializable(project);

  return {
    ...clonedProject,
    id: createId("project"),
    name,
    updatedAt: getTodayLabel(),
    status: "企画中",
    product: {
      ...clonedProject.product,
      name
    },
    chatMessages: createInitialChatMessages(name)
  };
}

function createChatMessage(role: ChatMessage["role"], content: string): ChatMessage {
  return {
    id: createId("chat"),
    role,
    content,
    createdAt: new Date().toISOString()
  };
}

function cloneSerializable<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function touchProject(project: ProjectDetail): ProjectDetail {
  return {
    ...project,
    updatedAt: getTodayLabel()
  };
}

function getTodayLabel() {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function fileToAsset(file: File): LibraryAsset {
  return {
    id: createId("asset"),
    name: file.name,
    dateLabel: getTodayLabel(),
    type: inferAssetType(file),
    swatch:
      file.type.startsWith("image/") || file.type.startsWith("video/")
        ? { a: "#253144", b: "#0f172a" }
        : undefined
  };
}

function inferAssetType(file: File): LibraryAsset["type"] {
  if (file.type.startsWith("image/")) {
    return "image";
  }

  if (file.type.startsWith("video/")) {
    return "video";
  }

  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    return "pdf";
  }

  return "folder";
}
