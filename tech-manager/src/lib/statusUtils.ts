import type { ServiceOrderStatus } from '../types';

export const getStatusColor = (status: ServiceOrderStatus): string => {
    switch (status) {
        case 'completed': return 'text-emerald-700 bg-emerald-50 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800';
        case 'in-progress': return 'text-blue-700 bg-blue-50 border-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
        case 'cancelled': return 'text-red-700 bg-red-50 border-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
        default: return 'text-amber-700 bg-amber-50 border-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800';
    }
};

export const getStatusText = (status: ServiceOrderStatus): string => {
    switch (status) {
        case 'completed': return 'Concluído';
        case 'in-progress': return 'Em Andamento';
        case 'cancelled': return 'Cancelado';
        default: return 'Pendente';
    }
};

export const getCalendarStatusColor = (status: ServiceOrderStatus): string => {
    switch (status) {
        case 'completed': return '#047857';
        case 'in-progress': return '#1d4ed8';
        case 'cancelled': return '#b91c1c';
        default: return '#d97706';
    }
};
