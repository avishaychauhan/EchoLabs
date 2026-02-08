import { NextResponse } from 'next/server';
import { geminiGenerate } from '@/services/gemini/gemini.client';

/**
 * GET /api/health/gemini
 * Verifies GEMINI_API_KEY is set and the Gemini API accepts it.
 */
export async function GET() {
  const hasKey = Boolean(
    process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0
  );
  if (!hasKey) {
    return NextResponse.json(
      { ok: false, error: 'GEMINI_API_KEY is not set in .env' },
      { status: 503 }
    );
  }

  try {
    await geminiGenerate({
      systemPrompt: 'You are a health check. Reply with exactly: OK',
      userPrompt: 'Reply with exactly: OK',
    });
    return NextResponse.json({
      ok: true,
      message: 'Gemini API key is valid',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const is429 =
      message.includes('429') ||
      message.includes('RESOURCE_EXHAUSTED') ||
      message.includes('quota') ||
      message.includes('rate');
    if (is429) {
      return NextResponse.json({
        ok: true,
        rateLimited: true,
        message:
          'Gemini API key is valid but quota exceeded. Check usage at https://ai.google.dev/gemini-api/docs/rate-limits',
      });
    }
    return NextResponse.json(
      { ok: false, error: 'Gemini API request failed', details: message },
      { status: 503 }
    );
  }
}
