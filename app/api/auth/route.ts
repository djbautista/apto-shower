import { NextResponse } from "next/server";
import {
  findAttendeeByName,
  createAttendee,
  incrementFailedAttempts,
  resetFailedAttempts,
} from "@/lib/db";
import { sql } from "@vercel/postgres";
import { cookies } from "next/headers";
import { Attendee } from "@/lib/types";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const attendeeId = cookieStore.get("attendeeId")?.value;
    if (!attendeeId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const { rows } =
      await sql`SELECT * FROM attendees WHERE id = ${Number(attendeeId)}`;
    if (!rows[0]) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }
    return NextResponse.json({ attendee: rows[0] as Attendee });
  } catch (error) {
    console.error("Auth GET error:", error);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, pin } = await request.json();

    if (!name || !pin || !/^\d{4}$/.test(pin)) {
      return NextResponse.json(
        { error: "Nombre y PIN de 4 dígitos son requeridos" },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();
    const existing = await findAttendeeByName(trimmedName);

    // New user — register
    if (!existing) {
      const attendee = await createAttendee(trimmedName, pin);
      const cookieStore = await cookies();
      cookieStore.set("attendeeId", String(attendee.id), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
      return NextResponse.json({ attendee });
    }

    // Account locked
    if (existing.locked) {
      return NextResponse.json(
        { error: "Cuenta bloqueada. Contacta al administrador." },
        { status: 403 }
      );
    }

    // Wrong PIN
    if (existing.pin !== pin) {
      await incrementFailedAttempts(existing.id);
      const remaining = 20 - (existing.failed_login_attempts + 1);
      const message =
        remaining <= 5 && remaining > 0
          ? `PIN incorrecto. Te quedan ${remaining} intentos antes del bloqueo.`
          : remaining <= 0
            ? "Cuenta bloqueada. Contacta al administrador."
            : "PIN incorrecto";
      const status = remaining <= 0 ? 403 : 401;
      return NextResponse.json({ error: message }, { status });
    }

    // Correct PIN — reset failed attempts and log in
    await resetFailedAttempts(existing.id);
    const cookieStore = await cookies();
    cookieStore.set("attendeeId", String(existing.id), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return NextResponse.json({ attendee: existing });
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json(
      { error: "Error al iniciar sesión" },
      { status: 500 }
    );
  }
}
