'use client';

import { create } from 'zustand';

interface TranscriptChunk {
    id: string;
    text: string;
    isFinal: boolean;
    timestamp: number;
}

interface TranscriptStore {
    chunks: TranscriptChunk[];
    fullTranscript: string;
    isListening: boolean;

    addChunk: (chunk: TranscriptChunk) => void;
    updateChunk: (id: string, text: string, isFinal: boolean) => void;
    setListening: (listening: boolean) => void;
    clear: () => void;
}

export const useTranscriptStore = create<TranscriptStore>((set, get) => ({
    chunks: [],
    fullTranscript: '',
    isListening: false,

    addChunk: (chunk) => {
        set((state) => ({
            chunks: [...state.chunks, chunk],
            fullTranscript: state.fullTranscript + (chunk.isFinal ? chunk.text + ' ' : ''),
        }));
    },

    updateChunk: (id, text, isFinal) => {
        set((state) => {
            const chunks = state.chunks.map((c) =>
                c.id === id ? { ...c, text, isFinal } : c
            );
            const fullTranscript = chunks
                .filter((c) => c.isFinal)
                .map((c) => c.text)
                .join(' ');
            return { chunks, fullTranscript };
        });
    },

    setListening: (isListening) => set({ isListening }),

    clear: () => set({ chunks: [], fullTranscript: '', isListening: false }),
}));
