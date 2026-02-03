export interface User {
    id: number;
    name: string;
    email: string;
    roles?: string[];
}

export interface Citizen {
    id: number;
    nationality: 'V' | 'E';
    identification_value: string;
    first_name: string;
    last_name: string;
    full_name?: string;
    email?: string;
    birth_date: string;
    age?: number;
    is_minor?: boolean;
    gender: 'M' | 'F';
    phone?: string;
    reference_point?: string;
    street_id?: number;
    photo?: string;
    photo_url?: string | null;
    representative_id?: number;
    representative?: Citizen;
    social_data?: Record<string, any>;
    health_profile?: HealthProfile;
    street_name?: string;
    community_name?: string;
    municipality_name?: string;
}

export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'O+' | 'O-' | 'AB+' | 'AB-';

export interface HealthProfile {
    id: number;
    citizen_id: number;
    blood_type?: BloodType;
    height: number;
    weight: number;
    medical_history_notes: string;
    has_diabetes: boolean;
    has_hypertension: boolean;
    has_cancer: boolean;
    has_allergies: boolean;
    has_alcoholism: boolean;
    has_drugs: boolean;
    was_operated: boolean;
    has_mental_condition: boolean;
    has_eye_condition: boolean;
    has_dental_condition: boolean;
    has_hereditary_condition: boolean;
    has_kidney_condition: boolean;
    has_liver_condition: boolean;
    has_heart_condition: boolean;
    has_gastro_condition: boolean;
    has_skin_condition: boolean;
    is_disabled: boolean;
    disability_type: string;
    notes?: string;
}

export interface Category {
    id: number;
    name: string;
    parent_id?: number | null;
    children?: Category[];
    requirements?: any;
}

export interface Supply {
    id: number;
    name: string;
    unit: string;
    concentration?: string;
    full_description?: string;
}

export interface MedicalService {
    id: number;
    name: string;
    institution_id: number;
    specialties?: any[];
}

export interface Municipality {
    id: number;
    name: string;
}

export interface Community {
    id: number;
    name: string;
}

export interface Street {
    id: number;
    name: string;
}