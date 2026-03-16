import { sql } from "@vercel/postgres";
import { Attendee } from "./types";

export async function initDb() {
  await sql`
    CREATE TABLE IF NOT EXISTS attendees (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      pin TEXT NOT NULL CHECK (pin ~ '^[0-9]{4}$'),
      gift_description TEXT,
      budget INT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(name, pin)
    )
  `;
}

export async function findAttendee(
  name: string,
  pin: string
): Promise<Attendee | null> {
  await initDb();
  const { rows } = await sql`
    SELECT * FROM attendees WHERE name = ${name} AND pin = ${pin}
  `;
  return (rows[0] as Attendee) ?? null;
}

export async function createAttendee(
  name: string,
  pin: string
): Promise<Attendee> {
  await initDb();
  const { rows } = await sql`
    INSERT INTO attendees (name, pin) VALUES (${name}, ${pin})
    RETURNING *
  `;
  return rows[0] as Attendee;
}

export async function updateGift(
  id: number,
  giftDescription: string,
  budget: number
): Promise<Attendee> {
  const { rows } = await sql`
    UPDATE attendees
    SET gift_description = ${giftDescription}, budget = ${budget}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return rows[0] as Attendee;
}

export async function getAllSelectedGifts(): Promise<string[]> {
  const { rows } = await sql`
    SELECT gift_description FROM attendees WHERE gift_description IS NOT NULL
  `;
  return rows.map((r) => r.gift_description);
}
