import { useMemo, useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useAppStore } from '../store/useAppStore';
import { Icon, DivIcon, LatLngBounds } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getStatusText, getCalendarStatusColor } from '../lib/statusUtils';
import { Map as MapIcon, Filter, Calendar as CalendarIcon, MapPin, Clock, CheckCircle, AlertTriangle, XCircle, Users } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';
import type { ServiceOrderStatus } from '../types';

import markerIconPng from "leaflet/dist/images/marker-icon.png";
import markerIcon2xPng from "leaflet/dist/images/marker-icon-2x.png";
import markerShadowPng from "leaflet/dist/images/marker-shadow.png";

// @ts-expect-error - Leaflet icon workaround
delete Icon.Default.prototype._getIconUrl;
Icon.Default.mergeOptions({
    iconUrl: markerIconPng,
    iconRetinaUrl: markerIcon2xPng,
    shadowUrl: markerShadowPng,
});

const STATUS_PIN_COLORS: Record<ServiceOrderStatus, string> = {
    pending: '#d97706',
    'in-progress': '#2563eb',
    completed: '#059669',
    cancelled: '#dc2626',
};

const createPinIcon = (color: string, isPending = false) => {
    const pulseRing = isPending
        ? `<circle cx="14" cy="14" r="12" fill="none" stroke="${color}" stroke-width="2" opacity="0.4"><animate attributeName="r" from="12" to="22" dur="1.5s" repeatCount="indefinite"/><animate attributeName="opacity" from="0.4" to="0" dur="1.5s" repeatCount="indefinite"/></circle>`
        : '';
    return new DivIcon({
        className: 'custom-pin',
        html: `
            <svg width="32" height="44" viewBox="-4 -2 36 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                ${pulseRing}
                <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.268 21.732 0 14 0z" fill="${color}" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))"/>
                <circle cx="14" cy="14" r="6" fill="white" opacity="0.9"/>
                <circle cx="14" cy="14" r="3" fill="${color}"/>
            </svg>
        `,
        iconSize: [32, 44],
        iconAnchor: [16, 44],
        popupAnchor: [0, -44],
    });
};

const TILE_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>';

const STATUS_FILTERS = [
    { key: 'all' as const, label: 'Todos', icon: MapIcon, color: 'text-stone-600 dark:text-stone-400', activeBg: 'bg-stone-800 dark:bg-stone-200', activeText: 'text-white dark:text-stone-900' },
    { key: 'pending' as const, label: 'Pendentes', icon: AlertTriangle, color: 'text-amber-600', activeBg: 'bg-amber-600', activeText: 'text-white' },
    { key: 'in-progress' as const, label: 'Em Andamento', icon: Clock, color: 'text-blue-600', activeBg: 'bg-blue-600', activeText: 'text-white' },
    { key: 'completed' as const, label: 'Concluídos', icon: CheckCircle, color: 'text-emerald-600', activeBg: 'bg-emerald-600', activeText: 'text-white' },
    { key: 'cancelled' as const, label: 'Cancelados', icon: XCircle, color: 'text-red-600', activeBg: 'bg-red-600', activeText: 'text-white' },
];

type FilterKey = ServiceOrderStatus | 'all';

function FitBounds({ orders }: { orders: { location: { lat: number; lng: number } }[] }) {
    const map = useMap();

    useEffect(() => {
        if (orders.length === 0) return;

        if (orders.length === 1) {
            map.setView([orders[0].location.lat, orders[0].location.lng], 15, { animate: true });
            return;
        }

        const bounds = new LatLngBounds(
            orders.map(o => [o.location.lat, o.location.lng] as [number, number])
        );
        map.fitBounds(bounds, { padding: [50, 50], animate: true, maxZoom: 16 });
    }, [orders, map]);

    return null;
}



