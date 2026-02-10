import { useMemo, useState, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, type Messages, type View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useAppStore } from '../store/useAppStore';
import { getCalendarStatusColor, getStatusText } from '../lib/statusUtils';
import { Clock, CheckCircle, AlertTriangle, XCircle, MapPin, Calendar as CalendarIcon } from 'lucide-react';
import clsx from 'clsx';
import type { ServiceOrder } from '../types';

const locales = { 'pt-BR': ptBR };

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

const messages: Messages = {
    allDay: 'Dia inteiro',
    previous: 'Anterior',
    next: 'Próximo',
    today: 'Hoje',
    month: 'Mês',
    week: 'Semana',
    day: 'Dia',
    agenda: 'Agenda',
    date: 'Data',
    time: 'Hora',
    event: 'Evento',
    noEventsInRange: 'Não há eventos neste período.',
    showMore: (total: number) => `+${total} mais`,
};

const STATUS_LEGEND = [
    { status: 'pending', icon: AlertTriangle, label: 'Pendente', dotColor: 'bg-amber-500' },
    { status: 'in-progress', icon: Clock, label: 'Em Andamento', dotColor: 'bg-blue-500' },
    { status: 'completed', icon: CheckCircle, label: 'Concluído', dotColor: 'bg-emerald-500' },
    { status: 'cancelled', icon: XCircle, label: 'Cancelado', dotColor: 'bg-red-500' },
] as const;

export const CalendarView = () => {
    const { serviceOrders, currentUser } = useAppStore();
    const [selectedEvent, setSelectedEvent] = useState<ServiceOrder | null>(null);
    const [currentView, setCurrentView] = useState<View>('month');

    const relevantOrders = useMemo(() => {
        if (!currentUser) return [];
        return currentUser.role === 'admin'
            ? serviceOrders
            : serviceOrders.filter(os => os.assignedTechnicianId === currentUser.id);
    }, [serviceOrders, currentUser]);

    const events = useMemo(() => {
        return relevantOrders.map(os => {
            const d = new Date(os.date);
            return {
                title: os.title,
                start: d,
                end: d,
                allDay: true,
                resource: os,
            };
        });
    }, [relevantOrders]);

    const stats = useMemo(() => ({
        total: relevantOrders.length,
        pending: relevantOrders.filter(o => o.status === 'pending').length,
        inProgress: relevantOrders.filter(o => o.status === 'in-progress').length,
        completed: relevantOrders.filter(o => o.status === 'completed').length,
    }), [relevantOrders]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eventStyleGetter = useCallback((event: any) => {
        const backgroundColor = getCalendarStatusColor(event.resource.status);
        return {
            style: {
                backgroundColor,
                borderRadius: '6px',
                border: 'none',
                color: 'white',
                display: 'block',
                fontWeight: '600',
                fontSize: '0.8rem',
                padding: '2px 6px',
                lineHeight: '1.4',
                boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
            }
        };
    }, []);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleSelectEvent = useCallback((event: any) => {
        setSelectedEvent(event.resource);
    }, []);

    const handleViewChange = useCallback((view: View) => {
        setCurrentView(view);
    }, []);

    if (!currentUser) return null;

    return (
        <div className="space-y-5 animate-[fadeIn_0.4s_ease-out]">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-5 border-b border-stone-200 dark:border-stone-800">
                <div>
                    <h2 className="text-3xl font-bold text-stone-800 dark:text-stone-100 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                            <CalendarIcon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        Calendário de Serviços
                    </h2>
                    <p className="text-stone-500 dark:text-stone-400 mt-1 ml-14">
                        {stats.total} serviços agendados • {stats.pending} pendentes
                    </p>
                </div>

                {/* Status Legend */}
                <div className="flex flex-wrap gap-3 ml-14 md:ml-0">
                    {STATUS_LEGEND.map(({ status, label, dotColor }) => (
                        <div key={status} className="flex items-center gap-1.5 text-xs font-medium text-stone-500 dark:text-stone-400">
                            <span className={clsx("w-2.5 h-2.5 rounded-full", dotColor)} />
                            {label}
                        </div>
                    ))}
                </div>
            </div>

            {/* Mini Stats Row */}
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

            {/* Calendar */}
            <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-800 overflow-hidden">
                <div className="h-[calc(100vh-320px)] min-h-[500px] p-4 md:p-6 calendar-container font-sans text-stone-600 dark:text-stone-300">
                    <Calendar
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: '100%' }}
                        eventPropGetter={eventStyleGetter}
                        views={['month', 'week', 'day', 'agenda']}
                        view={currentView}
                        onView={handleViewChange}
                        defaultView="month"
                        culture="pt-BR"
                        messages={messages}
                        onSelectEvent={handleSelectEvent}
                        popup
                        selectable
                    />
                </div>
            </div>

            {/* Event Detail Popup */}
            {selectedEvent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelectedEvent(null)}>
                    <div className="absolute inset-0 bg-black/40 animate-[fadeIn_0.15s_ease-out]" />
                    <div
                        className="relative bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 p-6 max-w-md w-full animate-[slideUp_0.25s_ease-out]"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-start gap-4 mb-5">
                            <div className="p-2.5 rounded-xl" style={{ backgroundColor: getCalendarStatusColor(selectedEvent.status) + '18' }}>
                                <CalendarIcon className="w-5 h-5" style={{ color: getCalendarStatusColor(selectedEvent.status) }} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-stone-800 dark:text-stone-100">
                                    {selectedEvent.title}
                                </h3>
                                <span
                                    className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-bold text-white"
                                    style={{ backgroundColor: getCalendarStatusColor(selectedEvent.status) }}
                                >
                                    {getStatusText(selectedEvent.status)}
                                </span>
                            </div>
                        </div>

                        <p className="text-sm text-stone-600 dark:text-stone-400 mb-4 leading-relaxed">
                            {selectedEvent.description}
                        </p>

                        <div className="space-y-3 text-sm border-t border-stone-100 dark:border-stone-800 pt-4">
                            <div className="flex items-center gap-3 text-stone-500 dark:text-stone-400">
                                <CalendarIcon className="w-4 h-4 text-stone-400 dark:text-stone-600" />
                                <span>{format(new Date(selectedEvent.date), "dd/MM/yyyy 'às' HH:mm")}</span>
                            </div>
                            <div className="flex items-center gap-3 text-stone-500 dark:text-stone-400">
                                <MapPin className="w-4 h-4 text-stone-400 dark:text-stone-600" />
                                <span>{selectedEvent.location.address}</span>
                            </div>
                        </div>

                        <button
                            onClick={() => setSelectedEvent(null)}
                            className="mt-5 w-full py-2.5 px-4 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-xl text-sm font-semibold hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
