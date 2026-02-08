'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useVisualizationStore } from '@/lib/stores/visualization-store';
import { Sparkles } from 'lucide-react';

interface LiveSummaryProps {
    className?: string;
}

export function LiveSummary({ className = '' }: LiveSummaryProps) {
    const { summaries } = useVisualizationStore();

    return (
        <div className={`flex flex-col ${className}`}>
            {/* Header */}
            <div className="flex items-center gap-2 mb-4 px-4">
                <Sparkles className="w-4 h-4 text-[var(--accent-primary)]" />
                <h3 className="text-sm font-semibold text-[var(--foreground)]">
                    Live Summary
                </h3>
            </div>

            {/* Summaries List */}
            <div className="flex-1 overflow-y-auto px-4 space-y-3">
                <AnimatePresence mode="popLayout">
                    {summaries.length === 0 ? (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-sm text-[var(--foreground-subtle)] italic"
                        >
                            Start speaking to see live summaries...
                        </motion.p>
                    ) : (
                        summaries.map((summary, index) => (
                            <motion.div
                                key={summary.id}
                                initial={{ opacity: 0, x: -20, height: 0 }}
                                animate={{ opacity: 1, x: 0, height: 'auto' }}
                                exit={{ opacity: 0, x: 20, height: 0 }}
                                transition={{ duration: 0.3 }}
                                className={`p-3 rounded-lg ${index === 0
                                        ? 'bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20'
                                        : 'bg-[var(--glass-bg)]'
                                    }`}
                            >
                                <p className={`text-sm ${index === 0 ? 'text-[var(--foreground)]' : 'text-[var(--foreground-muted)]'
                                    }`}>
                                    {summary.text}
                                </p>
                                <span className="text-xs text-[var(--foreground-subtle)] mt-1 block">
                                    {new Date(summary.timestamp).toLocaleTimeString()}
                                </span>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
