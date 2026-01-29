import React, { useState, useRef } from 'react';
import { Camera, Upload, X, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import Swal from 'sweetalert2';

interface PhotoUploadProps {
    citizenId: number;
    currentPhotoUrl?: string | null;
    onPhotoChange?: (newUrl: string | null) => void;
}

export default function PhotoUpload({ citizenId, currentPhotoUrl, onPhotoChange }: PhotoUploadProps) {
    const [photoUrl, setPhotoUrl] = useState<string | null>(currentPhotoUrl || null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showCamera, setShowCamera] = useState(false);
    const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Subir archivo (desde file input o captura de cámara)
    const uploadPhoto = async (file: File) => {
        if (file.size > 2 * 1024 * 1024) {
            setError('El archivo no puede superar los 2MB');
            return;
        }

        if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
            setError('Solo se permiten archivos JPG, JPEG o PNG');
            return;
        }

        setError(null);
        setIsUploading(true);

        const formData = new FormData();
        formData.append('photo', file);

        try {
            const response = await axios.post(`/api/citizens/${citizenId}/photo`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setPhotoUrl(response.data.photo_url);
            onPhotoChange?.(response.data.photo_url);

            Swal.fire({
                icon: 'success',
                title: 'Foto actualizada',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 2000
            });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error al subir la foto');
        } finally {
            setIsUploading(false);
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            await uploadPhoto(file);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // Iniciar cámara
    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
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

    // Detener cámara
    const stopCamera = () => {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            setCameraStream(null);
        }
        setShowCamera(false);
    };

    // Capturar foto desde cámara
    const capturePhoto = async () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(video, 0, 0);

        canvas.toBlob(async (blob) => {
            if (!blob) return;

            const file = new File([blob], `foto_ciudadano_${Date.now()}.jpg`, { type: 'image/jpeg' });
            stopCamera();
            await uploadPhoto(file);
        }, 'image/jpeg', 0.9);
    };

    const handleDeletePhoto = async () => {
        const result = await Swal.fire({
            icon: 'warning',
            title: '¿Eliminar foto?',
            text: 'Esta acción no se puede deshacer',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#dc3545'
        });

        if (!result.isConfirmed) return;

        setIsUploading(true);
        try {
            await axios.delete(`/api/citizens/${citizenId}/photo`);
            setPhotoUrl(null);
            onPhotoChange?.(null);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error al eliminar la foto');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-3">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Foto del Ciudadano <span className="text-red-500">*</span>
            </label>

            <div className="flex items-center gap-4">
                {/* Photo Preview */}
                <div className={`relative w-24 h-24 rounded-full overflow-hidden border-2 flex items-center justify-center ${!photoUrl ? 'bg-amber-50 border-amber-300 dark:bg-amber-900/20' : 'bg-slate-100 border-slate-200 dark:bg-neutral-800 dark:border-neutral-700'
                    }`}>
                    {photoUrl ? (
                        <img
                            src={photoUrl}
                            alt="Foto ciudadano"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="flex flex-col items-center">
                            <User className="w-10 h-10 text-amber-400" />
                            <span className="text-[10px] text-amber-600">Requerida</span>
                        </div>
                    )}

                    {isUploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <Loader2 className="w-6 h-6 animate-spin text-white" />
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept="image/jpeg,image/jpg,image/png"
                        className="hidden"
                    />

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="gap-1"
                    >
                        <Upload className="w-4 h-4" />
                        {photoUrl ? 'Cambiar' : 'Subir'}
                    </Button>

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={startCamera}
                        disabled={isUploading}
                        className="gap-1"
                    >
                        <Camera className="w-4 h-4" />
                        Cámara
                    </Button>

                    {photoUrl && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleDeletePhoto}
                            disabled={isUploading}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 gap-1"
                        >
                            <X className="w-4 h-4" />
                            Eliminar
                        </Button>
                    )}
                </div>
            </div>

            {/* Error message */}
            {error && (
                <p className="text-sm text-red-500">{error}</p>
            )}

            {/* Size hint */}
            <p className="text-xs text-slate-500 dark:text-slate-400">
                Formatos: JPG, PNG. Tamaño máximo: 2MB
            </p>

            {/* Camera Modal */}
            {showCamera && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-lg max-w-lg w-full overflow-hidden shadow-2xl">
                        <div className="p-3 border-b flex items-center justify-between">
                            <h3 className="font-semibold">Capturar Foto</h3>
                            <Button type="button" variant="ghost" size="icon" onClick={stopCamera}>
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        <div className="relative bg-black aspect-square max-h-80">
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
        </div>
    );
}
