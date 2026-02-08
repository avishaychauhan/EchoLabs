'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useTranscriptStore } from '@/lib/stores/transcript-store';
import { useRef, useEffect } from 'react';
import { MessageSquare, Volume2 } from 'lucide-react';

interface TranscriptFeedProps {
    className?: string;
    maxHeight?: string;
}

export function TranscriptFeed({ className = '', maxHeight = '200px' }: TranscriptFeedProps) {
    const { chunks, isListening, fullTranscript } = useTranscriptStore();
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom on new chunks
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [chunks, fullTranscript]);

    // Get the last interim (non-final) chunk for display
    const lastInterim = chunks.filter(c => !c.isFinal).slice(-1)[0];

    return (
        <div className={`flex flex-col ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-3 px-4">
                <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-[var(--foreground-muted)]" />
                    <h3 className="text-sm font-semibold text-[var(--foreground)]">
                        Transcript
                    </h3>
                </div>
                {isListening && (
                    <span className="flex items-center gap-1.5 text-xs text-green-400">
                        <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                        Listening
                    </span>
                )}
            </div>

            {/* Transcript Content */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto px-4 scroll-smooth"
                style={{ maxHeight }}
            >
                {!fullTranscript && !lastInterim ? (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-sm text-[var(--foreground-subtle)] italic"
                    >
                        {isListening ? (
                            <span className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                Listening for speech...
                            </span>
                        ) : (
                            'Click "Start Listening" to begin transcription'
                        )}
                    </motion.p>
                ) : (
                    <div className="space-y-2">
                        {/* Final transcript */}
                        {fullTranscript && (
                            <p className="text-sm text-[var(--foreground)] leading-relaxed font-mono">
                                {fullTranscript}
                            </p>
                        )}

                        {/* Current interim text (typing indicator) */}
                        <AnimatePresence>
                            {lastInterim && (
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="text-sm text-[var(--accent-primary)] italic font-mono border-l-2 border-[var(--accent-primary)] pl-2"
                                >
                                    {lastInterim.text}
                                    <span className="inline-block w-0.5 h-4 bg-[var(--accent-primary)] ml-0.5 animate-pulse" />
                                </motion.p>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Word count */}
            {fullTranscript && (
                <div className="px-4 pt-2 border-t border-[var(--glass-border)] mt-2">
                    <span className="text-xs text-[var(--foreground-subtle)]">
                        {fullTranscript.split(/\s+/).filter(Boolean).length} words
                    </span>
                </div>
            )}
        </div>
    );
}
