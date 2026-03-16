import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAllSelectedGifts } from "@/lib/db";
import { validateGiftIdea } from "@/lib/openai";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const attendeeId = cookieStore.get("attendeeId")?.value;
    if (!attendeeId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { giftIdea, budget } = await request.json();
    if (!giftIdea || typeof giftIdea !== "string" || !giftIdea.trim()) {
      return NextResponse.json(
        { error: "Idea de regalo inválida" },
        { status: 400 }
      );
    }
    if (!budget || budget <= 0) {
      return NextResponse.json(
        { error: "Presupuesto inválido" },
        { status: 400 }
      );
    }

    const selectedGifts = await getAllSelectedGifts();
    const result = await validateGiftIdea(giftIdea.trim(), budget, selectedGifts);

    return NextResponse.json({ result });
  } catch (error) {
    console.error("Validate gift error:", error);
    return NextResponse.json(
      { error: "Error al validar regalo" },
      { status: 500 }
    );
  }
}
