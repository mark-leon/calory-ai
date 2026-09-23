// Gemini vision call via the generateContent REST endpoint.
// The rest of the function only depends on `recognize` and `Recognition`, so
// adding another provider means adding a sibling file with the same export.

export interface CuratedDish {
  id: string;
  en: string;
  bn: string;
  unit_en: string;
}

export interface RecognizedItem {
  food_id: string; // a curated dish id, or "other"
  name_en: string;
  name_bn: string;
  qty: number; // in the curated dish's unit; ignored for "other"
  grams: number; // estimated edible weight; used for "other"
  confidence: number;
}

export interface Recognition {
  is_food: boolean;
  items: RecognizedItem[];
  inputTokens: number | null;
  outputTokens: number | null;
}

const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';

function prompt(dishes: CuratedDish[]): string {
  const list = dishes.map((d) => `${d.id} | ${d.en} | ${d.bn} | per ${d.unit_en}`).join('\n');
  return `You identify food in meal photos from Bangladesh — home cooking, restaurants, street food.

List every distinct food item visible on the plate(s). For each item:
- If it is one of the known dishes below, set food_id to that id and estimate qty in the dish's unit (e.g. 1.5 for one and a half plates of rice, 2 for two pieces of fish). Set grams to your weight estimate too.
- Otherwise set food_id to "other", and estimate grams of the edible portion.
- name_en: a short, generic English name, worded like a food composition table entry when food_id is "other" (e.g. "Chicken curry", "Egg, fried", "Banana, ripe").
- name_bn: the common Bangladeshi name in Bengali script.
- confidence: 0 to 1, how sure you are of the identification.

Be conservative about portions: people eat from standard home plates and bowls. Don't list garnishes, water, or cutlery.
If the photo shows no food, set is_food to false and return no items.

Known dishes (id | English | Bengali | unit):
${list}`;
}

function schema(dishIds: string[]) {
  return {
    type: 'OBJECT',
    properties: {
      is_food: { type: 'BOOLEAN' },
      items: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            food_id: { type: 'STRING', enum: [...dishIds, 'other'] },
            name_en: { type: 'STRING' },
            name_bn: { type: 'STRING' },
            qty: { type: 'NUMBER' },
            grams: { type: 'NUMBER' },
            confidence: { type: 'NUMBER' },
          },
          required: ['food_id', 'name_en', 'name_bn', 'qty', 'grams', 'confidence'],
          propertyOrdering: ['food_id', 'name_en', 'name_bn', 'qty', 'grams', 'confidence'],
        },
      },
    },
    required: ['is_food', 'items'],
    propertyOrdering: ['is_food', 'items'],
  };
}

export async function recognize(opts: {
  apiKey: string;
  model: string;
  thinkingLevel: string | null;
  imageBase64: string;
  mimeType: string;
  dishes: CuratedDish[];
}): Promise<Recognition> {
  const generationConfig: Record<string, unknown> = {
    temperature: 0.2,
    maxOutputTokens: 2048,
    responseMimeType: 'application/json',
    responseSchema: schema(opts.dishes.map((d) => d.id)),
  };
  // Thinking tokens are billed as output; food identification doesn't need much.
  if (opts.thinkingLevel) generationConfig.thinkingConfig = { thinkingLevel: opts.thinkingLevel };

  const res = await fetch(`${ENDPOINT}/${encodeURIComponent(opts.model)}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': opts.apiKey },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { mimeType: opts.mimeType, data: opts.imageBase64 } },
            { text: prompt(opts.dishes) },
          ],
        },
      ],
      generationConfig,
    }),
    signal: AbortSignal.timeout(25_000),
  });

  if (!res.ok) {
    throw new Error(`gemini ${res.status}: ${(await res.text()).slice(0, 500)}`);
  }

  const body = await res.json();
  const candidate = body.candidates?.[0];
  const text: string | undefined = candidate?.content?.parts
    ?.filter((p: { text?: string; thought?: boolean }) => p.text && !p.thought)
    .map((p: { text: string }) => p.text)
    .join('');
  if (!text) {
    throw new Error(`gemini returned no text (finishReason=${candidate?.finishReason ?? body.promptFeedback?.blockReason})`);
  }

  const parsed = JSON.parse(text) as { is_food: boolean; items: RecognizedItem[] };
  const usage = body.usageMetadata ?? {};
  return {
    is_food: parsed.is_food,
    items: parsed.items ?? [],
    inputTokens: usage.promptTokenCount ?? null,
    // thinking tokens are billed at the output rate
    outputTokens: usage.candidatesTokenCount != null ? usage.candidatesTokenCount + (usage.thoughtsTokenCount ?? 0) : null,
  };
}
