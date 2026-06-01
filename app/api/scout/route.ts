import { NextResponse } from "next/server";
import { getScoutState } from "@/lib/makuake/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(getScoutState());
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Codex App Serverの状態を取得できませんでした。"
      },
      { status: 500 }
    );
  }
}
