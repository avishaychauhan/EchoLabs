'use client';

import { useCallback, useRef, useEffect, useState } from 'react';
import { useTranscriptStore } from '@/lib/stores/transcript-store';
import { useAuraStore } from '@/lib/stores/aura-store';

interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
    resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string;
    message: string;
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    abort(): void;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
    onend: (() => void) | null;
    onstart: (() => void) | null;
}

declare global {
    interface Window {
        SpeechRecognition: new () => SpeechRecognition;
        webkitSpeechRecognition: new () => SpeechRecognition;
    }
}

interface UseTranscriptionOptions {
    onTranscript?: (text: string, isFinal: boolean) => void;
    onError?: (error: Error) => void;
}

export function useTranscription(options: UseTranscriptionOptions = {}) {
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const animationFrameRef = useRef<number>(0);
    const streamRef = useRef<MediaStream | null>(null);
    const isRestartingRef = useRef(false);

    const [isSupported, setIsSupported] = useState(true);

    const { addChunk, updateChunk, setListening, isListening, clear } = useTranscriptStore();
    const { setAudioLevel, startListening: startAuraListening, stopListening: stopAuraListening, setState } = useAuraStore();

    // Check browser support
    useEffect(() => {
        const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
        setIsSupported(!!SpeechRecognitionAPI);
    }, []);

    // Analyze audio for Aura visualization
    const analyzeAudio = useCallback(() => {
        if (!analyserRef.current) return;

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);

        // Calculate average volume (0-1)
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        const normalizedLevel = Math.min(average / 128, 1);

        setAudioLevel(normalizedLevel);

        if (isListening) {
            animationFrameRef.current = requestAnimationFrame(analyzeAudio);
        }
    }, [setAudioLevel, isListening]);

    const startTranscription = useCallback(async () => {
        if (!isSupported) {
            options.onError?.(new Error('Speech recognition is not supported in this browser'));
            return;
        }

        try {
            // Get microphone access for audio visualization
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true,
                }
            });
            streamRef.current = stream;

            // Set up Web Audio API for Aura visualization
            audioContextRef.current = new AudioContext();
            const source = audioContextRef.current.createMediaStreamSource(stream);
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 256;
            source.connect(analyserRef.current);

            // Set up Web Speech API for transcription
            const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognitionAPI();

            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'en-US';

            let currentChunkId = '';

            recognitionRef.current.onstart = () => {
                console.log('Speech recognition started');
                setListening(true);
                startAuraListening();
                setState('listening');

                // Start audio analysis
                animationFrameRef.current = requestAnimationFrame(analyzeAudio);
            };

            recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
                const results = event.results;

                for (let i = event.resultIndex; i < results.length; i++) {
                    const result = results[i];
                    const transcript = result[0].transcript.trim();
                    const isFinal = result.isFinal;

                    if (transcript) {
                        if (isFinal) {
                            // Final result - update or add as final
                            if (currentChunkId) {
                                updateChunk(currentChunkId, transcript, true);
                            } else {
                                const id = crypto.randomUUID();
                                addChunk({ id, text: transcript, isFinal: true, timestamp: Date.now() });
                            }
                            options.onTranscript?.(transcript, true);
                            currentChunkId = '';
                        } else {
                            // Interim result
                            if (!currentChunkId) {
                                currentChunkId = crypto.randomUUID();
                                addChunk({ id: currentChunkId, text: transcript, isFinal: false, timestamp: Date.now() });
                            } else {
                                updateChunk(currentChunkId, transcript, false);
                            }
                            options.onTranscript?.(transcript, false);
                        }
                    }
                }
            };

            recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
                console.error('Speech recognition error:', event.error);
                if (event.error !== 'no-speech' && event.error !== 'aborted') {
                    options.onError?.(new Error(`Speech recognition error: ${event.error}`));
                }
            };

            recognitionRef.current.onend = () => {
                console.log('Speech recognition ended');
                // Auto-restart if still supposed to be listening
                if (isListening && !isRestartingRef.current) {
                    isRestartingRef.current = true;
                    setTimeout(() => {
                        if (recognitionRef.current && isListening) {
                            try {
                                recognitionRef.current.start();
                            } catch (e) {
                                console.log('Could not restart recognition:', e);
                            }
                        }
                        isRestartingRef.current = false;
                    }, 100);
                }
            };

            recognitionRef.current.start();

        } catch (error) {
            console.error('Failed to start transcription:', error);
            options.onError?.(error as Error);
        }
    }, [isSupported, addChunk, updateChunk, setListening, startAuraListening, analyzeAudio, options, isListening, setState]);

    const stopTranscription = useCallback(() => {
        isRestartingRef.current = false;

        if (recognitionRef.current) {
            recognitionRef.current.onend = null; // Prevent auto-restart
            recognitionRef.current.abort();
            recognitionRef.current = null;
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }

        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }

        setListening(false);
        stopAuraListening();
        setAudioLevel(0);
        setState('idle');
    }, [setListening, stopAuraListening, setAudioLevel, setState]);

    const clearTranscript = useCallback(() => {
        clear();
    }, [clear]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopTranscription();
        };
    }, [stopTranscription]);

    return {
        startTranscription,
        stopTranscription,
        clearTranscript,
        isListening,
        isSupported,
    };
}
