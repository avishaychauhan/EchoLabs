'use client';

import { useCallback, useRef } from 'react';
import { useVisualizationStore } from '@/lib/stores/visualization-store';
import { useAuraStore } from '@/lib/stores/aura-store';
import type { VisualizationCard, GeminiResponse } from '@/lib/types';

interface FileContext {
    fileName: string;
    summary: string;
    columns?: string[];
    sampleData?: Record<string, unknown>[];
}

interface UseGeminiStreamOptions {
    files?: FileContext[];
    onVisualization?: (card: VisualizationCard) => void;
    onSummary?: (summary: string) => void;
    onError?: (error: Error) => void;
}

export function useGeminiStream(options: UseGeminiStreamOptions = {}) {
    const abortControllerRef = useRef<AbortController | null>(null);
    const lastTriggerTimeRef = useRef<number>(0);
    const lastTranscriptRef = useRef<string>('');
    const wordCountRef = useRef<number>(0);

    const { queueCard, addSummary, currentCard } = useVisualizationStore();
    const { triggerVisualization, setState } = useAuraStore();

    const analyzeTranscript = useCallback(async (
        newText: string,
        fullTranscript: string
    ) => {
        // Only analyze when we have meaningful new content
        const newWords = newText.trim().split(/\s+/).length;
        wordCountRef.current += newWords;

        // Trigger analysis every ~15 words or every 5 seconds minimum
        const now = Date.now();
        const timeSinceLastTrigger = now - lastTriggerTimeRef.current;
        const shouldTrigger = wordCountRef.current >= 15 ||
            (wordCountRef.current >= 5 && timeSinceLastTrigger > 5000);

        if (!shouldTrigger) return;

        // Reset counters
        wordCountRef.current = 0;
        lastTriggerTimeRef.current = now;

        // Get recent context (last ~200 chars for context)
        const recentText = fullTranscript.slice(-500);

        // Skip if same as last
        if (recentText === lastTranscriptRef.current) return;
        lastTranscriptRef.current = recentText;

        // Cancel any pending request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        try {
            const response = await fetch('/api/gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recentTranscript: recentText,
                    fullTranscript,
                    currentCard: currentCard?.headline || null,
                    files: options.files || [],
                }),
                signal: abortControllerRef.current.signal,
            });

            if (!response.ok) {
                throw new Error('Gemini request failed');
            }

            const data: GeminiResponse = await response.json();

            // Handle the response
            if (data.action === 'new_card' && data.card) {
                const card: VisualizationCard = {
                    id: crypto.randomUUID(),
                    type: data.card.type || 'bar_chart',
                    headline: data.card.headline || 'Data Visualization',
                    data: data.card.data || {},
                    sourceFile: data.card.sourceFile || 'analysis',
                    chartConfig: data.card.chartConfig || {},
                    morphHint: data.card.morphHint || 'expand_bars',
                };

                setState('morphing');
                setTimeout(() => {
                    queueCard(card);
                    triggerVisualization(card);
                    setState('visualizing');
                    options.onVisualization?.(card);
                }, 500);
            }

            if (data.audienceSummary) {
                addSummary(data.audienceSummary);
                options.onSummary?.(data.audienceSummary);
            }

        } catch (error) {
            if ((error as Error).name !== 'AbortError') {
                console.error('Gemini analysis failed:', error);
                options.onError?.(error as Error);
            }
        }
    }, [options, queueCard, triggerVisualization, addSummary, currentCard, setState]);

    const cancel = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
    }, []);

    const reset = useCallback(() => {
        wordCountRef.current = 0;
        lastTranscriptRef.current = '';
        lastTriggerTimeRef.current = 0;
    }, []);

    return {
        analyzeTranscript,
        cancel,
        reset,
    };
}
