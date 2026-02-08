import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const SYSTEM_PROMPT = `You are EchoLens's visualization director. Your job is to decide what data visualization should appear next based on what the presenter is saying.

Rules:
- Only trigger a visualization when the presenter is clearly discussing data, metrics, comparisons, or trends
- Choose the most impactful chart type for the data being discussed
- Write a short, punchy headline (max 8 words) for each visualization  
- Generate a 1-sentence audience summary of what's being discussed
- If the presenter is speaking generally (not about specific data), respond with action: "keep_current"
- Never show the same visualization twice in a row

Available chart types: bar_chart, line_chart, pie_chart, area_chart, kpi_card, table, comparison, timeline, donut

Available morphHints (tells Aura HOW to transform):
- expand_bars: blob splits vertically into bar columns
- trace_line: blob stretches into horizontal line trace  
- segment_pie: blob's interior segments into wedges
- grid_table: blob tessellates into rectangular grid
- pulse_kpi: blob expands slightly, number pulses in
- scatter_points: blob disperses into data point dots

You MUST respond ONLY with valid JSON in this exact format:
{
  "action": "new_card" | "keep_current" | "dismiss_current",
  "card": {
    "type": "bar_chart",
    "headline": "Q3 Revenue Up 23%",
    "morphHint": "expand_bars",
    "sourceFile": "financial_report.xlsx",
    "data": { "labels": ["Q1", "Q2", "Q3"], "values": [100, 120, 147] },
    "chartConfig": { "colors": ["#3B82F6", "#8B5CF6", "#F59E0B"] }
  },
  "audienceSummary": "Discussing Q3 revenue performance across regions."
}

If no visualization should be triggered, respond with:
{ "action": "keep_current", "audienceSummary": "Brief summary of what presenter is discussing." }`;

export async function POST(request: NextRequest) {
    try {
        const { recentTranscript, fullTranscript, currentCard, files } = await request.json();

        if (!process.env.GEMINI_API_KEY) {
            // Return demo data when no API key is configured
            return NextResponse.json(generateDemoResponse(recentTranscript));
        }

        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-pro',
            generationConfig: {
                responseMimeType: 'application/json',
            },
        });

        const fileContext = files?.length > 0
            ? `\n\nAvailable data files:\n${files.map((f: { fileName: string; summary: string; columns?: string[] }) =>
                `- ${f.fileName}: ${f.summary}${f.columns ? ` (Columns: ${f.columns.join(', ')})` : ''}`
            ).join('\n')}`
            : '';

        const prompt = `${SYSTEM_PROMPT}${fileContext}

Recent transcript: "${recentTranscript}"
Full transcript so far: "${fullTranscript?.slice(-2000) || recentTranscript}"
Currently displayed: ${currentCard || "nothing (Aura is idle)"}

Analyze the transcript and decide what visualization to show. Respond with valid JSON only.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        try {
            const parsed = JSON.parse(text);
            return NextResponse.json(parsed);
        } catch {
            return NextResponse.json({
                action: 'keep_current',
                audienceSummary: 'Listening to the presentation...'
            });
        }

    } catch (error) {
        console.error('Gemini API error:', error);
        return NextResponse.json(
            { action: 'keep_current', audienceSummary: 'Processing...' },
            { status: 200 }
        );
    }
}

// Demo response generator for when no API key is configured
function generateDemoResponse(transcript: string) {
    const lower = transcript.toLowerCase();

    // Detect keywords to trigger demo visualizations
    if (lower.includes('revenue') || lower.includes('sales') || lower.includes('quarter')) {
        return {
            action: 'new_card',
            card: {
                type: 'bar_chart',
                headline: 'Quarterly Revenue Growth',
                morphHint: 'expand_bars',
                sourceFile: 'demo_data.xlsx',
                data: {
                    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
                    values: [2.4, 3.1, 3.8, 4.2],
                },
                chartConfig: {
                    colors: ['#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE'],
                    valuePrefix: '$',
                    valueSuffix: 'M',
                },
            },
            audienceSummary: 'Reviewing quarterly revenue performance with strong Q4 growth.',
        };
    }

    if (lower.includes('market') || lower.includes('share') || lower.includes('percent')) {
        return {
            action: 'new_card',
            card: {
                type: 'pie_chart',
                headline: 'Market Share Breakdown',
                morphHint: 'segment_pie',
                sourceFile: 'demo_data.xlsx',
                data: {
                    labels: ['Our Product', 'Competitor A', 'Competitor B', 'Others'],
                    values: [42, 28, 18, 12],
                },
                chartConfig: {
                    colors: ['#3B82F6', '#8B5CF6', '#F59E0B', '#71717A'],
                },
            },
            audienceSummary: 'Analyzing current market share distribution.',
        };
    }

    if (lower.includes('growth') || lower.includes('trend') || lower.includes('over time')) {
        return {
            action: 'new_card',
            card: {
                type: 'line_chart',
                headline: 'User Growth Trajectory',
                morphHint: 'trace_line',
                sourceFile: 'demo_data.xlsx',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    values: [1200, 1800, 2400, 3100, 4200, 5800],
                },
                chartConfig: {
                    colors: ['#3B82F6'],
                },
            },
            audienceSummary: 'Tracking impressive user growth over the past six months.',
        };
    }

    if (lower.includes('kpi') || lower.includes('metric') || lower.includes('total')) {
        return {
            action: 'new_card',
            card: {
                type: 'kpi_card',
                headline: 'Total Active Users',
                morphHint: 'pulse_kpi',
                sourceFile: 'demo_data.xlsx',
                data: {
                    value: '124.5K',
                    change: '+23%',
                    trend: 'up',
                },
                chartConfig: {},
            },
            audienceSummary: 'Highlighting key performance indicator for active users.',
        };
    }

    return {
        action: 'keep_current',
        audienceSummary: transcript.length > 20
            ? `The presenter is discussing: ${transcript.slice(0, 100)}...`
            : 'Listening to the presentation...',
    };
}
