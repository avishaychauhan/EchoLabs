'use client';

import { useEffect } from 'react';
import { Canvas } from '@/components/canvas';
import { LiveSummary } from '@/components/sidebar';
import { useAuraStore } from '@/lib/stores/aura-store';
import { useVisualizationStore } from '@/lib/stores/visualization-store';
import { Radio, Users } from 'lucide-react';

interface AudienceViewProps {
    sessionId: string;
    sessionTitle?: string;
}

export function AudienceView({ sessionId, sessionTitle = 'Presentation' }: AudienceViewProps) {
    const { state: auraState, setState, setAudioLevel, triggerVisualization } = useAuraStore();
    const { addSummary } = useVisualizationStore();

    // In production, connect to WebSocket to receive state updates from presenter
    useEffect(() => {
        // Demo: simulate receiving updates
        const demoInterval = setInterval(() => {
            // Random audio level simulation
            setAudioLevel(Math.random() * 0.4);
        }, 100);

        // Add a welcome summary
        addSummary('Connected to live presentation. Waiting for presenter to begin...');

        return () => {
            clearInterval(demoInterval);
        };
    }, [setAudioLevel, addSummary]);

    return (
        <div className="h-screen flex flex-col bg-[var(--bg-primary)]">
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-4 border-b border-[var(--glass-border)]">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center">
                            <span className="text-white font-bold text-sm">E</span>
                        </div>
                        <span className="text-lg font-semibold text-[var(--foreground)]">
                            EchoLens
                        </span>
                    </div>
                    <span className="text-[var(--foreground-muted)]">|</span>
                    <h1 className="text-lg text-[var(--foreground)]">
                        {sessionTitle}
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <span className="flex items-center gap-2 text-sm text-[var(--foreground-muted)]">
                        <Users className="w-4 h-4" />
                        Audience View
                    </span>
                    <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm">
                        <Radio className="w-4 h-4 animate-pulse" />
                        LIVE
                    </span>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Canvas Area */}
                <div className="flex-1 relative">
                    <Canvas className="absolute inset-0" />
                </div>

                {/* Sidebar - Summary Only (no transcript for audience) */}
                <aside className="w-80 border-l border-[var(--glass-border)] bg-[var(--bg-secondary)] py-4">
                    <LiveSummary className="h-full" />
                </aside>
            </div>

            {/* Footer */}
            <footer className="px-6 py-3 border-t border-[var(--glass-border)] bg-[var(--bg-secondary)]">
                <div className="flex items-center justify-center text-sm text-[var(--foreground-muted)]">
                    Powered by EchoLens • Aura: <span className="capitalize text-[var(--foreground)] ml-1">{auraState}</span>
                </div>
            </footer>
        </div>
    );
}
