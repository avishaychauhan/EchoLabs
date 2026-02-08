'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Mic,
    MicOff,
    BarChart3,
    Link2,
    FileText,
    Sparkles,
    Radio,
    Wifi,
    WifiOff,
    MessageSquare,
    ClipboardList,
    Zap
} from 'lucide-react';
import { useVisualizationStore } from '@/lib/stores/visualization-store';
import { useTranscriptStore } from '@/lib/stores/transcript-store';
import { useAuraStore } from '@/lib/stores/aura-store';
import { useEchoLensWs } from '@/hooks/useEchoLensWs';
import { useTranscription } from '@/hooks/useTranscription';
import { useDeepgram } from '@/hooks/useDeepgram';
import { MermaidChart } from '@/components/canvas/MermaidChart';
import { ReferenceCard } from '@/components/canvas/ReferenceCard';
import { AuraCanvas } from '@/components/aura/AuraCanvas';

/* ─── Agent status colors (dark theme) ────────────────────────────── */
const STATUS_COLORS: Record<string, string> = {
    processing: 'bg-amber-400',
    complete: 'bg-emerald-400',
    error: 'bg-red-400',
    idle: 'bg-slate-500',
};

/* ─── Bullet category styles ──────────────────────────────────── */
const BULLET_CATEGORY_STYLES = {
    key_point: { color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/30', icon: '●', label: 'Key Point' },
    decision: { color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30', icon: '✓', label: 'Decision' },
    action_item: { color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30', icon: '⚑', label: 'Action' },
    question: { color: 'text-violet-400', bg: 'bg-violet-500/20', border: 'border-violet-500/30', icon: '?', label: 'Question' },
};

/* ─── Main EchoLens Interface ───────────────────────────────────── */
export function EchoLensInterface({ sessionId }: { sessionId: string }) {
    const {
        charts,
        references,
        contextMatches,
        bullets,
        agentStatuses,
        summaries,
    } = useVisualizationStore();

    const { chunks, fullTranscript, isListening: isStoreListening, addChunk, updateChunk, setListening } = useTranscriptStore();
    const { state: auraState, setAudioLevel } = useAuraStore();
    const { isConnected } = useEchoLensWs({ sessionId });
    const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
    const interimChunkIdRef = useRef<string | null>(null);

    useEffect(() => {
        setPortalTarget(document.getElementById('sidebar-portal'));
    }, []);

    // Determine if we have active visualizations
    const hasVisualizations = charts.length > 0 || references.length > 0;

    // Set up Deepgram transcription
    const { start: startDeepgram, stop: stopDeepgram, isRecording: isDeepgramRecording } = useDeepgram({
        onTranscript: async (text: string, isFinal: boolean) => {
            if (isFinal) {
                if (interimChunkIdRef.current) {
                    updateChunk(interimChunkIdRef.current, text, true);
                    interimChunkIdRef.current = null;
                } else {
                    addChunk({
                        id: crypto.randomUUID(),
                        text,
                        isFinal: true,
                        timestamp: Date.now(),
                    });
                }
                if (text.length > 10) {
                    const context = useTranscriptStore.getState().fullTranscript;
                    fetch('/api/orchestrator', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            text,
                            timestamp: Date.now(),
                            sessionId,
                            context,
                        }),
                    }).catch(console.error);
                }
            } else {
                if (interimChunkIdRef.current) {
                    updateChunk(interimChunkIdRef.current, text, false);
                } else {
                    const id = crypto.randomUUID();
                    interimChunkIdRef.current = id;
                    addChunk({ id, text, isFinal: false, timestamp: Date.now() });
                }
            }
        },
        onError: (err) => {
            console.error('[Deepgram]', err);
            // Fallback to Web Speech API if Deepgram fails asynchronously
            if (!isWebSpeechListening && isSupported) {
                console.warn('[Deepgram] Error detected, falling back to Web Speech API');
                startTranscription();
            }
        },
    });

    // Fallback Web Speech API (for seamless experience if Deepgram key is missing)
    const { startTranscription, stopTranscription, isListening: isWebSpeechListening, isSupported } = useTranscription({
        onTranscript: async (text: string, isFinal: boolean) => {
            if (isFinal && text.length > 15) {
                fetch('/api/orchestrator', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text,
                        timestamp: Date.now(),
                        sessionId,
                        context: fullTranscript,
                    }),
                }).catch(console.error);
            }
        },
        onError: (e) => console.warn('[WebSpeech]', e),
    });

    const isListening = isDeepgramRecording || isWebSpeechListening;

    // Compute stats
    const stats = useMemo(() => {
        const wordCount = chunks.reduce(
            (acc: number, c: { text: string }) => acc + c.text.split(/\s+/).filter(Boolean).length,
            0
        );
        return {
            words: wordCount,
            references: references.reduce((acc, r) => acc + (r.sources?.length || 0), 0),
            charts: charts.length,
            highlights: bullets.length || summaries.length,
            contexts: contextMatches.reduce((acc, c) => acc + (c.matches?.length || 0), 0),
        };
    }, [chunks, references, charts, bullets, summaries, contextMatches]);

    const activeAgents = Object.values(agentStatuses).filter((s) => s === 'processing').length;

    const handleToggleRecording = async () => {
        if (isListening) {
            setListening(false);
            stopDeepgram();
            stopTranscription();
        } else {
            // Try Deepgram first
            try {
                await startDeepgram();
                setListening(true);
            } catch (e) {
                console.warn('Deepgram failed to start, falling back to Web Speech', e);
                if (isSupported) {
                    startTranscription();
                }
            }
        }
    };

    return (
        <div className="flex h-[calc(100vh-2rem)] flex-col bg-[var(--bg-primary)] text-[var(--foreground)] relative rounded-2xl overflow-hidden glass shadow-2xl m-4 border border-[var(--glass-border)]">

            {/* Sidebar Portal Content */}
            {portalTarget && createPortal(
                <div className="flex flex-col gap-6 animate-fade-in-up">
                    {/* Session Highlights */}
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">Highlights</h3>
                            {stats.highlights > 0 && (
                                <span className="bg-blue-500/20 text-blue-400 text-[10px] px-1.5 py-0.5 rounded-full font-medium">
                                    {stats.highlights}
                                </span>
                            )}
                        </div>
                        <div className="space-y-2">
                            {(bullets.length > 0 ? bullets : summaries).slice(0, 10).map((item, i) => {
                                const bullet = 'category' in item ? item : { ...item, category: 'key_point' as const };
                                const style = BULLET_CATEGORY_STYLES[bullet.category || 'key_point'];
                                return (
                                    <div
                                        key={item.id || i}
                                        className={`glass-card p-3 rounded-xl border-l-2 ${style.border.replace('border', 'border-l')}`}
                                    >
                                        <div className="flex items-start gap-2">
                                            <span className={`mt-0.5 text-[10px] ${style.color}`}>{style.icon}</span>
                                            <p className="text-xs leading-relaxed text-[var(--foreground)]">{item.text}</p>
                                        </div>
                                    </div>
                                );
                            })}
                            {bullets.length === 0 && summaries.length === 0 && (
                                <div className="glass-card p-4 rounded-xl text-center">
                                    <p className="text-xs text-[var(--foreground-muted)]">Insights appear here as you speak</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Live Transcript */}
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">Transcript</h3>
                            {isListening && <span className="text-[10px] text-red-400 animate-pulse font-medium">● LIVE</span>}
                        </div>
                        <div className="glass-card p-3 rounded-xl max-h-60 overflow-y-auto no-scrollbar space-y-2">
                            {chunks.length > 0 ? (
                                chunks.slice(-15).map((chunk: { id: string; text: string; isFinal: boolean }, i: number) => (
                                    <p
                                        key={chunk.id || i}
                                        className={`text-xs leading-relaxed ${chunk.isFinal ? 'text-[var(--foreground-muted)]' : 'text-[var(--foreground-subtle)] italic'}`}
                                    >
                                        {chunk.text}
                                    </p>
                                ))
                            ) : (
                                <p className="text-xs text-[var(--foreground-subtle)] text-center py-2">Start speaking...</p>
                            )}
                        </div>
                    </div>
                </div>,
                portalTarget
            )}

            {/* ─── Main Content Area ─────────────────────────── */}
            <div className="flex flex-1 overflow-hidden relative">

                {/* ─── CENTER: Main Canvas with Aura + Visualizations ───── */}
                <main className="flex-1 relative overflow-hidden flex flex-col">

                    {/* Floating Top Bar (Controls) */}
                    <div className="absolute top-6 right-6 z-50 flex items-center gap-3">
                        {/* Status Badges */}
                        <div className="flex items-center gap-2 bg-[rgba(0,0,0,0.4)] backdrop-blur-md rounded-full p-1 pr-4 border border-[var(--glass-border)]">
                            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${isConnected ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'
                                }`}>
                                {isConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                            </div>

                            {/* Agent Status */}
                            <div className="flex items-center gap-1.5 border-l border-[var(--glass-border)] pl-3">
                                {Object.entries(agentStatuses).map(([agent, status]) => (
                                    <div
                                        key={agent}
                                        className={`w-1.5 h-1.5 rounded-full ${STATUS_COLORS[status]} ${status === 'processing' ? 'animate-pulse' : ''}`}
                                        title={`${agent}: ${status}`}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Mic Button */}
                        <button
                            onClick={handleToggleRecording}
                            disabled={!isSupported}
                            className={`flex items-center gap-2 px-6 py-2 rounded-full font-medium transition-all shadow-lg backdrop-blur-md border border-[var(--glass-border)] ${isListening
                                ? 'bg-red-500/80 text-white hover:bg-red-600/80'
                                : 'bg-[rgba(255,255,255,0.1)] text-white hover:bg-[rgba(255,255,255,0.2)]'
                                }`}
                        >
                            {isListening ? (
                                <>
                                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                    <span>Recording</span>
                                </>
                            ) : (
                                <>
                                    <Mic className="w-4 h-4" />
                                    <span>Start</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Aura Background - Always present, animates based on state */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <motion.div
                            animate={{
                                scale: hasVisualizations ? 0.4 : 1,
                                opacity: hasVisualizations ? 0.3 : 1,
                                filter: hasVisualizations ? 'blur(20px)' : 'blur(0px)',
                            }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <AuraCanvas
                                width={hasVisualizations ? 300 : 500}
                                height={hasVisualizations ? 300 : 500}
                                interactive={false}
                            />
                        </motion.div>
                    </div>

                    {/* Ambient glow */}
                    <div
                        className="absolute inset-0 pointer-events-none transition-all duration-700"
                        style={{
                            background: hasVisualizations
                                ? `radial-gradient(ellipse at center, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 30%, transparent 60%)`
                                : `radial-gradient(ellipse at center, rgba(59, 130, 246, 0.08) 0%, rgba(139, 92, 246, 0.04) 40%, transparent 70%)`,
                        }}
                    />

                    {/* Visualizations Content */}
                    <div className="relative z-10 h-full overflow-y-auto p-8 no-scrollbar pt-24">
                        <AnimatePresence mode="wait">
                            {hasVisualizations ? (
                                <motion.div
                                    key="visualizations"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="space-y-6 max-w-3xl mx-auto"
                                >
                                    {/* Charts Section */}
                                    {charts.length > 0 && (
                                        <div className="glass-card rounded-2xl p-6">
                                            <div className="flex items-center gap-2 mb-6">
                                                <div className="p-2 rounded-lg bg-violet-500/20">
                                                    <BarChart3 className="w-5 h-5 text-violet-400" />
                                                </div>
                                                <h2 className="text-xl font-semibold text-[var(--foreground)]">Visual Insights</h2>
                                            </div>
                                            <div className="space-y-8">
                                                {charts.map((chart, i) => (
                                                    <MermaidChart
                                                        key={`chart-${i}`}
                                                        code={chart.mermaidCode}
                                                        title={chart.title}
                                                        narration={chart.narration}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* References Section */}
                                    {references.length > 0 && (
                                        <div className="glass-card rounded-2xl p-6">
                                            <div className="flex items-center gap-2 mb-6">
                                                <div className="p-2 rounded-lg bg-emerald-500/20">
                                                    <Link2 className="w-5 h-5 text-emerald-400" />
                                                </div>
                                                <h2 className="text-xl font-semibold text-[var(--foreground)]">Referenced Articles</h2>
                                            </div>
                                            <div className="space-y-4">
                                                {references.map((ref, i) => (
                                                    <ReferenceCard
                                                        key={`ref-${i}`}
                                                        sources={ref.sources || []}
                                                        query={ref.query}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Context Matches */}
                                    {contextMatches.length > 0 && (
                                        <div className="glass-card rounded-2xl p-6">
                                            <div className="flex items-center gap-2 mb-6">
                                                <div className="p-2 rounded-lg bg-orange-500/20">
                                                    <FileText className="w-5 h-5 text-orange-400" />
                                                </div>
                                                <h2 className="text-xl font-semibold text-[var(--foreground)]">Related Context</h2>
                                            </div>
                                            <div className="space-y-3">
                                                {contextMatches.flatMap((ctx) =>
                                                    ctx.matches?.map((match: { id: string; title: string; preview: string; from?: string }) => (
                                                        <motion.div
                                                            key={match.id}
                                                            initial={{ opacity: 0, y: 8 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            className="rounded-xl border border-orange-500/30 bg-orange-500/10 p-4"
                                                        >
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <span className="text-xs font-bold text-orange-300 uppercase tracking-wider">{ctx.matchType}</span>
                                                                <span className="text-[10px] text-[var(--foreground-muted)]">• {match.from}</span>
                                                            </div>
                                                            <p className="text-sm font-medium text-[var(--foreground)]">{match.title}</p>
                                                            <p className="text-xs text-[var(--foreground-muted)] mt-1">{match.preview}</p>
                                                        </motion.div>
                                                    )) || []
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="empty-state"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="h-full flex flex-col items-center justify-center text-center pb-20"
                                >
                                    <h2 className="text-2xl font-bold bg-gradient-to-br from-white to-white/50 bg-clip-text text-transparent mb-2">
                                        AI Presentation Companion
                                    </h2>
                                    <p className="text-sm text-[var(--foreground-muted)] max-w-sm">
                                        Start recording to generate real-time insights, charts, and relevant context.
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Aura state indicator */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
                        <div className="glass px-4 py-2 rounded-full flex items-center gap-3 backdrop-blur-xl border border-[var(--glass-border)]">
                            <span
                                className={`w-2 h-2 rounded-full transition-colors duration-300 ${auraState === 'idle' ? 'bg-gray-400' :
                                    auraState === 'listening' ? 'bg-green-400 animate-pulse' :
                                        auraState === 'morphing' ? 'bg-blue-400 animate-pulse' :
                                            auraState === 'visualizing' ? 'bg-purple-400' :
                                                'bg-yellow-400'
                                    }`}
                            />
                            <span className="text-xs text-[var(--foreground-muted)] font-medium capitalize min-w-[60px] text-center">
                                {hasVisualizations ? 'Insight Active' : auraState}
                            </span>
                        </div>
                    </div>
                </main>

                {/* ─── RIGHT SIDEBAR: Stats ───── */}
                <aside className="w-72 shrink-0 flex flex-col border-l border-[var(--glass-border)] glass-strong overflow-y-auto no-scrollbar p-6 gap-6">
                    {/* Session Stats */}
                    <div>
                        <h3 className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider mb-4">Session Stats</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <StatTile label="Words" value={stats.words} icon="📝" />
                            <StatTile label="Highlights" value={stats.highlights} icon="💡" />
                            <StatTile label="Charts" value={stats.charts} icon="📊" />
                            <StatTile label="References" value={stats.references} icon="🔗" />
                        </div>
                    </div>

                    {/* Quick Tips */}
                    <div className="bg-[rgba(255,255,255,0.03)] rounded-2xl p-4 border border-[var(--glass-border)]">
                        <h3 className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider mb-3">Quick Tips</h3>
                        <ul className="space-y-3">
                            <li className="flex gap-3 text-xs text-[var(--foreground-subtle)]">
                                <span className="text-blue-400">●</span>
                                Say "revenue increased by..." to generate charts
                            </li>
                            <li className="flex gap-3 text-xs text-[var(--foreground-subtle)]">
                                <span className="text-emerald-400">●</span>
                                Mention external sources to find references
                            </li>
                            <li className="flex gap-3 text-xs text-[var(--foreground-subtle)]">
                                <span className="text-orange-400">●</span>
                                Discussions trigger context retrieval
                            </li>
                        </ul>
                    </div>

                    <div className="mt-auto pt-6 border-t border-[var(--glass-border)]">
                        <div className="flex items-center justify-between text-xs text-[var(--foreground-muted)]">
                            <span>Session ID</span>
                            <span className="font-mono text-[10px] text-[var(--foreground-subtle)] bg-[rgba(0,0,0,0.2)] px-2 py-1 rounded">
                                {sessionId.slice(0, 8)}...
                            </span>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}

/* ─── Sub-components ──────────────────────────────────── */

function StatTile({ label, value, icon }: { label: string; value: number; icon: string }) {
    return (
        <div className="rounded-xl bg-[rgba(255,255,255,0.03)] p-3 text-center border border-[var(--glass-border)] hover:bg-[rgba(255,255,255,0.05)] transition-colors">
            <span className="text-lg mb-1 block">{icon}</span>
            <p className="text-lg font-bold text-[var(--foreground)]">{value}</p>
            <p className="text-[10px] text-[var(--foreground-muted)] uppercase tracking-wider">{label}</p>
        </div>
    );
}
