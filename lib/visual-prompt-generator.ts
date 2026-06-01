import type { ProductInfo } from "@/data/mockProjects";
import type { VisualPlan, VisualPrompt } from "@/data/mockVisualPlans";

export function createDummyVisualPrompt(
  product: ProductInfo,
  plan: VisualPlan
): VisualPrompt {
  const [primary = plan.sceneName, secondary = "使用感", tertiary = "質感"] =
    product.tags;
  const tagText = product.tags.length > 0 ? product.tags.join("、") : "特徴未入力";
  const target = product.targetAudience || "ターゲット未入力";
  const memo = product.memo.trim();

  return {
    ...plan.prompt,
    promptJa:
      `${product.name}の${plan.sceneName}を表現する${product.selectedVideoType}向けビジュアル。` +
      `${plan.composition}。背景は${plan.background}。照明は${plan.lighting}。` +
      `主な訴求は${primary}、${secondary}、${tertiary}。想定視聴者は${target}。` +
      `${memo ? `メモ: ${memo}。` : ""}` +
      "リアルな商品レビュー写真、サムネイルに使いやすい余白、清潔なガジェット感。",
    promptEn:
      `${product.name} visual concept for a ${product.selectedVideoType} gadget review, scene theme: ${plan.sceneName}. ` +
      `${plan.composition}. Background: ${plan.background}. Lighting: ${plan.lighting}. ` +
      `Key selling points: ${tagText}. Target audience: ${target}. ` +
      "Realistic product review photography, clean gadget aesthetic, practical negative space for thumbnail text.",
    negativePrompt:
      "low quality, blurry, distorted product, deformed hands, extra fingers, wrong scale, messy text, watermark, logo, overexposed, cartoon, anime",
    styleKeywords: Array.from(
      new Set([
        ...plan.prompt.styleKeywords,
        primary,
        product.selectedVideoType,
        "realistic product photo"
      ])
    ).slice(0, 6),
    textOverlay: createTextOverlay(product, plan, primary),
    generationMemo:
      `${product.name}の「${primary}」が最初に伝わるように、${plan.sceneName}の構図を優先。画像生成時は文字入れ用の余白を残す。`
  };
}

function createTextOverlay(
  product: ProductInfo,
  plan: VisualPlan,
  primary: string
) {
  if (plan.id.includes("size")) {
    return `${product.name}、この小ささ`;
  }

  if (plan.id.includes("sleep")) {
    return `${primary}が見える`;
  }

  if (plan.id.includes("daily")) {
    return "つけたまま使える";
  }

  return `${primary}を検証`;
}
