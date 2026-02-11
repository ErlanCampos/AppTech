import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { searchCities, type CityResult } from '../lib/geocode';
import { useAppStore } from '../store/useAppStore';
import { PlusCircle, Calendar as CalendarIcon, MapPin, Filter, ClipboardList, Trash2, AlertTriangle, Clock, CheckCircle, XCircle, X, Users, Navigation } from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';
import { getStatusColor, getStatusText } from '../lib/statusUtils';
import type { ServiceOrderStatus } from '../types';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';

import markerIconPng from 'leaflet/dist/images/marker-icon.png';
import markerIcon2xPng from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadowPng from 'leaflet/dist/images/marker-shadow.png';

// @ts-expect-error - Leaflet icon workaround
delete Icon.Default.prototype._getIconUrl;
Icon.Default.mergeOptions({
    iconUrl: markerIconPng,
    iconRetinaUrl: markerIcon2xPng,
    shadowUrl: markerShadowPng,
});

function ClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e) {
            onMapClick(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
    const map = useMap();
    useEffect(() => {
        map.setView([lat, lng], map.getZoom(), { animate: true });
    }, [lat, lng, map]);
    return null;
}

type FilterKey = ServiceOrderStatus | 'all';

const STATUS_FILTERS = [
    { key: 'all' as const, label: 'Todos', icon: ClipboardList },
    { key: 'pending' as const, label: 'Pendentes', icon: AlertTriangle, dotColor: 'bg-amber-500' },
    { key: 'in-progress' as const, label: 'Em Andamento', icon: Clock, dotColor: 'bg-blue-500' },
    { key: 'completed' as const, label: 'Concluídos', icon: CheckCircle, dotColor: 'bg-emerald-500' },
    { key: 'cancelled' as const, label: 'Cancelados', icon: XCircle, dotColor: 'bg-red-500' },
];

export const Orders = () => {
    const { serviceOrders, users, currentUser, addServiceOrder, assignServiceOrder, updateServiceOrderStatus, deleteServiceOrder } = useAppStore();
    const [isCreating, setIsCreating] = useState(false);
    const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [address, setAddress] = useState('');
    const [date, setDate] = useState('');
    const [assignedTech, setAssignedTech] = useState('');
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [geoError, setGeoError] = useState('');
    const [suggestions, setSuggestions] = useState<CityResult[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const technicians = users.filter(u => u.role === 'technician');
    const isAdmin = currentUser?.role === 'admin';

    const stats = useMemo(() => ({
        total: serviceOrders.length,
        pending: serviceOrders.filter(o => o.status === 'pending').length,
        inProgress: serviceOrders.filter(o => o.status === 'in-progress').length,
        completed: serviceOrders.filter(o => o.status === 'completed').length,
        cancelled: serviceOrders.filter(o => o.status === 'cancelled').length,
    }), [serviceOrders]);

    const filteredOrders = useMemo(() => {
        const orders = activeFilter === 'all'
            ? serviceOrders
            : serviceOrders.filter(os => os.status === activeFilter);
        return [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [serviceOrders, activeFilter]);

    const getFilterCount = (key: FilterKey) => {
        if (key === 'all') return stats.total;
        if (key === 'pending') return stats.pending;
        if (key === 'in-progress') return stats.inProgress;
        if (key === 'completed') return stats.completed;
        return stats.cancelled;
    };

    const handleCitySearch = useCallback(async (query: string) => {
        if (query.trim().length < 2) {
            setSuggestions([]);
            return;
        }
        setIsGeocoding(true);
        try {
            const results = await searchCities(query);
            setSuggestions(results);
            setShowSuggestions(results.length > 0);
        } finally {
            setIsGeocoding(false);
        }
    }, []);

    const handleAddressChange = (value: string) => {
        setAddress(value);
        setGeoError('');
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => handleCitySearch(value), 400);
    };

    const handleSelectCity = (city: CityResult) => {
        setAddress(city.name);
        setCoords({ lat: city.lat, lng: city.lng });
        setSuggestions([]);
        setShowSuggestions(false);
        setGeoError('');
    };

    const handleMapClick = (lat: number, lng: number) => {
        setCoords({ lat, lng });
        setGeoError('');
    };

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!coords) {
            setGeoError('Busque o endereço ou clique no mapa para definir a localização.');
            return;
        }
        await addServiceOrder({
            title,
            description,
            location: { address, lat: coords.lat, lng: coords.lng },
            date: new Date(date).toISOString(),
            assignedTechnicianId: assignedTech || null,
        });
        setIsCreating(false);
        resetForm();
    };

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setAddress('');
        setDate('');
        setAssignedTech('');
        setCoords(null);
        setGeoError('');
        setSuggestions([]);
        setShowSuggestions(false);
    };

    const handleDelete = (id: string) => {
        deleteServiceOrder(id);
        setDeleteConfirm(null);
    };

    const getTechName = (id: string | null) => {
        if (!id) return 'Não atribuído';
        return users.find(u => u.id === id)?.name || 'Desconhecido';
    };

    return (
        <div className="space-y-6 animate-[fadeIn_0.4s_ease-out]">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-5 border-b border-stone-200 dark:border-stone-800">
                <div>
                    <h2 className="text-3xl font-bold text-stone-800 dark:text-stone-100 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                            <ClipboardList className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        Ordens de Serviço
                    </h2>
                    <p className="text-stone-500 dark:text-stone-400 mt-1 ml-14">
                        {stats.total} ordens • {stats.pending} pendentes • {stats.inProgress} em andamento
                    </p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center px-5 py-2.5 bg-emerald-700 dark:bg-emerald-600 text-white rounded-xl shadow-lg hover:bg-emerald-800 dark:hover:bg-emerald-700 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 self-start md:self-auto"
                >
                    <PlusCircle className="w-5 h-5 mr-2" />
                    Nova Ordem
                </button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: 'Total', value: stats.total, color: 'text-stone-700 dark:text-stone-300', bg: 'bg-stone-50 dark:bg-stone-800/50' },
                    { label: 'Pendentes', value: stats.pending, color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/10' },
                    { label: 'Em Andamento', value: stats.inProgress, color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/10' },
                    { label: 'Concluídas', value: stats.completed, color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/10' },
                ].map(({ label, value, color, bg }) => (
                    <div key={label} className={clsx("px-4 py-3 rounded-xl border border-stone-100 dark:border-stone-800 transition-all", bg)}>
                        <p className={clsx("text-xl font-bold", color)}>{value}</p>
                        <p className="text-xs font-medium text-stone-500 dark:text-stone-500">{label}</p>
                    </div>
                ))}
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
                                ? "bg-emerald-700 dark:bg-emerald-600 text-white border-transparent shadow-sm"
                                : "bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:border-stone-300 dark:hover:border-stone-600"
                        )}
                    >
                        <f.icon className="w-3.5 h-3.5" />
                        {f.label}
                        <span className={clsx(
                            "ml-1 px-1.5 py-0.5 rounded-full text-[0.6rem] font-bold",
                            activeFilter === f.key ? "bg-white/20" : "bg-stone-100 dark:bg-stone-800"
                        )}>
                            {getFilterCount(f.key)}
                        </span>
                    </button>
                ))}
            </div>

            {/* Create Form */}
            {isCreating && (
                <div className="bg-white dark:bg-stone-900 p-8 rounded-2xl shadow-xl border border-stone-100 dark:border-stone-800 animate-[slideDown_0.3s_ease-out]">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-stone-800 dark:text-stone-100 flex items-center">
                            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mr-3">
                                <PlusCircle className="w-5 h-5" />
                            </div>
                            Criar Nova Ordem de Serviço
                        </h3>
                        <button onClick={() => setIsCreating(false)} className="p-2 rounded-lg text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-stone-600 dark:text-stone-400 mb-2">Título do Serviço</label>
                            <input
                                required
                                className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all dark:text-white"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="Ex: Manutenção de Impressora"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-stone-600 dark:text-stone-400 mb-2">Descrição Detalhada</label>
                            <textarea
                                required
                                className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all dark:text-white"
                                rows={3}
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Descreva os detalhes da tarefa..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-stone-600 dark:text-stone-400 mb-2">Data e Hora</label>
                            <input
                                required
                                type="datetime-local"
                                className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all dark:text-white dark:[color-scheme:dark]"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-stone-600 dark:text-stone-400 mb-2">
                                <MapPin className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                                Cidade
                            </label>

                            {/* City autocomplete */}
                            <div className="relative mb-3 z-[1001]" ref={wrapperRef}>
                                <div className="relative">
                                    <input
                                        required
                                        className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all dark:text-white pr-10"
                                        value={address}
                                        onChange={e => handleAddressChange(e.target.value)}
                                        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                                        placeholder="Digite o nome da cidade..."
                                        autoComplete="off"
                                    />
                                    {isGeocoding && (
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-stone-300 dark:border-stone-600 border-t-emerald-500 rounded-full animate-spin" />
                                    )}
                                </div>

                                {/* Suggestions dropdown */}
                                {showSuggestions && suggestions.length > 0 && (
                                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl shadow-xl overflow-hidden animate-[slideDown_0.15s_ease-out]">
                                        {suggestions.map((city, i) => (
                                            <button
                                                key={`${city.lat}-${city.lng}-${i}`}
                                                type="button"
                                                onClick={() => handleSelectCity(city)}
                                                className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors flex items-center gap-3 border-b border-stone-100 dark:border-stone-800 last:border-b-0"
                                            >
                                                <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
                                                <span className="text-sm text-stone-800 dark:text-stone-200 truncate">
                                                    <strong>{city.name}</strong>
                                                    {city.state && <span className="text-stone-400 dark:text-stone-500 font-normal"> — {city.state}</span>}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {geoError && (
                                <p className="text-red-500 text-xs font-medium mb-2 flex items-center gap-1">
                                    <AlertTriangle className="w-3.5 h-3.5" />
                                    {geoError}
                                </p>
                            )}

                            {/* Mini Map Preview */}
                            <div className="rounded-xl overflow-hidden border border-stone-200 dark:border-stone-700 shadow-sm" style={{ height: 200 }}>
                                <MapContainer
                                    center={[coords?.lat ?? -14.235, coords?.lng ?? -51.9253]}
                                    zoom={coords ? 12 : 4}
                                    style={{ height: '100%', width: '100%' }}
                                    zoomControl={false}
                                >
                                    <TileLayer
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
                                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                                    />
                                    <ClickHandler onMapClick={handleMapClick} />
                                    {coords && (
                                        <>
                                            <RecenterMap lat={coords.lat} lng={coords.lng} />
                                            <Marker position={[coords.lat, coords.lng]} />
                                        </>
                                    )}
                                </MapContainer>
                            </div>

                            <p className="text-[0.7rem] text-stone-400 dark:text-stone-500 mt-2 flex items-center gap-1">
                                <Navigation className="w-3 h-3" />
                                {coords
                                    ? `Localização: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)} — clique no mapa para ajustar`
                                    : 'Digite a cidade e selecione uma opção da lista'
                                }
                            </p>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-stone-600 dark:text-stone-400 mb-2">Atribuir Técnico</label>
                            <select
                                className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all dark:text-white"
                                value={assignedTech}
                                onChange={e => setAssignedTech(e.target.value)}
                            >
                                <option value="">-- Não Atribuído --</option>
                                {technicians.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="md:col-span-2 flex justify-end gap-3 mt-2">
                            <button
                                type="button"
                                onClick={() => setIsCreating(false)}
                                className="px-5 py-3 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl font-medium transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={!coords}
                                className="px-6 py-3 bg-emerald-700 dark:bg-emerald-600 text-white rounded-xl font-medium shadow-md hover:bg-emerald-800 dark:hover:bg-emerald-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <PlusCircle className="w-4 h-4" />
                                Criar Ordem
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Orders List */}
            <div className="space-y-4">
                {filteredOrders.map(os => (
                    <div key={os.id} className="bg-white dark:bg-stone-900 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-800 hover:shadow-md transition-all group overflow-hidden">
                        <div className="p-6">
                            <div className="flex flex-col md:flex-row gap-5 justify-between">
                                {/* Left: Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                                        <span className={clsx("px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide border shrink-0", getStatusColor(os.status))}>
                                            {getStatusText(os.status)}
                                        </span>
                                        <h3 className="font-bold text-lg text-stone-800 dark:text-stone-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors truncate">
                                            {os.title}
                                        </h3>
                                    </div>

                                    <p className="text-stone-600 dark:text-stone-400 text-sm mb-4 leading-relaxed line-clamp-2">
                                        {os.description}
                                    </p>

                                    <div className="flex flex-wrap gap-3 text-sm">
                                        <span className="flex items-center text-stone-500 dark:text-stone-500 bg-stone-50 dark:bg-stone-950/50 px-2.5 py-1.5 rounded-lg border border-stone-100 dark:border-stone-800">
                                            <CalendarIcon className="w-3.5 h-3.5 mr-2 text-stone-400 dark:text-stone-400" />
                                            {format(new Date(os.date), "dd/MM/yyyy 'às' HH:mm")}
                                        </span>
                                        <span className="flex items-center text-stone-500 dark:text-stone-500 bg-stone-50 dark:bg-stone-950/50 px-2.5 py-1.5 rounded-lg border border-stone-100 dark:border-stone-800">
                                            <MapPin className="w-3.5 h-3.5 mr-2 text-stone-400 dark:text-stone-400" />
                                            {os.location.address}
                                        </span>
                                        <span className="flex items-center text-stone-500 dark:text-stone-500 bg-stone-50 dark:bg-stone-950/50 px-2.5 py-1.5 rounded-lg border border-stone-100 dark:border-stone-800">
                                            <Users className="w-3.5 h-3.5 mr-2 text-stone-400 dark:text-stone-400" />
                                            {getTechName(os.assignedTechnicianId)}
                                        </span>
                                    </div>
                                </div>

                                {/* Right: Actions */}
                                <div className="flex flex-col gap-3 min-w-[200px] w-full md:w-auto border-t md:border-t-0 md:border-l border-stone-100 dark:border-stone-800 pt-4 md:pt-0 md:pl-5">
                                    {/* Assign technician */}
                                    <div>
                                        <span className="text-[0.65rem] font-bold text-stone-400 dark:text-stone-400 uppercase tracking-widest">Técnico</span>
                                        <select
                                            className="w-full mt-1 bg-stone-50 dark:bg-stone-950/50 border border-stone-200 dark:border-stone-800 rounded-lg px-3 py-2 text-sm font-medium text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
                                            value={os.assignedTechnicianId || ""}
                                            onChange={(e) => assignServiceOrder(os.id, e.target.value)}
                                        >
                                            <option value="">-- Não Atribuído --</option>
                                            {technicians.map(t => (
                                                <option key={t.id} value={t.id}>{t.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Update status */}
                                    <div>
                                        <span className="text-[0.65rem] font-bold text-stone-400 dark:text-stone-400 uppercase tracking-widest">Status</span>
                                        <select
                                            className="w-full mt-1 bg-stone-50 dark:bg-stone-950/50 border border-stone-200 dark:border-stone-800 rounded-lg px-3 py-2 text-sm font-medium text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
                                            value={os.status}
                                            onChange={(e) => updateServiceOrderStatus(os.id, e.target.value as ServiceOrderStatus)}
                                        >
                                            <option value="pending">Pendente</option>
                                            <option value="in-progress">Em Andamento</option>
                                            <option value="completed">Concluído</option>
                                            <option value="cancelled">Cancelado</option>
                                        </select>
                                    </div>

                                    {/* Delete — admin only */}
                                    {isAdmin && (
                                        <div className="mt-1">
                                            {deleteConfirm === os.id ? (
                                                <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800/30 animate-[fadeIn_0.15s_ease-out]">
                                                    <span className="text-xs text-red-700 dark:text-red-400 font-medium flex-1">Excluir?</span>
                                                    <button
                                                        onClick={() => handleDelete(os.id)}
                                                        className="px-2.5 py-1 bg-red-600 text-white text-xs font-bold rounded-md hover:bg-red-700 transition-colors"
                                                    >
                                                        Sim
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteConfirm(null)}
                                                        className="px-2.5 py-1 bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-bold rounded-md hover:bg-stone-300 dark:hover:bg-stone-600 transition-colors"
                                                    >
                                                        Não
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setDeleteConfirm(os.id)}
                                                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg border border-transparent hover:border-red-200 dark:hover:border-red-800/30 transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                    Excluir Ordem
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer with creation date */}
                        <div className="px-6 py-2.5 bg-stone-50 dark:bg-stone-950/30 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                            <span className="text-[0.65rem] text-stone-400 dark:text-stone-500 font-medium">
                                Criada em {format(new Date(os.createdAt), 'dd/MM/yyyy')}
                            </span>
                            <span className="text-[0.65rem] text-stone-400 dark:text-stone-500 font-medium">
                                ID: {os.id}
                            </span>
                        </div>
                    </div>
                ))}

                {filteredOrders.length === 0 && (
                    <div className="text-center py-16 bg-stone-50 dark:bg-stone-950/20 rounded-2xl border border-dashed border-stone-300 dark:border-stone-800">
                        <div className="mx-auto w-12 h-12 bg-white dark:bg-stone-900 rounded-full flex items-center justify-center shadow-sm mb-4">
                            <ClipboardList className="w-6 h-6 text-stone-300 dark:text-stone-400" />
                        </div>
                        <h3 className="text-lg font-bold text-stone-700 dark:text-stone-300">
                            {activeFilter === 'all' ? 'Nenhuma ordem de serviço' : `Nenhuma ordem "${getStatusText(activeFilter as ServiceOrderStatus)}"`}
                        </h3>
                        <p className="text-stone-500 dark:text-stone-500 max-w-xs mx-auto mt-2">
                            {activeFilter === 'all' ? 'Crie uma nova ordem para começar.' : 'Tente mudar o filtro para ver mais resultados.'}
                        </p>
                    </div>
                )}
            </div>

            {/* Delete confirmation overlay (global for mobile) */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 md:hidden flex items-end justify-center p-4" onClick={() => setDeleteConfirm(null)}>
                    <div className="absolute inset-0 bg-black/40" />
                    <div className="relative bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 p-6 w-full max-w-sm animate-[slideUp_0.25s_ease-out]" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                                <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-stone-800 dark:text-stone-100">Excluir Ordem</h3>
                                <p className="text-sm text-stone-500 dark:text-stone-400">Esta ação não pode ser desfeita.</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 py-2.5 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-xl text-sm font-semibold hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => handleDelete(deleteConfirm)}
                                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors"
                            >
                                Excluir
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
