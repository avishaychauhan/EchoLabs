'use client';

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { VisualizationCard } from '@/lib/types';
import type { ChartPayload, ReferencePayload, ContextPayload } from '@/types/events';
import type { SummaryBullet } from '@/types/agents';

interface SummaryItem {
    id: string;
    text: string;
    timestamp: number;
    category?: 'key_point' | 'decision' | 'action_item' | 'question';
    isNew?: boolean;
}

interface VisualizationStore {
    // Existing
    currentCard: VisualizationCard | null;
    cardQueue: VisualizationCard[];
    summaries: SummaryItem[];

    // New: Charts from WebSocket
    charts: ChartPayload[];
    currentChartIndex: number;

    // New: References from WebSocket
    references: ReferencePayload[];

    // New: Context matches from WebSocket
    contextMatches: ContextPayload[];

    // New: Summary bullets from WebSocket (enhanced)
    bullets: SummaryBullet[];

    // New: Agent statuses
    agentStatuses: Record<string, 'idle' | 'processing' | 'complete' | 'error'>;

    // Existing actions
    setCurrentCard: (card: VisualizationCard | null) => void;
    queueCard: (card: VisualizationCard) => void;
    nextCard: () => void;
    dismissCard: () => void;
    addSummary: (text: string) => void;
    clear: () => void;

    // New actions for WebSocket data
    addChart: (chart: ChartPayload) => void;
    addReference: (ref: ReferencePayload) => void;
    addContextMatch: (match: ContextPayload) => void;
    updateBullets: (bullets: SummaryBullet[]) => void;
    setAgentStatus: (agent: string, status: 'idle' | 'processing' | 'complete' | 'error') => void;
    nextChart: () => void;
    previousChart: () => void;
}

export const useVisualizationStore = create<VisualizationStore>()(
    immer((set, get) => ({
        currentCard: null,
        cardQueue: [],
        summaries: [],
        charts: [],
        currentChartIndex: 0,
        references: [],
        contextMatches: [],
        bullets: [],
        agentStatuses: {},

        setCurrentCard: (card) => set({ currentCard: card }),

        queueCard: (card) => {
            const { currentCard } = get();
            if (!currentCard) {
                set({ currentCard: card });
            } else {
                set((state) => {
                    state.cardQueue.push(card);
                });
            }
        },

        nextCard: () => {
            const { cardQueue } = get();
            if (cardQueue.length > 0) {
                set((state) => {
                    state.currentCard = state.cardQueue[0];
                    state.cardQueue = state.cardQueue.slice(1);
                });
            } else {
                set({ currentCard: null });
            }
        },

        dismissCard: () => {
            get().nextCard();
        },

        addSummary: (text) => {
            set((state) => {
                state.summaries.unshift({
                    id: crypto.randomUUID(),
                    text,
                    timestamp: Date.now(),
                });
                if (state.summaries.length > 15) {
                    state.summaries = state.summaries.slice(0, 15);
                }
            });
        },

        // New: Add chart from WebSocket
        addChart: (chart) => {
            set((state) => {
                state.charts.unshift(chart);
                if (state.charts.length > 10) {
                    state.charts = state.charts.slice(0, 10);
                }
                state.currentChartIndex = 0;
            });
        },

        // New: Add reference from WebSocket
        addReference: (ref) => {
            set((state) => {
                state.references.unshift(ref);
                if (state.references.length > 5) {
                    state.references = state.references.slice(0, 5);
                }
            });
        },

        // New: Add context match from WebSocket
        addContextMatch: (match) => {
            set((state) => {
                state.contextMatches.unshift(match);
                if (state.contextMatches.length > 5) {
                    state.contextMatches = state.contextMatches.slice(0, 5);
                }
            });
        },

        // New: Update bullets from WebSocket (full replacement)
        updateBullets: (bullets) => {
            set((state) => {
                state.bullets = bullets;
                // Also add new bullets to legacy summaries for backward compatibility
                const newBullets = bullets.filter((b) => (b as SummaryBullet & { isNew?: boolean }).isNew);
                for (const bullet of newBullets) {
                    state.summaries.unshift({
                        id: bullet.id,
                        text: bullet.text,
                        timestamp: bullet.timestamp,
                        category: bullet.category,
                        isNew: true,
                    });
                }
                if (state.summaries.length > 15) {
                    state.summaries = state.summaries.slice(0, 15);
                }
            });
        },

        // New: Set agent status
        setAgentStatus: (agent, status) => {
            set((state) => {
                state.agentStatuses[agent] = status;
            });
        },

        // New: Navigate charts
        nextChart: () => {
            set((state) => {
                if (state.currentChartIndex < state.charts.length - 1) {
                    state.currentChartIndex++;
                }
            });
        },

        previousChart: () => {
            set((state) => {
                if (state.currentChartIndex > 0) {
                    state.currentChartIndex--;
                }
            });
        },

        clear: () => set({
            currentCard: null,
            cardQueue: [],
            summaries: [],
            charts: [],
            currentChartIndex: 0,
            references: [],
            contextMatches: [],
            bullets: [],
            agentStatuses: {},
        }),
    }))
);