export const MapView = () => {
    const { serviceOrders, currentUser, users } = useAppStore();
    const [activeFilter, setActiveFilter] = useState<FilterKey>('all');

    if (!currentUser) return null;

    const relevantOrders = currentUser.role === 'admin'
        ? serviceOrders
        : serviceOrders.filter(os => os.assignedTechnicianId === currentUser.id);

    const filteredOrders = activeFilter === 'all'
        ? relevantOrders
        : relevantOrders.filter(os => os.status === activeFilter);

    const stats = useMemo(() => ({
        total: relevantOrders.length,
        pending: relevantOrders.filter(o => o.status === 'pending').length,
        inProgress: relevantOrders.filter(o => o.status === 'in-progress').length,
        completed: relevantOrders.filter(o => o.status === 'completed').length,
    }), [relevantOrders]);

    const pinIcons = useMemo(() => ({
        pending: createPinIcon(STATUS_PIN_COLORS.pending, true),
        'in-progress': createPinIcon(STATUS_PIN_COLORS['in-progress']),
        completed: createPinIcon(STATUS_PIN_COLORS.completed),
        cancelled: createPinIcon(STATUS_PIN_COLORS.cancelled),
    }), []);

    const defaultCenter = relevantOrders.length > 0
        ? { lat: relevantOrders[0].location.lat, lng: relevantOrders[0].location.lng }
        : { lat: -14.235, lng: -51.9253 };

    const getTechName = (id: string | null) => {
        if (!id) return 'Não atribuído';
        return users.find(u => u.id === id)?.name || 'Desconhecido';
    };

    return (
        <div className="space-y-5 animate-[fadeIn_0.4s_ease-out]">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-5 border-b border-stone-200 dark:border-stone-800">
                <div>
                    <h2 className="text-3xl font-bold text-stone-800 dark:text-stone-100 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                            <MapIcon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        Mapa de Serviços
                    </h2>
                    <p className="text-stone-500 dark:text-stone-400 mt-1 ml-14">
                        {filteredOrders.length} pinos no mapa • {stats.pending} pendentes
                    </p>
                </div>

                {/* Mini Stats */}
                <div className="flex gap-4 ml-14 md:ml-0">
                    {[
                        { value: stats.total, label: 'Total', color: 'text-stone-700 dark:text-stone-300' },
                        { value: stats.pending, label: 'Pend.', color: 'text-amber-600 dark:text-amber-400' },
                        { value: stats.inProgress, label: 'Andamento', color: 'text-blue-600 dark:text-blue-400' },
                        { value: stats.completed, label: 'Concluídas', color: 'text-emerald-600 dark:text-emerald-400' },
                    ].map(s => (
                        <div key={s.label} className="text-center">
                            <p className={clsx("text-xl font-bold", s.color)}>{s.value}</p>
                            <p className="text-[0.65rem] font-medium text-stone-400 dark:text-stone-500 uppercase tracking-wide">{s.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <Filter className="w-4 h-4 text-stone-400 dark:text-stone-500 shrink-0" />
                {STATUS_FILTERS.map(f => (
                    <button
                        key={f.key}
                        onClick={() => setActiveFilter(f.key)}
                        className={clsx(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap border",
                            activeFilter === f.key
                                ? clsx(f.activeBg, f.activeText, "border-transparent shadow-sm")
                                : "bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:border-stone-300 dark:hover:border-stone-600"
                        )}
                    >
                        <f.icon className="w-3.5 h-3.5" />
                        {f.label}
                        {f.key !== 'all' && (
                            <span className={clsx(
                                "ml-1 px-1.5 py-0.5 rounded-full text-[0.6rem] font-bold",
                                activeFilter === f.key
                                    ? "bg-white/20"
                                    : "bg-stone-100 dark:bg-stone-800"
                            )}>
                                {f.key === 'pending' ? stats.pending
                                    : f.key === 'in-progress' ? stats.inProgress
                                        : f.key === 'completed' ? stats.completed
                                            : relevantOrders.filter(o => o.status === 'cancelled').length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Map */}
            <div className="relative rounded-2xl overflow-hidden shadow-lg border border-stone-200 dark:border-stone-800">
                <div className="h-[calc(100vh-310px)] min-h-[400px]">
                    <MapContainer
                        center={[defaultCenter.lat, defaultCenter.lng]}
                        zoom={13}
                        style={{ height: '100%', width: '100%' }}
                        zoomAnimation={true}
                    >
                        <TileLayer attribution={TILE_ATTRIBUTION} url={TILE_URL} />
                        <FitBounds orders={filteredOrders} />

                        {filteredOrders.map(os => (
                            <Marker
                                key={os.id}
                                position={[os.location.lat, os.location.lng]}
                                icon={pinIcons[os.status]}
                            >
                                <Popup maxWidth={280} className="custom-popup">
                                    <div className="p-1 min-w-[220px]">
                                        {/* Status badge */}
                                        <div className="flex items-center gap-2 mb-2">
                                            <span
                                                className="px-2 py-0.5 rounded-full text-[0.65rem] font-bold text-white uppercase tracking-wide"
                                                style={{ backgroundColor: getCalendarStatusColor(os.status) }}
                                            >
                                                {getStatusText(os.status)}
                                            </span>
                                        </div>

                                        {/* Title & Description */}
                                        <h3 className="font-bold text-sm text-stone-800 mb-1">{os.title}</h3>
                                        <p className="text-xs text-stone-500 mb-3 leading-relaxed">{os.description}</p>

                                        {/* Details */}
                                        <div className="space-y-1.5 text-xs border-t border-stone-100 pt-2">
                                            <div className="flex items-center gap-2 text-stone-500">
                                                <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                                                <span className="truncate">{os.location.address}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-stone-500">
                                                <CalendarIcon className="w-3 h-3 text-stone-400 shrink-0" />
                                                <span>{format(new Date(os.date), "dd/MM/yyyy 'às' HH:mm")}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-stone-500">
                                                <Users className="w-3 h-3 text-stone-400 shrink-0" />
                                                <span>Técnico: <strong className="text-stone-700">{getTechName(os.assignedTechnicianId)}</strong></span>
                                            </div>
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                </div>

                {/* Floating legend */}
                <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 dark:bg-stone-900/90 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-stone-200 dark:border-stone-700">
                    <p className="text-[0.6rem] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-2">Legenda</p>
                    <div className="flex flex-col gap-1.5">
                        {[
                            { color: '#d97706', label: 'Pendente' },
                            { color: '#2563eb', label: 'Em Andamento' },
                            { color: '#059669', label: 'Concluído' },
                            { color: '#dc2626', label: 'Cancelado' },
                        ].map(item => (
                            <div key={item.label} className="flex items-center gap-2">
                                <svg width="12" height="16" viewBox="0 0 28 40" fill="none">
                                    <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.268 21.732 0 14 0z" fill={item.color} />
                                    <circle cx="14" cy="14" r="6" fill="white" opacity="0.9" />
                                </svg>
                                <span className="text-[0.65rem] font-medium text-stone-600 dark:text-stone-400">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Empty state overlay */}
                {filteredOrders.length === 0 && (
                    <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-white/70 dark:bg-stone-950/70 backdrop-blur-sm">
                        <div className="text-center">
                            <MapPin className="w-12 h-12 text-stone-300 dark:text-stone-600 mx-auto mb-3" />
                            <p className="font-bold text-stone-700 dark:text-stone-300">Nenhum serviço encontrado</p>
                            <p className="text-sm text-stone-500 dark:text-stone-500 mt-1">Tente mudar o filtro para ver mais resultados.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
