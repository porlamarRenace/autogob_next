import React, { useState, useRef } from 'react';
import { Upload, X, File, Download, Image, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import axios from 'axios';

interface Attachment {
    id: number;
    name: string;
    url: string;
    size: number;
    description?: string;
}

interface FileUploadManagerProps {
    caseId: number;
    initialAttachments?: Attachment[];
    onAttachmentsChange?: (attachments: Attachment[]) => void;
}

export default function FileUploadManager({ caseId, initialAttachments = [], onAttachmentsChange }: FileUploadManagerProps) {
    const [attachments, setAttachments] = useState<Attachment[]>(initialAttachments);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [description, setDescription] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const getFileIcon = (filename: string) => {
        const ext = filename.split('.').pop()?.toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif'].includes(ext || '')) return <Image className="w-5 h-5 text-blue-500" />;
        if (['pdf', 'doc', 'docx'].includes(ext || '')) return <FileText className="w-5 h-5 text-red-500" />;
        return <File className="w-5 h-5 text-slate-500" />;
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file size (2MB max)
        if (file.size > 2 * 1024 * 1024) {
            setError('El archivo no puede superar los 2MB');
            return;
        }

        setError(null);
        setIsUploading(true);

        const formData = new FormData();
        formData.append('file', file);
        if (description) formData.append('description', description);

        try {
            const response = await axios.post(`/api/cases/${caseId}/attachments`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const newAttachment = response.data.attachment;
            const updatedAttachments = [...attachments, newAttachment];
            setAttachments(updatedAttachments);
            onAttachmentsChange?.(updatedAttachments);
            setDescription('');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error al subir el archivo');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDelete = async (mediaId: number) => {
        if (!confirm('¿Está seguro de eliminar este archivo?')) return;

        try {
            await axios.delete(`/api/cases/${caseId}/attachments/${mediaId}`);
            const updatedAttachments = attachments.filter(a => a.id !== mediaId);
            setAttachments(updatedAttachments);
            onAttachmentsChange?.(updatedAttachments);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error al eliminar el archivo');
        }
    };

    return (
        <div className="space-y-4">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Archivos Adjuntos
            </label>

            {/* Upload section */}
            <div className="border-2 border-dashed border-slate-200 dark:border-neutral-700 rounded-lg p-4 bg-slate-50 dark:bg-neutral-900">
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                    <div className="flex-1 space-y-2">
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Descripción del archivo (opcional)"
                            className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-800"
                        />
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                    >
                        {isUploading ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Subiendo...</>
                        ) : (
                            <><Upload className="w-4 h-4 mr-2" /> Adjuntar Archivo</>
                        )}
                    </Button>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                    Formatos permitidos: JPG, PNG, PDF, DOC. Máximo 2MB por archivo.
                </p>
            </div>

            {/* Error message */}
            {error && (
                <p className="text-sm text-red-500">{error}</p>
            )}

            {/* Attachments list */}
            {attachments.length > 0 && (
                <div className="border rounded-lg overflow-hidden divide-y dark:divide-neutral-700">
                    {attachments.map((attachment) => (
                        <div key={attachment.id} className="flex items-center justify-between p-3 bg-white dark:bg-neutral-800 hover:bg-slate-50 dark:hover:bg-neutral-750">
                            <div className="flex items-center gap-3 overflow-hidden">
                                {getFileIcon(attachment.name)}
                                <div className="overflow-hidden">
                                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                                        {attachment.name}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {formatFileSize(attachment.size)}
                                        {attachment.description && ` • ${attachment.description}`}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                                <a
                                    href={`/api/cases/${caseId}/attachments/${attachment.id}/download`}
                                    className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded dark:hover:bg-blue-900/20"
                                    title="Descargar"
                                >
                                    <Download className="w-4 h-4" />
                                </a>
                                <button
                                    type="button"
                                    onClick={() => handleDelete(attachment.id)}
                                    className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded dark:hover:bg-red-900/20"
                                    title="Eliminar"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
