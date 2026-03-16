import { NextResponse } from "next/server";
import { initDb } from "@/lib/db";
import { sql } from "@vercel/postgres";

const PASSCODE = "Pedro se muda y no precisamente de casa";

export async function GET(request: Request) {
  const auth = request.headers.get("Authorization");
  if (auth !== PASSCODE) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  await initDb();
  const { rows } = await sql`
    SELECT gift_description, budget
    FROM attendees
    WHERE gift_description IS NOT NULL
    ORDER BY gift_description ASC
  `;

  return NextResponse.json({ gifts: rows });
}
