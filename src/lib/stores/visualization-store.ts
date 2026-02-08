'use client';

import { create } from 'zustand';
import type { VisualizationCard } from '@/lib/types';

interface SummaryItem {
    id: string;
    text: string;
    timestamp: number;
}

interface VisualizationStore {
    currentCard: VisualizationCard | null;
    cardQueue: VisualizationCard[];
    summaries: SummaryItem[];

    setCurrentCard: (card: VisualizationCard | null) => void;
    queueCard: (card: VisualizationCard) => void;
    nextCard: () => void;
    dismissCard: () => void;
    addSummary: (text: string) => void;
    clear: () => void;
}

export const useVisualizationStore = create<VisualizationStore>((set, get) => ({
    currentCard: null,
    cardQueue: [],
    summaries: [],

    setCurrentCard: (card) => set({ currentCard: card }),

    queueCard: (card) => {
        const { currentCard } = get();
        if (!currentCard) {
            set({ currentCard: card });
        } else {
            set((state) => ({ cardQueue: [...state.cardQueue, card] }));
        }
    },

    nextCard: () => {
        const { cardQueue } = get();
        if (cardQueue.length > 0) {
            const [next, ...rest] = cardQueue;
            set({ currentCard: next, cardQueue: rest });
        } else {
            set({ currentCard: null });
        }
    },

    dismissCard: () => {
        get().nextCard();
    },

    addSummary: (text) => {
        const summary: SummaryItem = {
            id: crypto.randomUUID(),
            text,
            timestamp: Date.now(),
        };
        set((state) => ({
            summaries: [summary, ...state.summaries].slice(0, 15),
        }));
    },

    clear: () => set({ currentCard: null, cardQueue: [], summaries: [] }),
}));
