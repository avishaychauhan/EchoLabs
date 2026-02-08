'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useVisualizationStore } from '@/lib/stores/visualization-store';
import { useAuraStore } from '@/lib/stores/aura-store';
import type { ChartPayload, ReferencePayload, SummaryPayload, ContextPayload } from '@/types/events';
import type { VisualizationCard } from '@/lib/types';

interface UseEchoLensWsOptions {
    sessionId: string;
    autoConnect?: boolean;
}

interface UseEchoLensWsReturn {
    isConnected: boolean;
    connect: () => void;
    disconnect: () => void;
}

/**
 * Convert a ChartPayload to a VisualizationCard for the aura system
 */
function chartPayloadToVisualizationCard(chart: ChartPayload): VisualizationCard {
    return {
        id: `chart-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: 'bar_chart', // Default, could map from chartType
        headline: chart.title,
        data: {
            mermaidCode: chart.mermaidCode,
            chartType: chart.chartType,
            narration: chart.narration,
            sourceExcerpt: chart.sourceExcerpt,
        },
        sourceFile: 'live-transcription',
        chartConfig: {},
        morphHint: 'expand_bars',
    };
}

export function useEchoLensWs({ sessionId, autoConnect = true }: UseEchoLensWsOptions): UseEchoLensWsReturn {
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const connectRef = useRef<() => void>(() => {});
    const [isConnected, setIsConnected] = useState(false);

    // Get store actions
    const {
        addChart,
        addReference,
        addContextMatch,
        updateBullets,
        setAgentStatus,
    } = useVisualizationStore();

    const { triggerVisualization } = useAuraStore();

    const connect = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) return;

        // Use explicit WS URL when set (e.g. for separate WS server); otherwise same-origin.
        // For WebSocket to work, run the app with the custom server: npm run dev (not next dev).
        const baseUrl =
            typeof process !== 'undefined' && process.env.NEXT_PUBLIC_WS_URL
                ? process.env.NEXT_PUBLIC_WS_URL.replace(/\/$/, '')
                : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`;
        const wsUrl = baseUrl.endsWith('/ws') ? baseUrl : `${baseUrl}/ws`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log('[WS] Connected');
            setIsConnected(true);

            // Register session with server
            ws.send(
                JSON.stringify({
                    event: 'session:start',
                    sessionId,
                    timestamp: Date.now(),
                    payload: {},
                })
            );
        };

        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                console.log('[WS] Received:', msg.event, msg.payload);

                switch (msg.event) {
                    case 'chart:render': {
                        const chartPayload = msg.payload as ChartPayload;
                        addChart(chartPayload);

                        // Always trigger visualization INSTANTLY
                        const card = chartPayloadToVisualizationCard(chartPayload);
                        triggerVisualization(card);
                        console.log('[WS] Chart triggered instantly');
                        break;
                    }

                    case 'reference:found': {
                        const refPayload = msg.payload as ReferencePayload;
                        addReference(refPayload);
                        break;
                    }

                    case 'context:match': {
                        const contextPayload = msg.payload as ContextPayload;
                        addContextMatch(contextPayload);
                        break;
                    }

                    case 'summary:update': {
                        const summaryPayload = msg.payload as SummaryPayload;
                        updateBullets(summaryPayload.bullets);
                        break;
                    }

                    case 'agent:status': {
                        const { agent, status } = msg.payload as { agent: string; status: 'processing' | 'complete' | 'error' };
                        setAgentStatus(agent, status);
                        break;
                    }
                }
            } catch (error) {
                console.error('[WS] Message parse error:', error);
            }
        };

        ws.onclose = () => {
            console.log('[WS] Disconnected');
            setIsConnected(false);

            // Auto-reconnect after 2 seconds (use ref to avoid "accessed before declaration")
            reconnectTimeoutRef.current = setTimeout(() => {
                connectRef.current();
            }, 2000);
        };

        ws.onerror = () => {
            console.error(
                '[WS] Connection error. Ensure the app is run with "npm run dev" (custom server with WebSocket), not "next dev" alone.'
            );
            ws.close();
        };
    }, [sessionId, addChart, addReference, addContextMatch, updateBullets, setAgentStatus, triggerVisualization]);

    // Keep ref updated so reconnect timeout always calls latest connect
    useEffect(() => {
        connectRef.current = connect;
    }, [connect]);

    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        setIsConnected(false);
    }, []);

    useEffect(() => {
        if (autoConnect) {
            connect();
        }

        return () => {
            disconnect();
        };
    }, [autoConnect, connect, disconnect]);

    return { isConnected, connect, disconnect };
}
