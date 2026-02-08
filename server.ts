import { createServer } from 'http';
import next from 'next';
import { parse } from 'url';
import { unlinkSync, existsSync } from 'fs';
import { join } from 'path';
import { initWebSocketServer } from './src/websocket/ws-server';

// Real-time insights require this custom server. Use: npm run dev (do not use next dev).
const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

async function main() {
    // So npm run dev always works: remove Next dev lock from a previous run (e.g. next dev or crashed process).
    const lockPath = join(process.cwd(), '.next', 'dev', 'lock');
    if (existsSync(lockPath)) {
        try {
            unlinkSync(lockPath);
        } catch {
            // ignore
        }
    }
    const app = next({ dev, hostname, port });
    const handle = app.getRequestHandler();

    await app.prepare();

    const server = createServer((req, res) => {
        const parsedUrl = parse(req.url!, true);
        handle(req, res, parsedUrl);
    });

    // Attach WebSocket server to the same HTTP server (handles Upgrade for /ws).
    // Use this server for dev/prod so WS works; "next dev" alone does not run this server.
    initWebSocketServer(server);

    server.listen(port, () => {
        console.log(`> Ready on http://${hostname}:${port}`);
        console.log(`> WebSocket server initialized on ws://${hostname}:${port}/ws`);
    });
}

main().catch((err) => {
    console.error('Server failed to start:', err);
    process.exit(1);
});
