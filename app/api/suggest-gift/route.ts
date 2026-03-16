import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAllSelectedGifts } from "@/lib/db";
import { suggestGift } from "@/lib/openai";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const attendeeId = cookieStore.get("attendeeId")?.value;
    if (!attendeeId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { budget, discardedGifts = [] } = await request.json();
    if (!budget || budget <= 0) {
      return NextResponse.json(
        { error: "Presupuesto inválido" },
        { status: 400 }
      );
    }

    const excludedGifts = await getAllSelectedGifts();
    const allExcluded = [...new Set([...excludedGifts, ...discardedGifts])];
    const suggestion = await suggestGift(budget, allExcluded);

    return NextResponse.json({ suggestion });
  } catch (error) {
    console.error("Suggest gift error:", error);
    return NextResponse.json(
      { error: "Error al sugerir regalo" },
      { status: 500 }
    );
  }
}
