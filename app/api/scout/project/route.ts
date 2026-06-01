import { NextResponse } from "next/server";
import { updateProjectNote } from "@/lib/makuake/db";
import type { UserFeedback } from "@/lib/makuake/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { projectId?: string; note?: string; saved?: boolean; userFeedback?: unknown }
    | null;

  if (!body?.projectId || typeof body.saved !== "boolean") {
    return NextResponse.json(
      { error: "保存するプロジェクトIDと保存状態が必要です。" },
      { status: 400 }
    );
  }

  if (body.userFeedback !== undefined && !isUserFeedback(body.userFeedback)) {
    return NextResponse.json(
      { error: "選抜フィードバックの値が不正です。" },
      { status: 400 }
    );
  }

  try {
    const state = updateProjectNote(
      body.projectId,
      body.note ?? "",
      body.saved,
      body.userFeedback
    );

    return NextResponse.json(state);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "プロジェクトメモを保存できませんでした。"
      },
      { status: 500 }
    );
  }
}

function isUserFeedback(value: unknown): value is UserFeedback {
  return value === "selected" || value === "rejected" || value === "";
}
