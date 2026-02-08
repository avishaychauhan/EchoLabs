import { WebSocketServer, WebSocket } from 'ws';
import type { Server as HttpServer, IncomingMessage } from 'http';
import type { Duplex } from 'stream';
import { serializeWsMessage, createWsMessage, parseWsMessage } from './ws-events';
import type { WsEventType } from '@/types/events';

interface ConnectedClient {
    ws: WebSocket;
    sessionId: string | null;
}

// Use global scope to share WSS and Clients map across API routes and server
const globalForWs = global as unknown as {
    wss: WebSocketServer | null;
    clients: Map<WebSocket, ConnectedClient> | null;
};

let wss: WebSocketServer | null = globalForWs.wss || null;
const clients: Map<WebSocket, ConnectedClient> =
    globalForWs.clients || new Map<WebSocket, ConnectedClient>();

if (!globalForWs.clients) {
    globalForWs.clients = clients;
}

export function initWebSocketServer(server: HttpServer): WebSocketServer {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/ac977351-bf69-4b6e-87de-26e7b3bdbc59',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ws-server.ts:26',message:'initWebSocketServer called',data:{wssExists:!!globalForWs.wss},timestamp:Date.now(),runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    if (globalForWs.wss) {
        wss = globalForWs.wss;
        return wss as WebSocketServer;
    }

    wss = new WebSocketServer({ noServer: true });
    globalForWs.wss = wss;
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/ac977351-bf69-4b6e-87de-26e7b3bdbc59',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ws-server.ts:33',message:'WebSocketServer created',data:{},timestamp:Date.now(),runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    wss.on('connection', (ws: WebSocket) => {
        clients.set(ws, { ws, sessionId: null });

        ws.on('message', (raw: Buffer) => {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/ac977351-bf69-4b6e-87de-26e7b3bdbc59',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ws-server.ts:38',message:'WebSocket message received',data:{rawLength:raw.length},timestamp:Date.now(),runId:'run1',hypothesisId:'E'})}).catch(()=>{});
            // #endregion
            try {
                const msg = parseWsMessage(raw.toString());
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/ac977351-bf69-4b6e-87de-26e7b3bdbc59',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ws-server.ts:40',message:'Message parsed',data:{parsed:!!msg,event:msg?.event},timestamp:Date.now(),runId:'run1',hypothesisId:'E'})}).catch(()=>{});
                // #endregion
                if (!msg) return;

                if (msg.event === 'session:start' && typeof msg.sessionId === 'string') {
                    const client = clients.get(ws);
                    if (client) {
                        client.sessionId = msg.sessionId;
                        // #region agent log
                        fetch('http://127.0.0.1:7242/ingest/ac977351-bf69-4b6e-87de-26e7b3bdbc59',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ws-server.ts:46',message:'Session ID set',data:{sessionId:msg.sessionId},timestamp:Date.now(),runId:'run1',hypothesisId:'E'})}).catch(()=>{});
                        // #endregion
                    }
                }
            } catch (error) {
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/ac977351-bf69-4b6e-87de-26e7b3bdbc59',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ws-server.ts:52',message:'Message parsing error',data:{error:String(error)},timestamp:Date.now(),runId:'run1',hypothesisId:'E'})}).catch(()=>{});
                // #endregion
                console.error('[WS] Message parsing error:', error);
            }
        });

        ws.on('close', () => {
            clients.delete(ws);
        });

        ws.on('error', (err) => {
            console.error('[WS] Client error:', err.message);
            clients.delete(ws);
        });
    });

    // Only handle upgrades for our /ws path; let Next.js handle everything else
    server.on('upgrade', (request: IncomingMessage, socket: Duplex, head: Buffer) => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/ac977351-bf69-4b6e-87de-26e7b3bdbc59',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ws-server.ts:61',message:'WebSocket upgrade request',data:{url:request.url,host:request.headers.host},timestamp:Date.now(),runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        try {
            const { pathname } = new URL(request.url || '', `http://${request.headers.host}`);
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/ac977351-bf69-4b6e-87de-26e7b3bdbc59',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ws-server.ts:64',message:'URL parsed successfully',data:{pathname},timestamp:Date.now(),runId:'run1',hypothesisId:'B'})}).catch(()=>{});
            // #endregion

            if (pathname === '/ws') {
                console.log('[Server] Upgrade request matches /ws, handling upgrade...');
                wss!.handleUpgrade(request, socket, head, (ws) => {
                    // #region agent log
                    fetch('http://127.0.0.1:7242/ingest/ac977351-bf69-4b6e-87de-26e7b3bdbc59',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ws-server.ts:68',message:'WebSocket upgrade successful',data:{readyState:ws.readyState},timestamp:Date.now(),runId:'run1',hypothesisId:'B'})}).catch(()=>{});
                    // #endregion
                    console.log('[Server] WebSocket Upgrade successful for /ws');
                    wss!.emit('connection', ws, request);
                });
            } else {
                console.log(`[Server] Ignoring upgrade for ${pathname} (letting other listeners handle it)`);
            }
        } catch (error) {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/ac977351-bf69-4b6e-87de-26e7b3bdbc59',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ws-server.ts:73',message:'WebSocket upgrade error',data:{error:String(error),url:request.url},timestamp:Date.now(),runId:'run1',hypothesisId:'B'})}).catch(()=>{});
            // #endregion
            console.error('[WS] Upgrade error:', error);
            socket.destroy();
        }
    });

    return wss;
}

export function broadcast<T>(event: WsEventType, sessionId: string, payload: T): void {
    console.log(`[WS] Broadcasting ${event} to session ${sessionId}. WSS exists: ${!!wss}. Clients: ${clients.size}`);
    if (!wss) {
        console.error('[WS] Error: WebSocketServer is not initialized!');
        return;
    }

    const message = serializeWsMessage(createWsMessage(event, sessionId, payload));

    for (const [, client] of clients) {
        if (
            client.ws.readyState === WebSocket.OPEN &&
            (client.sessionId === sessionId || client.sessionId === null)
        ) {
            client.ws.send(message);
        }
    }
}

export function broadcastAll<T>(event: WsEventType, payload: T): void {
    if (!wss) return;

    const message = serializeWsMessage(createWsMessage(event, '', payload));

    for (const [, client] of clients) {
        if (client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(message);
        }
    }
}

export function getConnectedClientCount(): number {
    return clients.size;
}

export function getWebSocketServer(): WebSocketServer | null {
    return wss;
}

export function resetWebSocketServer(): void {
    if (wss) {
        for (const [ws] of clients) {
            ws.close();
        }
        clients.clear();
        wss.close();
        wss = null;
    }
}
