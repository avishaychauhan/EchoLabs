'use client';

import { useCallback, useRef, useState } from 'react';
import { useVisualizationStore } from '@/lib/stores/visualization-store';

interface UseLiveSummaryOptions {
    minWords?: number;
    debounceMs?: number;
    onSummary?: (summary: string) => void;
    onError?: (error: Error) => void;
}

export function useLiveSummary(options: UseLiveSummaryOptions = {}) {
    const { minWords = 15, debounceMs = 3000 } = options;

    const [isGenerating, setIsGenerating] = useState(false);
    const lastAnalyzedLengthRef = useRef(0);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const { addSummary } = useVisualizationStore();

    const generateSummary = useCallback(async (transcript: string) => {
        // Only generate if we have enough new content
        const words = transcript.trim().split(/\s+/).length;
        if (words < minWords) return;

        // Debounce
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(async () => {
            // Skip if not enough new content since last analysis
            if (transcript.length - lastAnalyzedLengthRef.current < 50) return;

            lastAnalyzedLengthRef.current = transcript.length;

            // Cancel previous request
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            abortControllerRef.current = new AbortController();

            setIsGenerating(true);

            try {
                const response = await fetch('/api/summarize', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ transcript }),
                    signal: abortControllerRef.current.signal,
                });

                if (!response.ok) throw new Error('Summary request failed');

                const data = await response.json();

                if (data.summary) {
                    addSummary(data.summary);
                    options.onSummary?.(data.summary);
                }
            } catch (error) {
                if ((error as Error).name !== 'AbortError') {
                    console.error('Summary generation failed:', error);
                    options.onError?.(error as Error);
                }
            } finally {
                setIsGenerating(false);
            }
        }, debounceMs);
    }, [minWords, debounceMs, addSummary, options]);

    const reset = useCallback(() => {
        lastAnalyzedLengthRef.current = 0;
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        setIsGenerating(false);
    }, []);

    return {
        generateSummary,
        reset,
        isGenerating,
    };
}
