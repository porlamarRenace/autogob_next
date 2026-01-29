import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Camera, Upload, Trash2, Loader2, X,
    FileText, Image, File as FileIcon, Paperclip
} from 'lucide-react';
import Swal from 'sweetalert2';

interface PendingFile {
    id: string;
    file: File;
    name: string;
    size: number;
    description: string;
    preview?: string;
}

interface Props {
    onFilesChange: (files: PendingFile[]) => void;
    pendingFiles: PendingFile[];
}

/**
 * Componente para adjuntar archivos ANTES de crear el caso
 * Los archivos se guardan en estado local y se suben después de crear el caso
 */
export default function PendingAttachments({ onFilesChange, pendingFiles }: Props) {
    const [description, setDescription] = useState('');
    const [showCamera, setShowCamera] = useState(false);
    const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
    });

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const getFileIcon = (filename: string) => {
        const ext = filename.split('.').pop()?.toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
            return <Image className="w-5 h-5 text-blue-500" />;
        }
        if (['pdf'].includes(ext || '')) {
            return <FileText className="w-5 h-5 text-red-500" />;
        }
        return <FileIcon className="w-5 h-5 text-gray-500" />;
    };

    const addFile = (file: File) => {
        if (file.size > 5 * 1024 * 1024) {
            Swal.fire('Error', 'El archivo no puede superar los 5MB', 'error');
            return;
        }

        // Crear preview para imágenes
        let preview: string | undefined;
        if (file.type.startsWith('image/')) {
            preview = URL.createObjectURL(file);
        }

        const newFile: PendingFile = {
            id: `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            file,
            name: file.name,
            size: file.size,
            description: description,
            preview
        };

        onFilesChange([...pendingFiles, newFile]);
        setDescription('');
        Toast.fire({ icon: 'success', title: 'Archivo agregado' });
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            addFile(file);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: false
            });
            setCameraStream(stream);
            setShowCamera(true);

            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play();
                }
            }, 100);

        } catch (error: any) {
            console.error('Camera error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Cámara no disponible',
                text: 'No se pudo acceder a la cámara. Verifique los permisos del navegador.'
            });
        }
    };

    const stopCamera = () => {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            setCameraStream(null);
        }
        setShowCamera(false);
    };

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(video, 0, 0);

        canvas.toBlob((blob) => {
            if (!blob) return;

            const file = new File([blob], `captura_${Date.now()}.jpg`, { type: 'image/jpeg' });
            stopCamera();
            addFile(file);
        }, 'image/jpeg', 0.9);
    };

    const removeFile = (id: string) => {
        const fileToRemove = pendingFiles.find(f => f.id === id);
        if (fileToRemove?.preview) {
            URL.revokeObjectURL(fileToRemove.preview);
        }
        onFilesChange(pendingFiles.filter(f => f.id !== id));
    };

    return (
        <div className="space-y-4 p-4 bg-slate-50 dark:bg-neutral-900 rounded-lg border border-slate-200 dark:border-neutral-800">
            <div className="flex items-center gap-2">
                <Paperclip className="w-5 h-5 text-purple-600" />
                <Label className="font-semibold">Documentos de Soporte</Label>
                {pendingFiles.length > 0 && (
                    <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">
                        {pendingFiles.length}
                    </span>
                )}
            </div>

            {/* Controles de subida */}
            <div className="space-y-2">
                <Input
                    placeholder="Descripción del documento (ej: Informe médico, Receta...)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="text-sm"
                />

                <div className="flex gap-2">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,.pdf,.doc,.docx"
                        className="hidden"
                        onChange={handleFileSelect}
                    />

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 gap-2"
                    >
                        <Upload className="w-4 h-4" />
                        Subir Archivo
                    </Button>

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); startCamera(); }}
                        className="flex-1 gap-2"
                    >
                        <Camera className="w-4 h-4" />
                        Tomar Foto
                    </Button>
                </div>

                <p className="text-xs text-gray-500">
                    Adjunte recetas, informes, documentos de respaldo. Máximo 5MB por archivo.
                </p>
            </div>

            {/* Lista de archivos pendientes */}
            {pendingFiles.length > 0 && (
                <div className="space-y-2 mt-3">
                    {pendingFiles.map((pf) => (
                        <div
                            key={pf.id}
                            className="flex items-center gap-3 p-2 bg-white dark:bg-gray-800 rounded-md border"
                        >
                            {pf.preview ? (
                                <img src={pf.preview} alt={pf.name} className="w-10 h-10 object-cover rounded" />
                            ) : (
                                getFileIcon(pf.name)
                            )}

                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{pf.name}</p>
                                <p className="text-xs text-gray-500">
                                    {formatFileSize(pf.size)}
                                    {pf.description && ` • ${pf.description}`}
                                </p>
                            </div>

                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeFile(pf.id)}
                                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal de Cámara */}
            {showCamera && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-lg max-w-2xl w-full overflow-hidden shadow-2xl">
                        <div className="p-3 border-b flex items-center justify-between">
                            <h3 className="font-semibold">Capturar Documento</h3>
                            <Button type="button" variant="ghost" size="icon" onClick={stopCamera}>
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        <div className="relative bg-black aspect-video">
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover"
                            />
                            <canvas ref={canvasRef} className="hidden" />
                        </div>

                        <div className="p-4 flex justify-center gap-3">
                            <Button type="button" variant="outline" onClick={(e) => { e.preventDefault(); e.stopPropagation(); stopCamera(); }}>
                                Cancelar
                            </Button>
                            <Button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); capturePhoto(); }} className="gap-2 bg-green-600 hover:bg-green-700">
                                <Camera className="w-4 h-4" />
                                Capturar
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
