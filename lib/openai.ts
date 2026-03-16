import OpenAI from "openai";
import { GiftSuggestion } from "./types";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function suggestGift(
  budgetCOP: number,
  excludedGifts: string[]
): Promise<GiftSuggestion> {
  const excludedList =
    excludedGifts.length > 0
      ? `\n\nNO sugieras estos regalos que ya fueron seleccionados por otros invitados:\n- ${excludedGifts.join("\n- ")}\n\nIMPORTANTE: Evita sugerir regalos similares o de la misma categoría que los excluidos. Por ejemplo, si ya existe "utensilios de plástico", NO sugieras "utensilios de metal" ni ningún otro tipo de utensilios. Busca un regalo de una categoría completamente diferente.`
      : "";

  const response = await client.chat.completions.create({
    model: "gpt-5-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `Eres un asistente que sugiere regalos para una persona que va a empezar a vivir sola por primera vez en un apartamento nuevo. Responde SIEMPRE en español colombiano.

Sugiere UN solo regalo específico que esté dentro del presupuesto indicado en pesos colombianos (COP).

Prioriza regalos que den el MAYOR IMPACTO y VALOR PRÁCTICO en el día a día de alguien que empieza a vivir solo. Piensa en lo que más se necesita y más se usa: cosas esenciales que marcan la diferencia entre un espacio funcional y uno incómodo. Prefiere artículos que se usen a diario o que resuelvan necesidades básicas importantes.

Categorías posibles: electrodomésticos, utensilios de cocina, decoración, muebles, ropa de cama, organización del hogar.

Responde en formato JSON con exactamente estos campos:
- "regalo": nombre específico del regalo (ej: "Licuadora Oster de 10 velocidades")
- "precioEstimado": precio estimado en COP (número entero, sin decimales)
- "descripcion": descripción breve de por qué es un regalo de alto impacto para alguien que empieza a vivir solo (máximo 2 oraciones)${excludedList}`,
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
