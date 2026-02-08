import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { processTranscript } from '@/services/orchestrator/orchestrator.service';

const OrchestratorRequestSchema = z.object({
  text: z.string().min(1),
  timestamp: z.number(),
  sessionId: z.string().min(1),
  context: z.string().optional(),
});

import { broadcast } from '@/websocket/ws-server';

export async function POST(request: NextRequest) {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/ac977351-bf69-4b6e-87de-26e7b3bdbc59',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'orchestrator/route.ts:14',message:'Orchestrator POST called',data:{},timestamp:Date.now(),runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  let sessionId = '';
  try {
    const body = await request.json();
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/ac977351-bf69-4b6e-87de-26e7b3bdbc59',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'orchestrator/route.ts:18',message:'Request body parsed',data:{hasText:!!body.text,hasSessionId:!!body.sessionId},timestamp:Date.now(),runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    const parsed = OrchestratorRequestSchema.safeParse(body);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/ac977351-bf69-4b6e-87de-26e7b3bdbc59',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'orchestrator/route.ts:19',message:'Schema validation result',data:{success:parsed.success},timestamp:Date.now(),runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.format() },
        { status: 400 }
      );
    }

    sessionId = parsed.data.sessionId;

    // 1. Set status to processing
    broadcast('agent:status', sessionId, {
      agent: 'orchestrator',
      status: 'processing',
    });

    const result = await processTranscript(parsed.data);

    // 2. Set status to complete
    broadcast('agent:status', sessionId, {
      agent: 'orchestrator',
      status: 'complete',
    });

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/ac977351-bf69-4b6e-87de-26e7b3bdbc59',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'orchestrator/route.ts:43',message:'Orchestrator success',data:{hasResult:!!result},timestamp:Date.now(),runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    return NextResponse.json(result);
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/ac977351-bf69-4b6e-87de-26e7b3bdbc59',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'orchestrator/route.ts:45',message:'Orchestrator error',data:{error:String(error),errorName:error instanceof Error?error.name:'unknown'},timestamp:Date.now(),runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    console.error('[Orchestrator] Error:', error);

    if (sessionId) {
      broadcast('agent:status', sessionId, {
        agent: 'orchestrator',
        status: 'error',
      });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
