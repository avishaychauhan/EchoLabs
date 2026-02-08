import { NextRequest, NextResponse } from 'next/server';

const DEMO_SUMMARIES = [
    "The speaker is discussing key business metrics and performance trends.",
    "Important financial data points are being presented to stakeholders.",
    "The presentation covers market analysis and competitive positioning.",
    "Growth strategies and future projections are being outlined.",
    "Team accomplishments and milestone achievements are being highlighted.",
];

export async function POST(request: NextRequest) {
    try {
        const { transcript } = await request.json();

        if (!transcript || typeof transcript !== 'string') {
            return NextResponse.json({ error: 'Transcript is required' }, { status: 400 });
        }

        // Check if Gemini API key is configured
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            // Demo mode - return a contextual summary based on keywords
            const lowerTranscript = transcript.toLowerCase();

            let summary = DEMO_SUMMARIES[Math.floor(Math.random() * DEMO_SUMMARIES.length)];

            if (lowerTranscript.includes('revenue') || lowerTranscript.includes('sales')) {
                summary = "Revenue and sales performance metrics are being analyzed.";
            } else if (lowerTranscript.includes('growth') || lowerTranscript.includes('increase')) {
                summary = "Growth trends and improvement strategies are under discussion.";
            } else if (lowerTranscript.includes('market') || lowerTranscript.includes('customer')) {
                summary = "Market dynamics and customer insights are being explored.";
            } else if (lowerTranscript.includes('team') || lowerTranscript.includes('project')) {
                summary = "Team progress and project milestones are being reviewed.";
            }

            return NextResponse.json({ summary, demo: true });
        }

        // Production: Use Gemini API
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `You are a live presentation summarizer. Based on this transcript excerpt, provide a single concise sentence (max 20 words) that captures what the speaker is currently discussing. Focus on the key topic or insight.

Transcript:
"${transcript.slice(-800)}"

Summary:`
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.3,
                        maxOutputTokens: 50,
                    }
                }),
            }
        );

        if (!response.ok) {
            throw new Error('Gemini API request failed');
        }

        const data = await response.json();
        const summary = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

        return NextResponse.json({ summary });
    } catch (error) {
        console.error('Summary API error:', error);
        return NextResponse.json(
            { error: 'Failed to generate summary', message: String(error) },
            { status: 500 }
        );
    }
}
