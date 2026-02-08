import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Plus, LogOut, Settings } from 'lucide-react';

interface User {
    sub: string;
    name: string;
    email: string;
    picture?: string | null;
}

async function getUser(): Promise<User | null> {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('demo_session');

    if (sessionCookie) {
        try {
            const session = JSON.parse(sessionCookie.value);
            return session.user;
        } catch {
            return null;
        }
    }

    return null;
}

export default async function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await getUser();

    if (!user) {
        redirect('/api/auth/login');
    }

    return (
        <div className="min-h-screen flex">
            {/* Sidebar */}
            <aside className="w-64 border-r border-[var(--glass-border)] bg-[var(--bg-secondary)] flex flex-col">
                {/* Logo */}
                <div className="p-6 border-b border-[var(--glass-border)]">
                    <Link href="/dashboard" className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center">
                            <span className="text-white font-bold">E</span>
                        </div>
                        <span className="text-xl font-semibold text-[var(--foreground)]">
                            EchoLens
                        </span>
                    </Link>
                </div>

                {/* Nav */}
                <nav className="flex-1 p-4 space-y-2">
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-[var(--foreground-muted)] hover:bg-[var(--glass-bg)] hover:text-[var(--foreground)] transition-colors"
                    >
                        <LayoutDashboard className="w-5 h-5" />
                        Dashboard
                    </Link>
                    <Link
                        href="/session/new"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white font-medium"
                    >
                        <Plus className="w-5 h-5" />
                        New Session
                    </Link>
                </nav>

                {/* User */}
                <div className="p-4 border-t border-[var(--glass-border)]">
                    <div className="flex items-center gap-3 mb-4">
                        {user.picture ? (
                            <img
                                src={user.picture}
                                alt={user.name || 'User'}
                                className="w-10 h-10 rounded-full"
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-[var(--accent-primary)] flex items-center justify-center text-white font-medium">
                                {user.name?.[0] || user.email?.[0] || 'U'}
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[var(--foreground)] truncate">
                                {user.name || 'User'}
                            </p>
                            <p className="text-xs text-[var(--foreground-muted)] truncate">
                                {user.email}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Link
                            href="/settings"
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg glass text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
                        >
                            <Settings className="w-4 h-4" />
                        </Link>
                        <a
                            href="/api/auth/logout"
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg glass text-sm text-[var(--foreground-muted)] hover:text-red-400 transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                        </a>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                {children}
            </main>
        </div>
    );
}
