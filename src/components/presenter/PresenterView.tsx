'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
    Mic,
    MicOff,
    SkipForward,
    Pause,
    Play,
    Share2,
    Settings,
    ChevronDown,
    ChevronUp,
    Radio,
    Trash2,
    AlertCircle
} from 'lucide-react';
import { Canvas } from '@/components/canvas';
import { LiveSummary, TranscriptFeed } from '@/components/sidebar';
import { useTranscription } from '@/hooks/useTranscription';
import { useGeminiStream } from '@/hooks/useGeminiStream';
import { useTranscriptStore } from '@/lib/stores/transcript-store';
import { useVisualizationStore } from '@/lib/stores/visualization-store';
import { useAuraStore } from '@/lib/stores/aura-store';

interface PresenterViewProps {
    sessionId: string;
    sessionTitle?: string;
}

export function PresenterView({ sessionId, sessionTitle = 'Presentation' }: PresenterViewProps) {
    const [isTranscriptExpanded, setIsTranscriptExpanded] = useState(true);
    const [isPaused, setIsPaused] = useState(false);
    const [showCopied, setShowCopied] = useState(false);

    const { fullTranscript, isListening } = useTranscriptStore();
    const { currentCard, dismissCard, clear: clearVisualizations } = useVisualizationStore();
    const { state: auraState } = useAuraStore();

    const lastAnalyzedLengthRef = useRef(0);

    // Set up Gemini streaming
    const { analyzeTranscript, reset: resetGemini } = useGeminiStream({
        onVisualization: (card) => {
            console.log('New visualization:', card.headline);
        },
        onSummary: (summary) => {
            console.log('New summary:', summary);
        },
    });

    // Handle transcript updates - trigger Gemini analysis
    const handleTranscript = useCallback((text: string, isFinal: boolean) => {
        if (isFinal && text.trim() && !isPaused) {
            // Analyze with the new text
            analyzeTranscript(text, fullTranscript + ' ' + text);
        }
    }, [fullTranscript, analyzeTranscript, isPaused]);

    // Also analyze periodically based on full transcript growth
    useEffect(() => {
        if (!isListening || isPaused) return;

        const newLength = fullTranscript.length;
        if (newLength - lastAnalyzedLengthRef.current > 100) {
            lastAnalyzedLengthRef.current = newLength;
            // Trigger analysis with empty new text (will use full transcript)
            analyzeTranscript('', fullTranscript);
        }
    }, [fullTranscript, isListening, isPaused, analyzeTranscript]);

    // Set up transcription
    const { startTranscription, stopTranscription, clearTranscript, isSupported } = useTranscription({
        onTranscript: handleTranscript,
        onError: (error) => console.error('Transcription error:', error),
    });

    // Handle start/stop
    const handleToggleListening = useCallback(() => {
        if (isListening) {
            stopTranscription();
        } else {
            startTranscription();
            lastAnalyzedLengthRef.current = 0;
        }
    }, [isListening, startTranscription, stopTranscription]);

    // Handle skip visualization
    const handleSkip = useCallback(() => {
        dismissCard();
    }, [dismissCard]);

    // Handle pause/resume
    const handlePauseResume = useCallback(() => {
        setIsPaused(!isPaused);
    }, [isPaused]);

    // Handle clear
    const handleClear = useCallback(() => {
        clearTranscript();
        clearVisualizations();
        resetGemini();
        lastAnalyzedLengthRef.current = 0;
    }, [clearTranscript, clearVisualizations, resetGemini]);

    // Copy share link
    const handleShare = useCallback(() => {
        const shareUrl = `${window.location.origin}/session/${sessionId}/audience`;
        navigator.clipboard.writeText(shareUrl);
        setShowCopied(true);
        setTimeout(() => setShowCopied(false), 2000);
    }, [sessionId]);

    if (!isSupported) {
        return (
            <div className="h-screen flex items-center justify-center">
                <div className="text-center p-8 glass-card max-w-md">
                    <AlertCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">
                        Browser Not Supported
                    </h2>
                    <p className="text-[var(--foreground-muted)]">
                        Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari for the best experience.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col">
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-4 border-b border-[var(--glass-border)]">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-semibold text-[var(--foreground)]">
                        {sessionTitle}
                    </h1>
                    {isListening && (
                        <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-sm">
                            <Radio className="w-4 h-4 animate-pulse" />
                            LIVE
                        </span>
                    )}
                    {isPaused && isListening && (
                        <span className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-sm">
                            PAUSED
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <button
                            onClick={handleShare}
                            className="p-2 rounded-lg glass text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
                            title="Copy audience link"
                        >
                            <Share2 className="w-5 h-5" />
                        </button>
                        {showCopied && (
                            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-green-400 whitespace-nowrap">
                                Copied!
                            </span>
                        )}
                    </div>
                    <button
                        className="p-2 rounded-lg glass text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
                        title="Settings"
                    >
                        <Settings className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Canvas Area */}
                <div className="flex-1 relative">
                    <Canvas className="absolute inset-0" />
                </div>

                {/* Sidebar */}
                <aside className="w-80 border-l border-[var(--glass-border)] flex flex-col bg-[var(--bg-secondary)]">
                    {/* Live Summary */}
                    <div className="flex-1 py-4 overflow-hidden">
                        <LiveSummary className="h-full" />
                    </div>

                    {/* Transcript (collapsible) */}
                    <div className="border-t border-[var(--glass-border)]">
                        <button
                            onClick={() => setIsTranscriptExpanded(!isTranscriptExpanded)}
                            className="w-full flex items-center justify-between px-4 py-3 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
                        >
                            <span>Transcript</span>
                            {isTranscriptExpanded ? (
                                <ChevronDown className="w-4 h-4" />
                            ) : (
                                <ChevronUp className="w-4 h-4" />
                            )}
                        </button>
                        {isTranscriptExpanded && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="pb-4"
                            >
                                <TranscriptFeed maxHeight="200px" />
                            </motion.div>
                        )}
                    </div>
                </aside>
            </div>

            {/* Control Bar */}
            <footer className="px-6 py-4 border-t border-[var(--glass-border)] bg-[var(--bg-secondary)]">
                <div className="flex items-center justify-center gap-4">
                    {/* Clear button */}
                    <button
                        onClick={handleClear}
                        className="p-3 rounded-xl glass text-[var(--foreground-muted)] hover:text-red-400 transition-all"
                        title="Clear transcript and visualizations"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>

                    {/* Pause/Resume */}
                    <button
                        onClick={handlePauseResume}
                        disabled={!isListening}
                        className="p-3 rounded-xl glass text-[var(--foreground-muted)] hover:text-[var(--foreground)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        title={isPaused ? 'Resume analysis' : 'Pause analysis'}
                    >
                        {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                    </button>

                    {/* Main mic toggle */}
                    <button
                        onClick={handleToggleListening}
                        className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-medium transition-all text-lg ${isListening
                                ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30'
                                : 'bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white hover:opacity-90 shadow-lg shadow-blue-500/30'
                            }`}
                    >
                        {isListening ? (
                            <>
                                <MicOff className="w-6 h-6" />
                                Stop
                            </>
                        ) : (
                            <>
                                <Mic className="w-6 h-6" />
                                Start Listening
                            </>
                        )}
                    </button>

                    {/* Skip visualization */}
                    <button
                        onClick={handleSkip}
                        disabled={!currentCard}
                        className="p-3 rounded-xl glass text-[var(--foreground-muted)] hover:text-[var(--foreground)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        title="Skip current visualization"
                    >
                        <SkipForward className="w-5 h-5" />
                    </button>

                    {/* Status indicator */}
                    <div className="ml-4 px-4 py-2 rounded-xl glass text-sm text-[var(--foreground-muted)] flex items-center gap-2">
                        <span
                            className={`w-2 h-2 rounded-full ${auraState === 'idle' ? 'bg-gray-400' :
                                    auraState === 'listening' ? 'bg-green-400 animate-pulse' :
                                        auraState === 'morphing' ? 'bg-yellow-400 animate-pulse' :
                                            auraState === 'visualizing' ? 'bg-purple-400' :
                                                'bg-blue-400'
                                }`}
                        />
                        <span className="capitalize">{auraState}</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
