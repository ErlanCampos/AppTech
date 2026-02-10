import { supabase } from '../lib/supabase';
import type { User, ServiceOrder, ServiceOrderStatus, Location } from '../types';

export const dataService = {
    async fetchUsers(): Promise<User[]> {
        const { data: profiles, error } = await supabase
            .from('profiles')
            .select('*');

        if (error) throw error;
        if (!profiles) return [];

        return profiles.map((p: Record<string, string>) => ({
            id: p.id,
            name: p.full_name || 'Desconhecido',
            email: p.email || '',
            role: p.role as 'admin' | 'technician',
            avatarUrl: p.avatar_url
        }));
    },

    async fetchServiceOrders(): Promise<ServiceOrder[]> {
        const { data: orders, error } = await supabase
            .from('service_orders')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        if (!orders) return [];

        return orders.map((o: Record<string, unknown>) => ({
            id: o.id as string,
            title: o.title as string,
            description: o.description as string,
            date: o.date as string,
            location: o.location as Location,
            status: o.status as ServiceOrderStatus,
            assignedTechnicianId: o.assigned_technician_id as string | null,
            createdAt: o.created_at as string,
        }));
    },

    async createServiceOrder(order: Omit<ServiceOrder, 'id' | 'createdAt' | 'status'>, createdBy: string): Promise<void> {
        const { error } = await supabase
            .from('service_orders')
            .insert({
                title: order.title,
                description: order.description,
                date: order.date,
                location: order.location,
                status: 'pending',
                assigned_technician_id: order.assignedTechnicianId,
                created_by: createdBy
            });

        if (error) throw error;
    },

    async updateStatus(id: string, status: ServiceOrderStatus): Promise<void> {
        const { error } = await supabase
            .from('service_orders')
            .update({ status })
            .eq('id', id);

        if (error) throw error;
    },

    async assignTechnician(orderId: string, technicianId: string): Promise<void> {
        const { error } = await supabase
            .from('service_orders')
            .update({ assigned_technician_id: technicianId })
            .eq('id', orderId);

        if (error) throw error;
    },

    async deleteServiceOrder(id: string): Promise<void> {
        const { error } = await supabase
            .from('service_orders')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
