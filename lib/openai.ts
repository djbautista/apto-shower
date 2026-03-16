import OpenAI from "openai";
import { GiftSuggestion } from "./types";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function suggestGift(
  budgetCOP: number,
  excludedGifts: string[]
): Promise<GiftSuggestion> {
  const excludedList =
    excludedGifts.length > 0
      ? `\n\nNO sugieras estos regalos que ya fueron seleccionados por otros invitados:\n- ${excludedGifts.join("\n- ")}`
      : "";

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `Eres un asistente que sugiere regalos para un apartamento nuevo. Responde SIEMPRE en español colombiano.

Sugiere UN solo regalo específico para un apartamento nuevo que esté dentro del presupuesto indicado en pesos colombianos (COP).

Categorías posibles: electrodomésticos, utensilios de cocina, decoración, muebles, ropa de cama, organización del hogar.

Responde en formato JSON con exactamente estos campos:
- "regalo": nombre específico del regalo (ej: "Licuadora Oster de 10 velocidades")
- "precioEstimado": precio estimado en COP (número entero, sin decimales)
- "descripcion": descripción breve de por qué es un buen regalo para un apartamento nuevo (máximo 2 oraciones)${excludedList}`,
      },
      {
        role: "user",
        content: `Mi presupuesto es de ${budgetCOP.toLocaleString("es-CO")} COP. Sugiere un regalo.`,
      },
    ],
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error("No response from OpenAI");
  return JSON.parse(content) as GiftSuggestion;
}
