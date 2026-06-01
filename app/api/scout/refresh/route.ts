import { NextResponse } from "next/server";
import { refreshComingSoonProjects } from "@/lib/makuake/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { confirmed?: boolean }
    | null;

  if (!body?.confirmed) {
    return NextResponse.json(
      {
        error:
          "Makuakeへアクセスする前に、1日2回制限とキャッシュ保存を確認してください。"
      },
      { status: 400 }
    );
  }

  const result = await refreshComingSoonProjects();

  return NextResponse.json(result, {
    status: result.refreshed ? 200 : 202
  });
}
