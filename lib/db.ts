import { sql } from "@vercel/postgres";
import { Attendee } from "./types";

export async function initDb() {
  await sql`
    CREATE TABLE IF NOT EXISTS attendees (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      pin TEXT NOT NULL CHECK (pin ~ '^[0-9]{4}$'),
      gift_description TEXT,
      budget INT,
      failed_login_attempts INT DEFAULT 0,
      locked BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Migrate existing tables: add new columns and update constraint
  try {
    await sql`ALTER TABLE attendees ADD COLUMN IF NOT EXISTS failed_login_attempts INT DEFAULT 0`;
    await sql`ALTER TABLE attendees ADD COLUMN IF NOT EXISTS locked BOOLEAN DEFAULT FALSE`;
  } catch {
    // Columns already exist
  }

  // Drop old unique constraint on (name, pin) and add unique on (name) alone
  try {
    await sql`ALTER TABLE attendees DROP CONSTRAINT IF EXISTS attendees_name_pin_key`;
  } catch {
    // Constraint doesn't exist
  }
  try {
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS attendees_name_unique ON attendees (name)`;
  } catch {
    // Index already exists
  }
}

export async function findAttendeeByName(
  name: string
): Promise<Attendee | null> {
  await initDb();
  const { rows } = await sql`
    SELECT * FROM attendees WHERE name = ${name}
  `;
  return (rows[0] as Attendee) ?? null;
}

export async function incrementFailedAttempts(id: number): Promise<void> {
  await sql`
    UPDATE attendees
    SET failed_login_attempts = failed_login_attempts + 1,
        locked = CASE WHEN failed_login_attempts + 1 >= 20 THEN TRUE ELSE locked END
    WHERE id = ${id}
  `;
}

export async function resetFailedAttempts(id: number): Promise<void> {
  await sql`
    UPDATE attendees
    SET failed_login_attempts = 0
    WHERE id = ${id}
  `;
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

export async function updateBudget(
  id: number,
  budget: number
): Promise<Attendee> {
  const { rows } = await sql`
    UPDATE attendees
    SET budget = ${budget}, updated_at = NOW()
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
