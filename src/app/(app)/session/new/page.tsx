'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Upload, FileSpreadsheet, FileText, Presentation, ArrowRight, X, Check } from 'lucide-react';
import { Aura } from '@/components/aura';

interface UploadedFile {
    id: string;
    name: string;
    type: string;
    size: number;
    status: 'uploading' | 'parsing' | 'ready' | 'error';
    progress: number;
}

export default function NewSessionPage() {
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [isCreating, setIsCreating] = useState(false);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = e.target.files;
        if (!selectedFiles) return;

        const newFiles: UploadedFile[] = Array.from(selectedFiles).map((file) => ({
            id: crypto.randomUUID(),
            name: file.name,
            type: file.type,
            size: file.size,
            status: 'uploading' as const,
            progress: 0,
        }));

        setFiles((prev) => [...prev, ...newFiles]);

        // Simulate upload and parsing
        for (const file of newFiles) {
            // Simulate upload progress
            for (let i = 0; i <= 100; i += 20) {
                await new Promise((r) => setTimeout(r, 100));
                setFiles((prev) =>
                    prev.map((f) => (f.id === file.id ? { ...f, progress: i } : f))
                );
            }

            // Simulate parsing
            setFiles((prev) =>
                prev.map((f) => (f.id === file.id ? { ...f, status: 'parsing' } : f))
            );

            await new Promise((r) => setTimeout(r, 500));

            setFiles((prev) =>
                prev.map((f) => (f.id === file.id ? { ...f, status: 'ready' } : f))
            );
        }
    };

    const removeFile = (id: string) => {
        setFiles((prev) => prev.filter((f) => f.id !== id));
    };

    const handleCreateSession = async () => {
        if (!title.trim()) return;

        setIsCreating(true);

        // Simulate session creation
        await new Promise((r) => setTimeout(r, 1000));

        // Generate a session ID (in production, this comes from the database)
        const sessionId = crypto.randomUUID().slice(0, 8);

        router.push(`/session/${sessionId}/presenter`);
    };

    const getFileIcon = (type: string) => {
        if (type.includes('spreadsheet') || type.includes('excel') || type.includes('csv')) {
            return FileSpreadsheet;
        }
        if (type.includes('presentation') || type.includes('powerpoint')) {
            return Presentation;
        }
        return FileText;
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <div className="min-h-screen p-8">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-3xl font-semibold text-[var(--foreground)] mb-2">
                        Create New Session
                    </h1>
                    <p className="text-[var(--foreground-muted)]">
                        Set up your presentation and upload data files
                    </p>
                </motion.div>

                {/* Form */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-6"
                >
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                            Session Title *
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Q3 Financial Review"
                            className="w-full px-4 py-3 rounded-xl glass bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--accent-primary)]"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief description of your presentation..."
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl glass bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--accent-primary)] resize-none"
                        />
                    </div>

                    {/* File Upload */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                            Data Files
                        </label>
                        <p className="text-sm text-[var(--foreground-muted)] mb-4">
                            Upload Excel, CSV, PDF, or PowerPoint files. EchoLens will parse and index your data.
                        </p>

                        {/* Upload Zone */}
                        <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-[var(--glass-border)] rounded-xl cursor-pointer hover:border-[var(--accent-primary)]/50 transition-colors">
                            <input
                                type="file"
                                multiple
                                accept=".xlsx,.xls,.csv,.pdf,.pptx,.ppt,.json"
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                            <Upload className="w-8 h-8 text-[var(--foreground-muted)] mb-3" />
                            <span className="text-sm text-[var(--foreground-muted)]">
                                Drop files here or click to upload
                            </span>
                            <span className="text-xs text-[var(--foreground-subtle)] mt-1">
                                .xlsx, .csv, .pdf, .pptx, .json
                            </span>
                        </label>

                        {/* Uploaded Files */}
                        {files.length > 0 && (
                            <div className="mt-4 space-y-2">
                                {files.map((file) => {
                                    const Icon = getFileIcon(file.type);
                                    return (
                                        <motion.div
                                            key={file.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="flex items-center gap-3 p-3 rounded-lg glass"
                                        >
                                            <Icon className="w-5 h-5 text-[var(--accent-primary)]" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-[var(--foreground)] truncate">
                                                    {file.name}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-[var(--foreground-subtle)]">
                                                        {formatFileSize(file.size)}
                                                    </span>
                                                    {file.status === 'uploading' && (
                                                        <div className="flex-1 h-1 bg-[var(--glass-border)] rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-[var(--accent-primary)] transition-all"
                                                                style={{ width: `${file.progress}%` }}
                                                            />
                                                        </div>
                                                    )}
                                                    {file.status === 'parsing' && (
                                                        <span className="text-xs text-yellow-400">Parsing...</span>
                                                    )}
                                                    {file.status === 'ready' && (
                                                        <span className="flex items-center gap-1 text-xs text-green-400">
                                                            <Check className="w-3 h-3" />
                                                            Ready
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => removeFile(file.id)}
                                                className="p-1 text-[var(--foreground-subtle)] hover:text-red-400 transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Preview */}
                    <div className="flex items-center justify-center py-8">
                        <div className="opacity-30 hover:opacity-50 transition-opacity">
                            <Aura size={150} interactive={false} />
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="flex justify-end gap-4 pt-4">
                        <button
                            onClick={() => router.back()}
                            className="btn-secondary"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreateSession}
                            disabled={!title.trim() || isCreating}
                            className="btn-primary inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isCreating ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    Launch Session
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
