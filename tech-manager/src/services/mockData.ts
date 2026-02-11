import type { User, ServiceOrder } from '../types';

const STORAGE_KEYS = {
    USERS: 'tech_manager_users',
    ORDERS: 'tech_manager_orders',
    SESSION: 'tech_manager_session',
};

const DEFAULT_ADMIN: User = {
    id: 'admin-user-id',
    name: 'Administrador',
    email: 'admin@admin.com',
    role: 'admin',
    avatarUrl: 'https://ui-avatars.com/api/?name=Admin+User&background=0D9488&color=fff'
};

const DEFAULT_TECH: User = {
    id: 'tech-user-id',
    name: 'Técnico Exemplo',
    email: 'tech@exemplo.com',
    role: 'technician',
    avatarUrl: 'https://ui-avatars.com/api/?name=Tecnico+Exemplo&background=2563EB&color=fff'
};

export const mockData = {
    getUsers: (): User[] => {
        const stored = localStorage.getItem(STORAGE_KEYS.USERS);
        if (stored) {
            console.log('Loaded users from storage:', JSON.parse(stored).length);
            return JSON.parse(stored);
        }

        console.log('Seeding initial users data...');
        // Seed initial data
        const initial = [DEFAULT_ADMIN, DEFAULT_TECH];
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(initial));
        return initial;
    },

    setUsers: (users: User[]) => {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        // Force storage event for cross-tab sync if needed, but Zustand handles reactivity within same tab
    },

    getOrders: (): ServiceOrder[] => {
        const stored = localStorage.getItem(STORAGE_KEYS.ORDERS);
        return stored ? JSON.parse(stored) : [];
    },

    setOrders: (orders: ServiceOrder[]) => {
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    },

    getSession: (): User | null => {
        const stored = localStorage.getItem(STORAGE_KEYS.SESSION);
        return stored ? JSON.parse(stored) : null;
    },

    setSession: (user: User | null) => {
        if (user) {
            localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
        } else {
            localStorage.removeItem(STORAGE_KEYS.SESSION);
        }
    },

    // Helper to generate IDs
    generateId: () => Math.random().toString(36).substr(2, 9)
};
