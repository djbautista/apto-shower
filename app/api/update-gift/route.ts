import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { updateGift, updateBudget } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const attendeeId = cookieStore.get("attendeeId")?.value;
    if (!attendeeId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { gift, budget } = await request.json();
    if (!budget) {
      return NextResponse.json(
        { error: "Presupuesto es requerido" },
        { status: 400 }
      );
    }

    const id = Number(attendeeId);
    const attendee = gift
      ? await updateGift(id, gift, budget)
      : await updateBudget(id, budget);
    return NextResponse.json({ attendee });
  } catch (error) {
    console.error("Update gift error:", error);
    return NextResponse.json(
      { error: "Error al guardar regalo" },
      { status: 500 }
    );
  }
}
