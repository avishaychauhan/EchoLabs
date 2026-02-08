import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Auth0Provider } from "@auth0/nextjs-auth0/client";
import "./globals.css";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "EchoLens — AI-Powered Presentation Companion",
    description: "Transform your voice into stunning visualizations. EchoLens listens to your presentation and dynamically surfaces charts, graphs, and data — all in real time.",
    keywords: ["presentation", "AI", "visualization", "real-time", "transcription", "Gemini"],
    authors: [{ name: "EchoLens" }],
    openGraph: {
        title: "EchoLens — Your Voice Shapes the Room",
        description: "AI-powered presentation companion that transforms your pitch into a living visual experience.",
        type: "website",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="dark">
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased`}
            >
                <Auth0Provider>
                    {children}
                </Auth0Provider>
            </body>
        </html>
    );
}
