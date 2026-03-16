import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { updateGift } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const attendeeId = cookieStore.get("attendeeId")?.value;
    if (!attendeeId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { gift, budget } = await request.json();
    if (!gift || !budget) {
      return NextResponse.json(
        { error: "Regalo y presupuesto son requeridos" },
        { status: 400 }
      );
    }

    const attendee = await updateGift(Number(attendeeId), gift, budget);
    return NextResponse.json({ attendee });
  } catch (error) {
    console.error("Update gift error:", error);
    return NextResponse.json(
      { error: "Error al guardar regalo" },
      { status: 500 }
    );
  }
}
