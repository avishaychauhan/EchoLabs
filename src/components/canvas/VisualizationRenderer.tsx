'use client';

import { motion } from 'framer-motion';
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';
import type { VisualizationCard } from '@/lib/types';
import { MermaidChart } from './MermaidChart';

interface VisualizationRendererProps {
    card: VisualizationCard;
    className?: string;
}

const DEFAULT_COLORS = ['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981', '#EF4444', '#EC4899'];

export function VisualizationRenderer({ card, className = '' }: VisualizationRendererProps) {
    const colors = card.chartConfig?.colors || DEFAULT_COLORS;

    // Check if this card has Mermaid data from WebSocket
    const mermaidCode = card.data?.mermaidCode as string | undefined;
    const mermaidNarration = card.data?.narration as string | undefined;

    // If we have mermaid code, render MermaidChart
    if (mermaidCode) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className={`w-full h-full flex flex-col items-center justify-center p-4 ${className}`}
            >
                <MermaidChart
                    code={mermaidCode}
                    title={card.headline}
                    narration={mermaidNarration}
                    className="max-w-3xl w-full"
                />
            </motion.div>
        );
    }

    // Transform data for Recharts
    const chartData = transformData(card);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={`w-full h-full flex flex-col items-center justify-center ${className}`}
        >
            {/* Headline */}
            <motion.h2
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl md:text-3xl font-semibold text-[var(--foreground)] text-center mb-6"
            >
                {card.headline}
            </motion.h2>

            {/* Chart */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="w-full max-w-2xl h-64 md:h-80"
            >
                {renderChart(card.type, chartData, colors, card.chartConfig)}
            </motion.div>

            {/* Source */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="mt-4 text-sm text-[var(--foreground-subtle)]"
            >
                Source: {card.sourceFile}
            </motion.p>
        </motion.div>
    );
}

function transformData(card: VisualizationCard) {
    const { data } = card;

    if (!data) return [];

    // Handle labels/values format
    if (data.labels && data.values) {
        return (data.labels as string[]).map((label: string, i: number) => ({
            name: label,
            value: (data.values as number[])[i],
        }));
    }

    // Handle array of objects
    if (Array.isArray(data)) {
        return data;
    }

    // Handle KPI card
    if (data.value !== undefined) {
        return [{ name: 'Value', value: data.value }];
    }

    return [];
}

function renderChart(
    type: string,
    data: { name: string; value: number }[],
    colors: string[],
    config?: VisualizationCard['chartConfig']
) {
    const prefix = config?.valuePrefix || '';
    const suffix = config?.valueSuffix || '';

    const formatValue = (value: number | string) => `${prefix}${value}${suffix}`;

    switch (type) {
        case 'bar_chart':
            return (
                <ResponsiveContainer>
                    <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis
                            dataKey="name"
                            stroke="rgba(255,255,255,0.5)"
                            tick={{ fill: 'rgba(255,255,255,0.7)' }}
                        />
                        <YAxis
                            stroke="rgba(255,255,255,0.5)"
                            tick={{ fill: 'rgba(255,255,255,0.7)' }}
                            tickFormatter={(v) => formatValue(v)}
                        />
                        <Tooltip
                            contentStyle={{
                                background: 'rgba(15, 15, 26, 0.95)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                            }}
                            labelStyle={{ color: 'white' }}
                            formatter={(value: number) => [formatValue(value), 'Value']}
                        />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                            {data.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            );

        case 'line_chart':
            return (
                <ResponsiveContainer>
                    <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis
                            dataKey="name"
                            stroke="rgba(255,255,255,0.5)"
                            tick={{ fill: 'rgba(255,255,255,0.7)' }}
                        />
                        <YAxis
                            stroke="rgba(255,255,255,0.5)"
                            tick={{ fill: 'rgba(255,255,255,0.7)' }}
                        />
                        <Tooltip
                            contentStyle={{
                                background: 'rgba(15, 15, 26, 0.95)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                            }}
                        />
                        <Line
                            type="monotone"
                            dataKey="value"
                            stroke={colors[0]}
                            strokeWidth={3}
                            dot={{ fill: colors[0], strokeWidth: 2 }}
                            activeDot={{ r: 8, fill: colors[0] }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            );

        case 'area_chart':
            return (
                <ResponsiveContainer>
                    <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
                        <YAxis stroke="rgba(255,255,255,0.5)" />
                        <Tooltip
                            contentStyle={{
                                background: 'rgba(15, 15, 26, 0.95)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke={colors[0]}
                            fill={`${colors[0]}40`}
                            strokeWidth={2}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            );

        case 'pie_chart':
        case 'donut':
            const isDonut = type === 'donut';
            return (
                <ResponsiveContainer>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={isDonut ? 60 : 0}
                            outerRadius={100}
                            paddingAngle={2}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            labelLine={{ stroke: 'rgba(255,255,255,0.3)' }}
                        >
                            {data.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                background: 'rgba(15, 15, 26, 0.95)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                            }}
                        />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            );

        case 'kpi_card':
            const kpiData = data[0] || { value: '0' };
            return (
                <div className="flex flex-col items-center justify-center h-full">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                        className="text-6xl md:text-8xl font-bold text-gradient-accent"
                    >
                        {typeof kpiData.value === 'object' ? JSON.stringify(kpiData.value) : kpiData.value}
                    </motion.div>
                </div>
            );

        case 'table':
            return (
                <div className="overflow-auto max-h-full">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-[var(--glass-border)]">
                                <th className="px-4 py-2 text-[var(--foreground-muted)]">Name</th>
                                <th className="px-4 py-2 text-[var(--foreground-muted)]">Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, i) => (
                                <tr key={i} className="border-b border-[var(--glass-border)]/50">
                                    <td className="px-4 py-3 text-[var(--foreground)]">{row.name}</td>
                                    <td className="px-4 py-3 text-[var(--foreground)]">{row.value}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );

        default:
            return (
                <div className="text-center text-[var(--foreground-muted)]">
                    Visualization type not supported: {type}
                </div>
            );
    }
}

