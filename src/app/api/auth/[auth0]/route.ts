import { NextRequest, NextResponse } from 'next/server';

// Demo mode when Auth0 is not configured
const isDemoMode = !process.env.AUTH0_SECRET || !process.env.AUTH0_CLIENT_ID;

export async function GET(request: NextRequest, { params }: { params: Promise<{ auth0: string }> }) {
    const { auth0: route } = await params;

    // Demo mode: simulate authentication without Auth0
    if (isDemoMode) {
        if (route === 'login') {
            // Set a demo session cookie and redirect to dashboard
            const response = NextResponse.redirect(new URL('/dashboard', request.url));
            response.cookies.set('demo_session', JSON.stringify({
                user: {
                    sub: 'demo|123456',
                    name: 'Demo User',
                    email: 'demo@echolens.app',
                    picture: null,
                }
            }), {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24, // 24 hours
            });
            return response;
        }

        if (route === 'callback') {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }

        if (route === 'logout') {
            const response = NextResponse.redirect(new URL('/', request.url));
            response.cookies.delete('demo_session');
            return response;
        }

        if (route === 'me') {
            const sessionCookie = request.cookies.get('demo_session');
            if (!sessionCookie) {
                return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
            }
            const session = JSON.parse(sessionCookie.value);
            return NextResponse.json(session.user);
        }

        return NextResponse.json({ error: 'Not found', demo: true }, { status: 404 });
    }

    // Production mode: use Auth0
    try {
        const { Auth0Client } = await import('@auth0/nextjs-auth0/server');

        const auth0 = new Auth0Client({
            domain: process.env.AUTH0_ISSUER_BASE_URL?.replace('https://', '').replace('http://', '') || '',
            clientId: process.env.AUTH0_CLIENT_ID || '',
            clientSecret: process.env.AUTH0_CLIENT_SECRET || '',
            appBaseUrl: process.env.AUTH0_BASE_URL || 'http://localhost:3000',
            secret: process.env.AUTH0_SECRET || '',
        });

        if (route === 'login') {
            return auth0.login(request, {
                returnTo: '/dashboard',
                authorizationParams: {
                    screen_hint: request.nextUrl.searchParams.get('screen_hint') || undefined,
                },
            });
        }

        if (route === 'callback') {
            return auth0.callback(request);
        }

        if (route === 'logout') {
            return auth0.logout(request, {
                returnTo: '/',
            });
        }

        if (route === 'me') {
            const session = await auth0.getSession(request);
            if (!session) {
                return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
            }
            return NextResponse.json(session.user);
        }

        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    } catch (error) {
        console.error('Auth error:', error);
        return NextResponse.json({ error: 'Auth error', message: String(error) }, { status: 500 });
    }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ auth0: string }> }) {
    return GET(request, { params });
}
