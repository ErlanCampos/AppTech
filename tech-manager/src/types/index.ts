export type UserRole = 'admin' | 'technician';

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    avatarUrl?: string; // For UI polish
}

export interface Location {
    lat: number;
    lng: number;
    address: string;
}

export type ServiceOrderStatus = 'pending' | 'in-progress' | 'completed' | 'cancelled';

export interface ServiceOrder {
    id: string;
    title: string;
    description: string;
    date: string; // ISO Date string
    location: Location;
    status: ServiceOrderStatus;
    assignedTechnicianId: string | null;
    createdAt: string;
}
