import { NextResponse } from 'next/server';
import { createClient } from '@deepgram/sdk';

export async function GET() {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Deepgram API key not configured' }, { status: 500 });
  }

  // Prefer temporary project key for browser (scoped); fall back to API key for streaming
  try {
    const deepgram = createClient(apiKey);
    const projectId = process.env.DEEPGRAM_PROJECT_ID;
    if (projectId) {
      const { result } = await deepgram.manage.createProjectKey(projectId, {
        comment: 'EchoLens temporary browser token',
        scopes: ['usage:write'],
        time_to_live_in_seconds: 600,
      });
      if (result?.key) {
        return NextResponse.json({
          token: result.key,
          expiresAt: Date.now() + 600000,
        });
      }
    }
  } catch {
    // Ignore; use API key below
  }

  return NextResponse.json({
    token: apiKey,
    expiresAt: Date.now() + 600000,
  });
}
