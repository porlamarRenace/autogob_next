import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save, User, MapPin, Briefcase, Activity } from 'lucide-react';
import { Municipality, Community, Street, Citizen } from '@/types/models';

interface Props {
    initialIdentificationValue: string;
    initialNationality: string;
    onSuccess: (citizen: Citizen) => void;
    onCancel: () => void;
}

export default function CitizenForm({ initialIdentificationValue, initialNationality, onSuccess, onCancel }: Props) {
    // Listas para Selects Geográficos
    const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
    const [communities, setCommunities] = useState<Community[]>([]);
    const [streets, setStreets] = useState<Street[]>([]);

    // Estados de carga UI
    const [loadingMuni, setLoadingMuni] = useState(false);
    const [loadingComm, setLoadingComm] = useState(false);
    const [loadingStreet, setLoadingStreet] = useState(false);

    // Formulario con TODOS los campos de los modelos GO (Citizen y HealthProfile)
    const { data, setData, post, processing, errors } = useForm({
        // --- 1. DATOS PRINCIPALES ---
        nationality: initialNationality,
        identification_value: initialIdentificationValue,
        first_name: '',
        last_name: '',
        birth_date: '',
        gender: '', // M, F
        email: '',
        phone: '',

        // --- 2. DIRECCIÓN ---
        municipality_id: '',
        community_id: '',
        street_id: '', // <--- Esto es lo que guardamos en citizen.street_id
        reference_point: '',

        // --- 3. PROFESIONALES ---
        profession: '',
        education_level: '',

        // --- 4. SALUD (Mapeo de health.go) ---
        blood_type: '',
        height: '',
        weight: '',

        // Patologías Generales
        has_diabetes: false,
        has_hypertension: false,
        has_cancer: false,
        has_allergies: false,
        has_alcoholism: false,
        has_drugs: false,
        was_operated: false,

        // Patologías Específicas
        has_mental_condition: false,
        has_eye_condition: false,
        has_dental_condition: false,
        has_hereditary_condition: false,
        has_kidney_condition: false,
        has_liver_condition: false,
        has_heart_condition: false,
        has_gastro_condition: false,
        has_skin_condition: false,

        // Discapacidad
        is_disabled: false,
        disability_type: '',

        medical_history_notes: ''
    });

    useEffect(() => {
        setData(currentData => ({
            ...currentData,
            nationality: initialNationality,
            identification_value: initialIdentificationValue
        }));
    }, [initialIdentificationValue, initialNationality]);

    // Cargar Municipios al montar el componente
    useEffect(() => {
        setLoadingMuni(true);
        axios.get(route('geo.municipalities')).then(res => {
            setMunicipalities(res.data);
            setLoadingMuni(false);
        });
    }, []);

    // Manejo de cascada Geográfica
    const handleMuniChange = (value: string) => {
        setData('municipality_id', value);
        setCommunities([]); setStreets([]);
        setLoadingComm(true);
        axios.get(route('geo.communities', value)).then(res => {
            setCommunities(res.data);
            setLoadingComm(false);
        });
    };

    const handleCommChange = (value: string) => {
        setData('community_id', value);
        setStreets([]);
        setLoadingStreet(true);
        axios.get(route('geo.streets', value)).then(res => {
            setStreets(res.data);
            setLoadingStreet(false);
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Enviamos al backend
        axios.post(route('citizens.store'), data)
            .then(res => onSuccess(res.data.citizen))
            .catch(err => {
                console.error(err);
                alert("Error al guardar. Verifica que todos los campos requeridos estén llenos.");
            });
    };

    // Renderizador de un item de Switch (para limpiar código)
    const SwitchItem = ({ id, label, checked, onChange }: { id: string, label: string, checked: boolean, onChange: (v: boolean) => void }) => (
        <div className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-white dark:bg-slate-950">
            <Label htmlFor={id} className="cursor-pointer flex-1">{label}</Label>
            <Switch id={id} checked={checked} onCheckedChange={onChange} />
        </div>
    );

    return (
        <Card className="w-full shadow-lg border-t-4 border-t-blue-600">
            <CardHeader>
                <CardTitle>Registro Integral de Ciudadano</CardTitle>
                <CardDescription>Complete la información requerida en cada pestaña.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit}>
                    <Tabs defaultValue="personal" className="w-full">
                        <TabsList className="grid w-full grid-cols-4 mb-6 h-auto p-1">
                            <TabsTrigger value="personal" className="py-2 gap-2"><User size={18} /> Principales</TabsTrigger>
                            <TabsTrigger value="address" className="py-2 gap-2"><MapPin size={18} /> Dirección</TabsTrigger>
                            <TabsTrigger value="professional" className="py-2 gap-2"><Briefcase size={18} /> Profesional</TabsTrigger>
                            <TabsTrigger value="health" className="py-2 gap-2"><Activity size={18} /> Salud</TabsTrigger>
                        </TabsList>

                        {/* --- TAB 1: PERSONALES --- */}
                        <TabsContent value="personal" className="space-y-4 animate-in fade-in duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label>Documento de Identidad</Label>
                                    <div className="flex gap-2 mt-1.5">
                                        <Input value={data.nationality} disabled className="w-20 text-center bg-slate-100 font-bold" />
                                        <Input value={data.identification_value} disabled className="flex-1 bg-slate-100 font-bold" />
                                    </div>
                                </div>
                                <div>
                                    <Label>Fecha de Nacimiento</Label>
                                    <Input type="date" value={data.birth_date} onChange={e => setData('birth_date', e.target.value)} required className="mt-1.5" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><Label>Nombres</Label><Input value={data.first_name} onChange={e => setData('first_name', e.target.value)} required className="mt-1.5" /></div>
                                <div><Label>Apellidos</Label><Input value={data.last_name} onChange={e => setData('last_name', e.target.value)} required className="mt-1.5" /></div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <Label>Género</Label>
                                    <Select onValueChange={val => setData('gender', val)}>
                                        <SelectTrigger className="mt-1.5"><SelectValue placeholder="Seleccione" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="M">Masculino</SelectItem>
                                            <SelectItem value="F">Femenino</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div><Label>Teléfono</Label><Input value={data.phone} onChange={e => setData('phone', e.target.value)} className="mt-1.5" /></div>
                                <div><Label>Email</Label><Input type="email" value={data.email} onChange={e => setData('email', e.target.value)} className="mt-1.5" /></div>
                            </div>
                        </TabsContent>

                        {/* --- TAB 2: DIRECCIÓN --- */}
                        <TabsContent value="address" className="space-y-4 animate-in fade-in duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label>Municipio</Label>
                                    <Select onValueChange={handleMuniChange} disabled={loadingMuni}>
                                        <SelectTrigger className="mt-1.5"><SelectValue placeholder="Seleccione..." /></SelectTrigger>
                                        <SelectContent>{municipalities.map(m => <SelectItem key={m.id} value={m.id.toString()}>{m.name}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Comunidad</Label>
                                    <Select onValueChange={handleCommChange} disabled={!data.municipality_id || loadingComm}>
                                        <SelectTrigger className="mt-1.5"><SelectValue placeholder="Seleccione..." /></SelectTrigger>
                                        <SelectContent>{communities.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div>
                                <Label>Calle / Vereda</Label>
                                <Select onValueChange={val => setData('street_id', val)} disabled={!data.community_id || loadingStreet}>
                                    <SelectTrigger className="mt-1.5"><SelectValue placeholder="Seleccione..." /></SelectTrigger>
                                    <SelectContent>{streets.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Punto de Referencia / Nro Casa</Label>
                                <Textarea value={data.reference_point} onChange={e => setData('reference_point', e.target.value)} className="mt-1.5" placeholder="Detalles visuales de la vivienda..." />
                            </div>
                        </TabsContent>

                        {/* --- TAB 3: PROFESIONAL --- */}
                        <TabsContent value="professional" className="space-y-4 animate-in fade-in duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-md bg-slate-50 dark:bg-slate-900">
                                <div>
                                    <Label>Profesión / Ocupación</Label>
                                    <Input value={data.profession} onChange={e => setData('profession', e.target.value)} className="mt-1.5" placeholder="Ej: Ingeniero, Docente..." />
                                </div>
                                <div>
                                    <Label>Nivel Educativo</Label>
                                    <Select onValueChange={val => setData('education_level', val)}>
                                        <SelectTrigger className="mt-1.5"><SelectValue placeholder="Seleccione" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Primaria">Primaria</SelectItem>
                                            <SelectItem value="Bachiller">Bachiller</SelectItem>
                                            <SelectItem value="TSU">TSU</SelectItem>
                                            <SelectItem value="Universitario">Universitario</SelectItem>
                                            <SelectItem value="Postgrado">Postgrado</SelectItem>
                                            <SelectItem value="Ninguno">Ninguno</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </TabsContent>

                        {/* --- TAB 4: SALUD (Full Detail) --- */}
                        <TabsContent value="health" className="space-y-6 animate-in fade-in duration-300">
                            {/* Antropometría */}
                            <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-md">
                                <div><Label>Tipo Sangre</Label><Input value={data.blood_type} onChange={e => setData('blood_type', e.target.value)} placeholder="O+" className="mt-1" /></div>
                                <div><Label>Peso (kg)</Label><Input type="number" value={data.weight} onChange={e => setData('weight', e.target.value)} className="mt-1" /></div>
                                <div><Label>Altura (cm)</Label><Input type="number" value={data.height} onChange={e => setData('height', e.target.value)} className="mt-1" /></div>
                            </div>

                            {/* Grupo: Hábitos y Condiciones Generales */}
                            <div>
                                <h4 className="mb-3 text-sm font-semibold text-slate-500 uppercase tracking-wider">Condiciones Generales</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <SwitchItem id="diabetes" label="Diabetes" checked={data.has_diabetes} onChange={c => setData('has_diabetes', c)} />
                                    <SwitchItem id="hipertension" label="Hipertensión" checked={data.has_hypertension} onChange={c => setData('has_hypertension', c)} />
                                    <SwitchItem id="cancer" label="Cáncer" checked={data.has_cancer} onChange={c => setData('has_cancer', c)} />
                                    <SwitchItem id="alergias" label="Alergias" checked={data.has_allergies} onChange={c => setData('has_allergies', c)} />
                                    <SwitchItem id="alcohol" label="Alcoholismo" checked={data.has_alcoholism} onChange={c => setData('has_alcoholism', c)} />
                                    <SwitchItem id="drogas" label="Uso de Drogas" checked={data.has_drugs} onChange={c => setData('has_drugs', c)} />
                                    <SwitchItem id="operado" label="Fue Operado" checked={data.was_operated} onChange={c => setData('was_operated', c)} />
                                </div>
                            </div>

                            {/* Grupo: Patologías Específicas */}
                            <div>
                                <h4 className="mb-3 text-sm font-semibold text-slate-500 uppercase tracking-wider">Sistemas Afectados / Patologías</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <SwitchItem id="cardiaco" label="Cardíacas" checked={data.has_heart_condition} onChange={c => setData('has_heart_condition', c)} />
                                    <SwitchItem id="renal" label="Renales" checked={data.has_kidney_condition} onChange={c => setData('has_kidney_condition', c)} />
                                    <SwitchItem id="hepatico" label="Hepáticas" checked={data.has_liver_condition} onChange={c => setData('has_liver_condition', c)} />
                                    <SwitchItem id="mental" label="Mentales" checked={data.has_mental_condition} onChange={c => setData('has_mental_condition', c)} />
                                    <SwitchItem id="visual" label="Oftalmológicas" checked={data.has_eye_condition} onChange={c => setData('has_eye_condition', c)} />
                                    <SwitchItem id="dental" label="Dentales" checked={data.has_dental_condition} onChange={c => setData('has_dental_condition', c)} />
                                    <SwitchItem id="gastro" label="Gastrointestinales" checked={data.has_gastro_condition} onChange={c => setData('has_gastro_condition', c)} />
                                    <SwitchItem id="piel" label="Dermatológicas" checked={data.has_skin_condition} onChange={c => setData('has_skin_condition', c)} />
                                    <SwitchItem id="hereditario" label="Hereditarias" checked={data.has_hereditary_condition} onChange={c => setData('has_hereditary_condition', c)} />
                                </div>
                            </div>

                            {/* Discapacidad */}
                            <div className="p-4 border rounded-md bg-orange-50 dark:bg-orange-950/20 border-orange-200">
                                <div className="flex items-center space-x-2 mb-4">
                                    <Switch id="discapacidad" checked={data.is_disabled} onCheckedChange={(c) => setData('is_disabled', c)} />
                                    <Label htmlFor="discapacidad" className="font-bold cursor-pointer">¿Posee alguna discapacidad?</Label>
                                </div>
                                {data.is_disabled && (
                                    <div className="animate-in slide-in-from-top-2">
                                        <Label>Especifique Tipo / Grado</Label>
                                        <Input value={data.disability_type} onChange={e => setData('disability_type', e.target.value)} placeholder="Ej: Motora, Visual, Auditiva..." className="mt-1" />
                                    </div>
                                )}
                            </div>

                            <div>
                                <Label>Observaciones Médicas / Notas Adicionales</Label>
                                <Textarea value={data.medical_history_notes} onChange={e => setData('medical_history_notes', e.target.value)} className="mt-1" placeholder="Detalles importantes..." />
                            </div>
                        </TabsContent>
                    </Tabs>

                    <div className="flex justify-end gap-3 mt-8 pt-4 border-t sticky bottom-0 bg-white/90 backdrop-blur-sm dark:bg-slate-950/90 py-4 z-10">
                        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
                        <Button type="submit" disabled={processing} className="bg-blue-600 hover:bg-blue-700 min-w-[200px]">
                            {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Guardar Registro
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}