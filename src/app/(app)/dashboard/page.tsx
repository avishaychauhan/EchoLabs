import { cookies } from 'next/headers';
import Link from 'next/link';
import { Plus, Calendar, FileText } from 'lucide-react';
import { Aura } from '@/components/aura';

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

// Mock sessions for demo - replace with Prisma query
const mockSessions = [
    {
        id: '1',
        title: 'Q3 Financial Review',
        description: 'Quarterly earnings presentation for stakeholders',
        status: 'COMPLETED' as const,
        fileCount: 3,
        createdAt: new Date('2024-01-15'),
    },
    {
        id: '2',
        title: 'Product Launch 2024',
        description: 'New product line introduction',
        status: 'DRAFT' as const,
        fileCount: 5,
        createdAt: new Date('2024-01-20'),
    },
];

const statusColors = {
    DRAFT: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    LIVE: 'bg-green-500/20 text-green-400 border-green-500/30',
    COMPLETED: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

export default async function DashboardPage() {
    const user = await getUser();

    // In production, fetch sessions from database
    const sessions = mockSessions;
    const hasNoSessions = sessions.length === 0;

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-semibold text-[var(--foreground)] mb-2">
                        Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
                    </h1>
                    <p className="text-[var(--foreground-muted)]">
                        Create and manage your presentation sessions
                    </p>
                </div>
                <Link
                    href="/session/new"
                    className="btn-primary inline-flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    New Session
                </Link>
            </div>

            {/* Sessions Grid */}
            {hasNoSessions ? (
                /* Empty State */
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="mb-8 opacity-50">
                        <Aura size={200} interactive={false} />
                    </div>
                    <h2 className="text-xl font-medium text-[var(--foreground)] mb-2">
                        No sessions yet
                    </h2>
                    <p className="text-[var(--foreground-muted)] mb-6 text-center max-w-md">
                        Create your first session to start presenting with AI-powered visualizations
                    </p>
                    <Link href="/session/new" className="btn-primary inline-flex items-center gap-2">
                        <Plus className="w-5 h-5" />
                        Create Your First Session
                    </Link>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sessions.map((s) => (
                        <Link
                            key={s.id}
                            href={`/session/${s.id}/presenter`}
                            className="glass-card p-6 group"
                        >
                            {/* Status Badge */}
                            <div className="flex items-center justify-between mb-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[s.status]}`}>
                                    {s.status}
                                </span>
                                <span className="text-xs text-[var(--foreground-subtle)]">
                                    {s.createdAt.toLocaleDateString()}
                                </span>
                            </div>

                            {/* Content */}
                            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2 group-hover:text-[var(--accent-primary)] transition-colors">
                                {s.title}
                            </h3>
                            <p className="text-sm text-[var(--foreground-muted)] mb-4 line-clamp-2">
                                {s.description}
                            </p>

                            {/* Meta */}
                            <div className="flex items-center gap-4 text-xs text-[var(--foreground-subtle)]">
                                <span className="flex items-center gap-1">
                                    <FileText className="w-4 h-4" />
                                    {s.fileCount} files
                                </span>
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    {s.createdAt.toLocaleDateString()}
                                </span>
                            </div>
                        </Link>
                    ))}

                    {/* New Session Card */}
                    <Link
                        href="/session/new"
                        className="glass-card p-6 flex flex-col items-center justify-center min-h-[200px] border-dashed hover:border-[var(--accent-primary)]/50 transition-colors group"
                    >
                        <div className="w-12 h-12 rounded-full bg-[var(--accent-primary)]/10 flex items-center justify-center mb-4 group-hover:bg-[var(--accent-primary)]/20 transition-colors">
                            <Plus className="w-6 h-6 text-[var(--accent-primary)]" />
                        </div>
                        <span className="text-[var(--foreground-muted)] group-hover:text-[var(--foreground)] transition-colors">
                            Create New Session
                        </span>
                    </Link>
                </div>
            )}
        </div>
    );
}
