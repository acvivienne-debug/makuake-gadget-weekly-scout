import { NextResponse } from "next/server";
import { importSelectedProjectUrls } from "@/lib/makuake/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { urls?: unknown } | null;

  if (!Array.isArray(body?.urls)) {
    return NextResponse.json(
      { error: "選抜済みURLの配列が必要です。" },
      { status: 400 }
    );
  }

  const urls = body.urls.filter((url): url is string => typeof url === "string");

  try {
    return NextResponse.json(importSelectedProjectUrls(urls));
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "選抜URLを学習データとして保存できませんでした。"
      },
      { status: 500 }
    );
  }
}
