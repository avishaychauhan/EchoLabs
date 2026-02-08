'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useAuraStore } from '@/lib/stores/aura-store';
import { useVisualizationStore } from '@/lib/stores/visualization-store';
import { AuraCanvas } from '@/components/aura/AuraCanvas';
import { VisualizationRenderer } from './VisualizationRenderer';

interface CanvasProps {
    className?: string;
}

export function Canvas({ className = '' }: CanvasProps) {
    const { state } = useAuraStore();
    const { currentCard } = useVisualizationStore();

    const isShowingVisualization = state === 'visualizing' && currentCard;

    return (
        <div className={`relative w-full h-full flex items-center justify-center overflow-hidden ${className}`}>
            {/* Ambient background glow */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: `radial-gradient(ellipse at center, 
            rgba(59, 130, 246, 0.08) 0%, 
            rgba(139, 92, 246, 0.04) 30%, 
            transparent 60%)`,
                }}
            />

            {/* Aura Layer */}
            <AnimatePresence mode="wait">
                {!isShowingVisualization && (
                    <motion.div
                        key="aura"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0 flex items-center justify-center"
                    >
                        <AuraCanvas width={500} height={500} interactive={false} />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Visualization Layer */}
            <AnimatePresence mode="wait">
                {isShowingVisualization && currentCard && (
                    <motion.div
                        key="visualization"
                        initial={{ opacity: 0, scale: 0.3 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.3 }}
                        transition={{
                            duration: 0.8,
                            ease: [0.16, 1, 0.3, 1] // Custom spring-like easing
                        }}
                        className="absolute inset-0 flex items-center justify-center p-8"
                    >
                        {/* Aura halo behind visualization */}
                        <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                                background: `radial-gradient(ellipse at center, 
                  rgba(59, 130, 246, 0.15) 0%, 
                  rgba(139, 92, 246, 0.08) 40%, 
                  transparent 70%)`,
                                animation: 'pulse-glow 4s ease-in-out infinite',
                            }}
                        />

                        {/* Visualization content */}
                        <div className="relative z-10 w-full max-w-4xl">
                            <VisualizationRenderer card={currentCard} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* State indicator */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                <div className="glass px-4 py-2 rounded-full flex items-center gap-2">
                    <span
                        className={`w-2 h-2 rounded-full ${state === 'idle' ? 'bg-gray-400' :
                                state === 'listening' ? 'bg-green-400 animate-pulse' :
                                    state === 'morphing' ? 'bg-blue-400 animate-pulse' :
                                        state === 'visualizing' ? 'bg-purple-400' :
                                            'bg-yellow-400'
                            }`}
                    />
                    <span className="text-xs text-[var(--foreground-muted)] capitalize">
                        {state}
                    </span>
                </div>
            </div>
        </div>
    );
}
