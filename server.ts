import { createServer } from 'http';
import next from 'next';
import { parse } from 'url';
import { initWebSocketServer } from './src/websocket/ws-server';

// Real-time insights require this custom server (npm run dev). Do not use next dev alone.
const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

async function main() {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/ac977351-bf69-4b6e-87de-26e7b3bdbc59',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server.ts:10',message:'Server main started',data:{dev,hostname,port},timestamp:Date.now(),runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    const app = next({ dev, hostname, port });
    const handle = app.getRequestHandler();

    await app.prepare();
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/ac977351-bf69-4b6e-87de-26e7b3bdbc59',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server.ts:15',message:'Next.js app prepared',data:{},timestamp:Date.now(),runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    const server = createServer((req, res) => {
        const parsedUrl = parse(req.url!, true);
        handle(req, res, parsedUrl);
    });

    // Attach WebSocket server to the same HTTP server (handles Upgrade for /ws).
    // Use this server for dev/prod so WS works; "next dev" alone does not run this server.
    initWebSocketServer(server);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/ac977351-bf69-4b6e-87de-26e7b3bdbc59',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server.ts:23',message:'WebSocket server initialized',data:{},timestamp:Date.now(),runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    server.listen(port, () => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/ac977351-bf69-4b6e-87de-26e7b3bdbc59',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server.ts:25',message:'Server listening',data:{port},timestamp:Date.now(),runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        console.log(`> Ready on http://${hostname}:${port}`);
        console.log(`> WebSocket server initialized on ws://${hostname}:${port}/ws`);
    });
}

main().catch((err) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/ac977351-bf69-4b6e-87de-26e7b3bdbc59',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server.ts:30',message:'Server startup error',data:{error:String(err),errorName:err instanceof Error?err.name:'unknown'},timestamp:Date.now(),runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    console.error('Server failed to start:', err);
    process.exit(1);
});
