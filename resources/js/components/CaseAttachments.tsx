import React, { useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Camera, Upload, Trash2, Download, Loader2, X,
    FileText, Image, File as FileIcon, Eye, Paperclip
} from 'lucide-react';
import Swal from 'sweetalert2';

interface Attachment {
    id: number;
    name: string;
    url: string;
    size: number;
    description: string;
    mime_type?: string;
}

interface Props {
    caseId: number;
    initialAttachments?: Attachment[];
    canUpload?: boolean;
    canDelete?: boolean;
}

export default function CaseAttachments({
    caseId,
    initialAttachments = [],
    canUpload = true,
    canDelete = true
}: Props) {
    const [attachments, setAttachments] = useState<Attachment[]>(initialAttachments);
    const [uploading, setUploading] = useState(false);
    const [description, setDescription] = useState('');
    const [showCamera, setShowCamera] = useState(false);
    const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Toast para notificaciones
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
    });

    // Formatear tamaño de archivo
    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    // Obtener icono según tipo de archivo
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

    // Subir archivo desde input
    const handleFileUpload = async (file: File) => {
        if (file.size > 5 * 1024 * 1024) {
            Swal.fire('Error', 'El archivo no puede superar los 5MB', 'error');
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('description', description);

        try {
            const response = await axios.post(`/api/cases/${caseId}/attachments`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setAttachments(prev => [...prev, response.data.attachment]);
            setDescription('');
            Toast.fire({ icon: 'success', title: 'Archivo subido' });

        } catch (error: any) {
            Swal.fire('Error', error.response?.data?.message || 'No se pudo subir el archivo', 'error');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // Manejar selección de archivo
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFileUpload(file);
    };

    // Iniciar cámara
    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: false
            });
            setCameraStream(stream);
            setShowCamera(true);

            // Esperar a que el video esté listo
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

    // Detener cámara
    const stopCamera = () => {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            setCameraStream(null);
        }
        setShowCamera(false);
    };

    // Capturar foto
    const capturePhoto = async () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(video, 0, 0);

        // Convertir canvas a blob
        canvas.toBlob(async (blob) => {
            if (!blob) return;

            const file = new File([blob], `captura_${Date.now()}.jpg`, { type: 'image/jpeg' });
            stopCamera();
            await handleFileUpload(file);
        }, 'image/jpeg', 0.9);
    };

    // Eliminar archivo
    const handleDelete = async (attachment: Attachment) => {
        const result = await Swal.fire({
            icon: 'warning',
            title: '¿Eliminar archivo?',
            text: `Se eliminará "${attachment.name}"`,
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#dc3545'
        });

        if (!result.isConfirmed) return;

        try {
            await axios.delete(`/api/cases/${caseId}/attachments/${attachment.id}`);
            setAttachments(prev => prev.filter(a => a.id !== attachment.id));
            Toast.fire({ icon: 'success', title: 'Archivo eliminado' });
        } catch (error: any) {
            Swal.fire('Error', 'No se pudo eliminar el archivo', 'error');
        }
    };

    // Descargar archivo
    const handleDownload = (attachment: Attachment) => {
        window.open(`/api/cases/${caseId}/attachments/${attachment.id}/download`, '_blank');
    };

    return (
        <Card className="border-t-4 border-t-purple-600 shadow-md">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Paperclip className="w-5 h-5" />
                    Archivos Adjuntos
                    {attachments.length > 0 && (
                        <span className="ml-2 px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">
                            {attachments.length}
                        </span>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Área de subida */}
                {canUpload && (
                    <div className="space-y-3">
                        <div className="flex gap-2">
                            <Input
                                placeholder="Descripción del archivo (opcional)"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="flex-1 focus-visible:ring-[#005BBB]/30 focus-visible:border-[#005BBB] [&:-webkit-autofill]:shadow-[0_0_0_1000px_white_inset]"
                                disabled={uploading}
                            />
                        </div>

                        <div className="flex gap-2">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*,.pdf,.doc,.docx"
                                className="hidden"
                                onChange={handleFileSelect}
                                disabled={uploading}
                            />

                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="flex-1 gap-2"
                            >
                                {uploading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Upload className="w-4 h-4" />
                                )}
                                Subir Archivo
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={startCamera}
                                disabled={uploading}
                                className="flex-1 gap-2"
                            >
                                <Camera className="w-4 h-4" />
                                Tomar Foto
                            </Button>
                        </div>

                        <p className="text-xs text-gray-500">
                            Formatos: Imágenes, PDF, Word. Máximo 5MB
                        </p>
                    </div>
                )}

                {/* Modal de Cámara */}
                {showCamera && (
                    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-gray-900 rounded-lg max-w-2xl w-full overflow-hidden shadow-2xl">
                            <div className="p-3 border-b flex items-center justify-between">
                                <h3 className="font-semibold">Capturar Foto</h3>
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
                                <Button type="button" variant="outline" onClick={stopCamera}>
                                    Cancelar
                                </Button>
                                <Button type="button" onClick={capturePhoto} className="gap-2 bg-green-600 hover:bg-green-700">
                                    <Camera className="w-4 h-4" />
                                    Capturar
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Lista de archivos */}
                {attachments.length === 0 ? (
                    <div className="text-center py-6 text-gray-400">
                        <Paperclip className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p>No hay archivos adjuntos</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {attachments.map((attachment) => (
                            <div
                                key={attachment.id}
                                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border hover:border-purple-300 transition-colors"
                            >
                                {getFileIcon(attachment.name)}

                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">{attachment.name}</p>
                                    <p className="text-xs text-gray-500">
                                        {formatFileSize(attachment.size)}
                                        {attachment.description && ` • ${attachment.description}`}
                                    </p>
                                </div>

                                <div className="flex gap-1">
                                    {/* Vista previa para imágenes */}
                                    {attachment.name.match(/\.(jpg|jpeg|png|gif|webp)$/i) && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => window.open(attachment.url, '_blank')}
                                            className="h-8 w-8"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </Button>
                                    )}

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDownload(attachment)}
                                        className="h-8 w-8"
                                    >
                                        <Download className="w-4 h-4" />
                                    </Button>

                                    {canDelete && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(attachment)}
                                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
