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
import { Loader2, Save, User, MapPin, Briefcase, Activity, Pencil } from 'lucide-react';
import { Municipality, Community, Street, Citizen } from '@/types/models';

interface Props {
    initialIdentificationValue?: string;
    initialNationality?: string;
    citizenToEdit?: Citizen | null;
    onSuccess: (citizen: Citizen) => void;
    onCancel: () => void;
}

// --- UTILIDAD: CORREGIR FORMATO DE FECHA ---
const formatDateForInput = (dateString?: string) => {
    if (!dateString) return '';
    // Intenta cortar la parte del tiempo si viene como '2000-01-01 00:00:00' o ISO
    return dateString.split('T')[0].split(' ')[0];
};

export default function CitizenForm({
    initialIdentificationValue = '',
    initialNationality = 'V',
    citizenToEdit = null,
    onSuccess,
    onCancel
}: Props) {

    // --- ESTADOS GEOGRÁFICOS ---
    const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
    const [communities, setCommunities] = useState<Community[]>([]);
    const [streets, setStreets] = useState<Street[]>([]);

    const [loadingMuni, setLoadingMuni] = useState(false);
    const [loadingComm, setLoadingComm] = useState(false);
    const [loadingStreet, setLoadingStreet] = useState(false);

    // --- FORMULARIO PRINCIPAL ---
    const { data, setData, put, post, processing, errors } = useForm({
        // 1. PERSONALES
        nationality: citizenToEdit?.nationality || initialNationality,
        identification_value: citizenToEdit?.identification_value || initialIdentificationValue,
        first_name: citizenToEdit?.first_name || '',
        last_name: citizenToEdit?.last_name || '',
        // APLICAMOS LA CORRECCIÓN DE FECHA AQUÍ
        birth_date: formatDateForInput(citizenToEdit?.birth_date) || '',
        gender: citizenToEdit?.gender || '',
        email: citizenToEdit?.email || '',
        phone: citizenToEdit?.phone || '',

        // 2. DIRECCIÓN
        // Nota: En edición simple, el usuario deberá re-seleccionar la cascada si quiere cambiar la calle.
        municipality_id: '',
        community_id: '',
        street_id: citizenToEdit?.street_id?.toString() || '',
        reference_point: citizenToEdit?.reference_point || '',
        street_name: citizenToEdit?.street_name || '',
        community_name: citizenToEdit?.community_name || '',
        municipality_name: citizenToEdit?.municipality_name || '',

        // 3. PROFESIONALES (Mapeo desde social_data json)
        // @ts-ignore (Si TS se queja del acceso dinámico al JSON)
        profession: citizenToEdit?.social_data?.profession || '',
        // @ts-ignore
        education_level: citizenToEdit?.social_data?.education_level || '',

        // 4. SALUD - MÉTRICAS
        blood_type: citizenToEdit?.health_profile?.blood_type || '',
        height: citizenToEdit?.health_profile?.height || '',
        weight: citizenToEdit?.health_profile?.weight || '',
        medical_history_notes: citizenToEdit?.health_profile?.notes || '',

        // 5. SALUD - BOOLEANOS (Todos los Switches)
        // Generales
        has_diabetes: citizenToEdit?.health_profile?.has_diabetes || false,
        has_hypertension: citizenToEdit?.health_profile?.has_hypertension || false,
        has_cancer: citizenToEdit?.health_profile?.has_cancer || false,
        has_allergies: citizenToEdit?.health_profile?.has_allergies || false,
        has_alcoholism: citizenToEdit?.health_profile?.has_alcoholism || false,
        has_drugs: citizenToEdit?.health_profile?.has_drugs || false,
        was_operated: citizenToEdit?.health_profile?.was_operated || false,

        // Específicas
        has_mental_condition: citizenToEdit?.health_profile?.has_mental_condition || false,
        has_eye_condition: citizenToEdit?.health_profile?.has_eye_condition || false,
        has_dental_condition: citizenToEdit?.health_profile?.has_dental_condition || false,
        has_hereditary_condition: citizenToEdit?.health_profile?.has_hereditary_condition || false,
        has_kidney_condition: citizenToEdit?.health_profile?.has_kidney_condition || false,
        has_liver_condition: citizenToEdit?.health_profile?.has_liver_condition || false,
        has_heart_condition: citizenToEdit?.health_profile?.has_heart_condition || false,
        has_gastro_condition: citizenToEdit?.health_profile?.has_gastro_condition || false,
        has_skin_condition: citizenToEdit?.health_profile?.has_skin_condition || false,

        // Discapacidad
        is_disabled: citizenToEdit?.health_profile?.is_disabled || false,
        disability_type: citizenToEdit?.health_profile?.disability_type || '',
    });

    // --- EFECTOS DE CARGA ---
    useEffect(() => {
        setLoadingMuni(true);
        axios.get(route('geo.municipalities')).then(res => {
            setMunicipalities(res.data);
            setLoadingMuni(false);
        });
    }, []);

    // Handlers de Cascada
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

        // Validación básica de campos requeridos que no son HTML5 required
        if (!data.street_id && !citizenToEdit) {
            alert("Por favor selecciona una calle.");
            return;
        }

        if (citizenToEdit) {
            // EDITAR
            axios.put(route('citizens.update', citizenToEdit.id), data)
                .then(res => onSuccess(res.data.citizen))
                .catch(err => {
                    console.error(err);
                    alert("Error al actualizar. Revisa la consola.");
                });
        } else {
            // CREAR
            axios.post(route('citizens.store'), data)
                .then(res => onSuccess(res.data.citizen))
                .catch(err => {
                    console.error(err);
                    alert("Error al guardar. Revisa la consola.");
                });
        }
    };

    // --- COMPONENTE AUXILIAR PARA SWITCHES ---
    const SwitchGroup = ({ id, label, checked, onChange, icon = null }: any) => (
        <div className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${checked ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20' : 'bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800'}`}>
            <div className="flex items-center gap-2">
                {icon}
                <Label htmlFor={id} className="cursor-pointer font-medium">{label}</Label>
            </div>
            <Switch id={id} checked={checked} onCheckedChange={onChange} />
        </div>
    );

    return (
        <Card className={`w-full shadow-lg border-t-4 ${citizenToEdit ? 'border-t-orange-500' : 'border-t-blue-600'}`}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    {citizenToEdit ? <Pencil className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                    {citizenToEdit ? 'Editar Datos del Ciudadano' : 'Registro Integral'}
                </CardTitle>
                <CardDescription>
                    {citizenToEdit ? 'Modifique los datos y guarde los cambios.' : 'Complete todas las pestañas para un registro exitoso.'}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit}>
                    <Tabs defaultValue="personal" className="w-full">
                        <TabsList className="grid w-full grid-cols-4 mb-6">
                            <TabsTrigger value="personal" className="gap-2"><User size={16} className="hidden sm:block" /> Personal</TabsTrigger>
                            <TabsTrigger value="address" className="gap-2"><MapPin size={16} className="hidden sm:block" /> Dirección</TabsTrigger>
                            <TabsTrigger value="professional" className="gap-2"><Briefcase size={16} className="hidden sm:block" /> Social</TabsTrigger>
                            <TabsTrigger value="health" className="gap-2"><Activity size={16} className="hidden sm:block" /> Salud</TabsTrigger>
                        </TabsList>

                        {/* --- 1. PERSONAL --- */}
                        <TabsContent value="personal" className="space-y-4 animate-in fade-in zoom-in-95">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label>Identificación</Label>
                                    <div className="flex gap-2 mt-1.5">
                                        <Input value={data.nationality} disabled className="w-16 text-center bg-slate-100" />
                                        <Input value={data.identification_value} disabled={!!citizenToEdit} className={`flex-1 ${!!citizenToEdit ? 'bg-slate-100' : ''}`} />
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
                                    <Select value={data.gender} onValueChange={val => setData('gender', val)}>
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

                        {/* --- 2. DIRECCIÓN --- */}
                        <TabsContent value="address" className="space-y-4 animate-in fade-in zoom-in-95">
                            {citizenToEdit && (
                                <div className="p-3 bg-yellow-50 text-yellow-800 text-sm rounded border border-yellow-200">
                                    <MapPin className="inline w-4 h-4 mr-2" />
                                    Dirección actual guardada (Calle: {citizenToEdit.street_name}, Comunidad: {citizenToEdit.community_name}, Municipio: {citizenToEdit.municipality_name}). Seleccione abajo solo si desea cambiarla.
                                </div>
                            )}
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
                                <Select value={data.street_id} onValueChange={val => setData('street_id', val)} disabled={!data.community_id && !citizenToEdit}>
                                    <SelectTrigger className="mt-1.5"><SelectValue placeholder={data.street_id ? "Calle Seleccionada" : "Seleccione..."} /></SelectTrigger>
                                    <SelectContent>{streets.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Punto de Referencia / Nro Casa</Label>
                                <Textarea value={data.reference_point} onChange={e => setData('reference_point', e.target.value)} className="mt-1.5" />
                            </div>
                        </TabsContent>

                        {/* --- 3. PROFESIONAL --- */}
                        <TabsContent value="professional" className="space-y-4 animate-in fade-in zoom-in-95">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-md bg-slate-50 dark:bg-slate-900">
                                <div>
                                    <Label>Profesión / Ocupación</Label>
                                    <Input value={data.profession} onChange={e => setData('profession', e.target.value)} className="mt-1.5" placeholder="Ej: Ingeniero, Docente..." />
                                </div>
                                <div>
                                    <Label>Nivel Educativo</Label>
                                    <Select value={data.education_level} onValueChange={v => setData('education_level', v)}>
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

                        {/* --- 4. SALUD (MEGA TAB) --- */}
                        <TabsContent value="health" className="space-y-6 animate-in fade-in zoom-in-95">
                            {/* Antropometría */}
                            <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-md border">
                                <div><Label>Tipo Sangre</Label><Input value={data.blood_type} onChange={e => setData('blood_type', e.target.value)} placeholder="O+" className="mt-1" /></div>
                                <div><Label>Peso (kg)</Label><Input type="number" value={data.weight} onChange={e => setData('weight', e.target.value)} className="mt-1" /></div>
                                <div><Label>Altura (cm)</Label><Input type="number" value={data.height} onChange={e => setData('height', e.target.value)} className="mt-1" /></div>
                            </div>

                            {/* Sección: Discapacidad */}
                            <div className={`p-4 border rounded-md transition-colors ${data.is_disabled ? 'bg-orange-50 border-orange-200' : 'bg-slate-50 dark:bg-neutral-800'}`}>
                                <div className="flex items-center space-x-2 mb-2">
                                    <Switch id="discapacidad" checked={data.is_disabled} onCheckedChange={(c) => setData('is_disabled', c)} />
                                    <Label htmlFor="discapacidad" className="font-bold cursor-pointer text-base">¿Posee alguna discapacidad?</Label>
                                </div>
                                {data.is_disabled && (
                                    <div className="animate-in slide-in-from-top-2 ml-12">
                                        <Label>Especifique Tipo / Grado</Label>
                                        <Input value={data.disability_type} onChange={e => setData('disability_type', e.target.value)} placeholder="Ej: Motora, Visual, Auditiva..." className="mt-1" autoFocus />
                                    </div>
                                )}
                            </div>

                            <div className="h-px bg-slate-200 dark:bg-slate-700"></div>

                            {/* Sección: Antecedentes y Patologías */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wide">Patologías Crónicas y Hábitos</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                    <SwitchGroup id="diab" label="Diabetes" checked={data.has_diabetes} onChange={(c: boolean) => setData('has_diabetes', c)} />
                                    <SwitchGroup id="hiper" label="Hipertensión" checked={data.has_hypertension} onChange={(c: boolean) => setData('has_hypertension', c)} />
                                    <SwitchGroup id="can" label="Cáncer" checked={data.has_cancer} onChange={(c: boolean) => setData('has_cancer', c)} />
                                    <SwitchGroup id="alerg" label="Alergias" checked={data.has_allergies} onChange={(c: boolean) => setData('has_allergies', c)} />
                                    <SwitchGroup id="alco" label="Alcoholismo" checked={data.has_alcoholism} onChange={(c: boolean) => setData('has_alcoholism', c)} />
                                    <SwitchGroup id="drog" label="Uso Drogas" checked={data.has_drugs} onChange={(c: boolean) => setData('has_drugs', c)} />
                                    <SwitchGroup id="oper" label="Fue Operado" checked={data.was_operated} onChange={(c: boolean) => setData('was_operated', c)} />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wide">Sistemas Afectados</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                    <SwitchGroup id="card" label="Cardíacas" checked={data.has_heart_condition} onChange={(c: boolean) => setData('has_heart_condition', c)} />
                                    <SwitchGroup id="ren" label="Renales" checked={data.has_kidney_condition} onChange={(c: boolean) => setData('has_kidney_condition', c)} />
                                    <SwitchGroup id="hep" label="Hepáticas" checked={data.has_liver_condition} onChange={(c: boolean) => setData('has_liver_condition', c)} />
                                    <SwitchGroup id="gastr" label="Gástricas" checked={data.has_gastro_condition} onChange={(c: boolean) => setData('has_gastro_condition', c)} />
                                    <SwitchGroup id="ment" label="Mentales" checked={data.has_mental_condition} onChange={(c: boolean) => setData('has_mental_condition', c)} />
                                    <SwitchGroup id="vis" label="Visuales" checked={data.has_eye_condition} onChange={(c: boolean) => setData('has_eye_condition', c)} />
                                    <SwitchGroup id="dent" label="Dentales" checked={data.has_dental_condition} onChange={(c: boolean) => setData('has_dental_condition', c)} />
                                    <SwitchGroup id="piel" label="Dermatológicas" checked={data.has_skin_condition} onChange={(c: boolean) => setData('has_skin_condition', c)} />
                                    <SwitchGroup id="hered" label="Hereditarias" checked={data.has_hereditary_condition} onChange={(c: boolean) => setData('has_hereditary_condition', c)} />
                                </div>
                            </div>

                            <div>
                                <Label>Observaciones Médicas / Notas Adicionales</Label>
                                <Textarea
                                    value={data.medical_history_notes}
                                    onChange={e => setData('medical_history_notes', e.target.value)}
                                    className="mt-1 min-h-[100px]"
                                    placeholder="Detalles importantes sobre tratamientos actuales o condiciones..."
                                />
                            </div>
                        </TabsContent>
                    </Tabs>

                    {/* --- BOTONES DE ACCIÓN --- */}
                    <div className="flex justify-end gap-3 mt-8 pt-4 border-t sticky bottom-0 bg-white/95 backdrop-blur dark:bg-slate-950/95 py-4 z-10">
                        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
                        <Button
                            type="submit"
                            disabled={processing}
                            className={`min-w-[200px] ${citizenToEdit ? "bg-orange-600 hover:bg-orange-700" : "bg-blue-600 hover:bg-blue-700"}`}
                        >
                            {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (citizenToEdit ? <Pencil className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />)}
                            {citizenToEdit ? 'Actualizar Datos' : 'Guardar Registro'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}