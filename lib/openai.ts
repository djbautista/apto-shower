import OpenAI from "openai";
import { GiftSuggestion, GiftValidationResult } from "./types";

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

export async function validateGiftIdea(
  giftIdea: string,
  budgetCOP: number,
  selectedGifts: string[]
): Promise<GiftValidationResult> {
  const selectedList =
    selectedGifts.length > 0
      ? `\nRegalos ya seleccionados por otros invitados:\n- ${selectedGifts.join("\n- ")}`
      : "\nNo hay regalos seleccionados aún.";

  const response = await client.chat.completions.create({
    model: "gpt-5-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `Eres un asistente que valida ideas de regalo para una persona que va a empezar a vivir sola por primera vez en un apartamento nuevo. Responde SIEMPRE en español colombiano.

Tu tarea es determinar si la idea de regalo del usuario entra en CONFLICTO semántico con algún regalo ya seleccionado. Un conflicto ocurre cuando dos regalos son del mismo tipo o categoría específica y tenerlos ambos sería redundante (ej: "utensilios metálicos" vs "utensilios de plástico", "sábanas de algodón" vs "juego de sábanas").

${selectedList}

Responde en formato JSON con estos campos:
- "conflict": boolean — true si hay conflicto con algún regalo existente
- Si conflict es true:
  - "conflictingGift": string — el nombre del regalo existente con el que hay conflicto
  - "alternativeSuggestion": objeto con "regalo", "precioEstimado" (número entero en COP), "descripcion" — una alternativa que NO entre en conflicto, dentro del presupuesto
- Si conflict es false:
  - "validatedGift": objeto con "regalo" (versión pulida del nombre), "precioEstimado" (número entero en COP, dentro del presupuesto), "descripcion" (breve, máximo 2 oraciones, explicando por qué es útil para alguien que empieza a vivir solo)`,
      },
      {
        role: "user",
        content: `Mi idea de regalo es: "${giftIdea}". Mi presupuesto es de ${budgetCOP.toLocaleString("es-CO")} COP.`,
      },
    ],
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error("No response from OpenAI");
  return JSON.parse(content) as GiftValidationResult;
}
