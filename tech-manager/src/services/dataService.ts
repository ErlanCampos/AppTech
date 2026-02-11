import { supabase } from '../lib/supabase';
import type { User, ServiceOrder, ServiceOrderStatus } from '../types';

export const dataService = {
    async fetchUsers(): Promise<User[]> {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('name');

        if (error) {
            console.error('Error fetching users:', error);
            return [];
        }

        return data.map(user => ({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role as 'admin' | 'technician'
        }));
    },

    async fetchServiceOrders(): Promise<ServiceOrder[]> {
        const { data, error } = await supabase
            .from('service_orders')
            .select('*')
            .order('date', { ascending: false });

        if (error) {
            console.error('Error fetching service orders:', error);
            return [];
        }

        return data.map(order => ({
            id: order.id,
            title: order.title,
            description: order.description,
            date: order.date,
            location: {
                lat: order.location_lat,
                lng: order.location_lng,
                address: order.location_address
            },
            status: order.status as ServiceOrderStatus,
            assignedTechnicianId: order.assigned_technician_id,
            createdAt: order.created_at
        }));
    },

    async createServiceOrder(order: Omit<ServiceOrder, 'id' | 'createdAt' | 'status'>): Promise<ServiceOrder> {
        const { data, error } = await supabase
            .from('service_orders')
            .insert({
                title: order.title,
                description: order.description,
                date: order.date,
                location_address: order.location.address,
                location_lat: order.location.lat,
                location_lng: order.location.lng,
                assigned_technician_id: order.assignedTechnicianId,
                status: 'pending'
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating service order:', error);
            throw error;
        }

        return {
            id: data.id,
            title: data.title,
            description: data.description,
            date: data.date,
            location: {
                lat: data.location_lat,
                lng: data.location_lng,
                address: data.location_address
            },
            status: data.status as ServiceOrderStatus,
            assignedTechnicianId: data.assigned_technician_id,
            createdAt: data.created_at
        };
    },

    async updateStatus(id: string, status: ServiceOrderStatus): Promise<ServiceOrder> {
        const { data, error } = await supabase
            .from('service_orders')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating status:', error);
            throw error;
        }

        return {
            id: data.id,
            title: data.title,
            description: data.description,
            date: data.date,
            location: {
                lat: data.location_lat,
                lng: data.location_lng,
                address: data.location_address
            },
            status: data.status as ServiceOrderStatus,
            assignedTechnicianId: data.assigned_technician_id,
            createdAt: data.created_at
        };
    },

    async assignTechnician(orderId: string, technicianId: string): Promise<ServiceOrder> {
        const { data, error } = await supabase
            .from('service_orders')
            .update({
                assigned_technician_id: technicianId || null,
                updated_at: new Date().toISOString()
            })
            .eq('id', orderId)
            .select()
            .single();

        if (error) {
            console.error('Error assigning technician:', error);
            throw error;
        }

        return {
            id: data.id,
            title: data.title,
            description: data.description,
            date: data.date,
            location: {
                lat: data.location_lat,
                lng: data.location_lng,
                address: data.location_address
            },
            status: data.status as ServiceOrderStatus,
            assignedTechnicianId: data.assigned_technician_id,
            createdAt: data.created_at
        };
    },

    async deleteServiceOrder(id: string): Promise<void> {
        const { error } = await supabase
            .from('service_orders')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting service order:', error);
            throw error;
        }
    }
};
