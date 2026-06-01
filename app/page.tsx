import { MakuakeScoutApp } from "@/components/makuake-scout-app";
import { getScoutState } from "@/lib/makuake/db";

export const dynamic = "force-dynamic";

export default function Home() {
  return <MakuakeScoutApp initialState={getScoutState()} />;
}
