import { NextResponse } from "next/server";
import { createApprovedShort } from "@/lib/makuake/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { approved?: boolean; projectIds?: string[] }
    | null;

  if (!body?.approved) {
    return NextResponse.json(
      { error: "ショート台本を生成する前に、選抜5件を確認して承認してください。" },
      { status: 400 }
    );
  }

  if (!Array.isArray(body.projectIds) || body.projectIds.length === 0) {
    return NextResponse.json(
      { error: "台本生成に使うプロジェクトが選択されていません。" },
      { status: 400 }
    );
  }

  const state = createApprovedShort(body.projectIds.slice(0, 5));

  return NextResponse.json(state);
}
