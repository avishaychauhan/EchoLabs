import { GoogleGenAI } from '@google/genai';

let genaiInstance: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI | null {
  if (!genaiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return null;
    }
    genaiInstance = new GoogleGenAI({ apiKey });
  }
  return genaiInstance;
}

export interface GeminiGenerateOptions {
  model?: string;
  systemPrompt: string;
  userPrompt: string;
  jsonMode?: boolean;
}

export async function geminiGenerate(options: GeminiGenerateOptions): Promise<string> {
  const genai = getGenAI();
  if (!genai) {
    throw new Error(
      '[Gemini] GEMINI_API_KEY is not set. Set it in .env to use real AI responses.'
    );
  }

  const {
    model = 'gemini-2.0-flash',
    systemPrompt,
    userPrompt,
    jsonMode = false,
  } = options;

  const response = await genai.models.generateContent({
    model,
    contents: userPrompt,
    config: {
      systemInstruction: systemPrompt,
      ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error('Gemini returned empty response');
  }
  return text;
}

export function resetGeminiClient(): void {
  genaiInstance = null;
}
