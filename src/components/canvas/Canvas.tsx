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
    const { currentCard, charts, currentChartIndex } = useVisualizationStore();

    // Show chart if we have one from WebSocket OR from queue
    const activeChart = charts[currentChartIndex];
    const hasVisualization = currentCard || activeChart;
    const isShowingVisualization = (state === 'visualizing' && hasVisualization) || activeChart;

    return (
        <div className={`relative w-full h-full flex items-center justify-center overflow-hidden ${className}`}>
            {/* Ambient background glow - always visible */}
            <div
                className="absolute inset-0 pointer-events-none transition-all duration-700"
                style={{
                    background: isShowingVisualization
                        ? `radial-gradient(ellipse at center, 
                            rgba(139, 92, 246, 0.15) 0%, 
                            rgba(59, 130, 246, 0.08) 30%, 
                            transparent 60%)`
                        : `radial-gradient(ellipse at center, 
                            rgba(59, 130, 246, 0.08) 0%, 
                            rgba(139, 92, 246, 0.04) 30%, 
                            transparent 60%)`,
                }}
            />

            {/* Aura Layer - persists but shrinks/pulses when chart appears */}
            <motion.div
                key="aura-persistent"
                initial={{ opacity: 1, scale: 1 }}
                animate={{
                    opacity: isShowingVisualization ? 0.3 : 1,
                    scale: isShowingVisualization ? 0.4 : 1,
                    filter: isShowingVisualization ? 'blur(8px)' : 'blur(0px)'
                }}
                transition={{
                    duration: 0.6,
                    ease: [0.16, 1, 0.3, 1]
                }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
                <AuraCanvas width={500} height={500} interactive={false} />
            </motion.div>

            {/* Organic morph ring - appears during transition */}
            <AnimatePresence>
                {isShowingVisualization && (
                    <motion.div
                        key="morph-ring"
                        initial={{ scale: 0.3, opacity: 0 }}
                        animate={{ scale: 1.5, opacity: [0, 0.6, 0] }}
                        exit={{ scale: 2, opacity: 0 }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="absolute pointer-events-none"
                        style={{
                            width: 300,
                            height: 300,
                            borderRadius: '50%',
                            background: `radial-gradient(circle, 
                                transparent 40%, 
                                rgba(59, 130, 246, 0.3) 60%, 
                                rgba(139, 92, 246, 0.5) 80%, 
                                transparent 100%)`,
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Visualization Layer - blooms instantly from center */}
            <AnimatePresence mode="wait">
                {isShowingVisualization && (
                    <motion.div
                        key={activeChart ? `chart-${currentChartIndex}` : 'visualization'}
                        initial={{
                            opacity: 0,
                            scale: 0.2,
                            y: 0,
                        }}
                        animate={{
                            opacity: 1,
                            scale: 1,
                            y: 0,
                        }}
                        exit={{
                            opacity: 0,
                            scale: 0.5,
                            y: 20,
                        }}
                        transition={{
                            duration: 0.5,
                            ease: [0.16, 1, 0.3, 1], // Organic spring-like easing
                            opacity: { duration: 0.3 },
                        }}
                        className="absolute inset-0 flex items-center justify-center p-8 z-10"
                    >
                        {/* Subtle glow behind chart */}
                        <div
                            className="absolute pointer-events-none"
                            style={{
                                width: '100%',
                                height: '100%',
                                background: `radial-gradient(ellipse at center, 
                                    rgba(59, 130, 246, 0.12) 0%, 
                                    rgba(139, 92, 246, 0.06) 40%, 
                                    transparent 70%)`,
                                animation: 'pulse-glow 3s ease-in-out infinite',
                            }}
                        />

                        {/* Chart content */}
                        <div className="relative z-10 w-full max-w-4xl">
                            {activeChart ? (
                                <VisualizationRenderer
                                    card={{
                                        id: `ws-chart-${currentChartIndex}`,
                                        type: 'bar_chart',
                                        headline: activeChart.title,
                                        data: {
                                            mermaidCode: activeChart.mermaidCode,
                                            chartType: activeChart.chartType,
                                            narration: activeChart.narration,
                                            sourceExcerpt: activeChart.sourceExcerpt,
                                        },
                                        sourceFile: 'live-transcription',
                                        chartConfig: {},
                                        morphHint: 'expand_bars',
                                    }}
                                />
                            ) : currentCard ? (
                                <VisualizationRenderer card={currentCard} />
                            ) : null}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* State indicator */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
                <div className="glass px-4 py-2 rounded-full flex items-center gap-2">
                    <span
                        className={`w-2 h-2 rounded-full transition-colors duration-300 ${state === 'idle' ? 'bg-gray-400' :
                                state === 'listening' ? 'bg-green-400 animate-pulse' :
                                    state === 'morphing' ? 'bg-blue-400 animate-pulse' :
                                        state === 'visualizing' ? 'bg-purple-400' :
                                            'bg-yellow-400'
                            }`}
                    />
                    <span className="text-xs text-[var(--foreground-muted)] capitalize">
                        {isShowingVisualization && activeChart ? 'insight' : state}
                    </span>
                </div>
            </div>
        </div>
    );
}

