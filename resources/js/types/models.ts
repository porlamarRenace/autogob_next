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
    birth_date: string;
    age?: number;
    gender: 'M' | 'F';
    phone?: string;
    address_detail?: string;
    street_id?: number;
    social_data?: Record<string, any>;
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