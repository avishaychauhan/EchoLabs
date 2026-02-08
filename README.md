This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Real-time insights (WebSocket)

For live transcription, charts, and AI insights in the presenter view, use **`npm run dev`** (custom server with WebSocket). Do not use `npm run dev:next` or `next dev` alone—those do not start the WebSocket server, so the client cannot connect and you may see `[WS] Connection error` in the console.

When the custom server starts correctly you should see:

```text
> Ready on http://localhost:3000
> WebSocket server initialized on ws://localhost:3000/ws
```

- **Same origin:** If you open the app at `http://localhost:3000`, no extra config is needed; the client connects to `ws://localhost:3000/ws` automatically.
- **Different origin:** If the frontend runs on a different host/port than the server, set `NEXT_PUBLIC_WS_URL` in `.env.local` (e.g. `NEXT_PUBLIC_WS_URL=ws://localhost:3000`). Use `wss://` in production if the site is served over HTTPS.
- **Verify:** Open a presenter page (e.g. `/session/<id>/presenter`); the connection status in the UI and `[WS] Connected` in the console indicate a successful connection.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
