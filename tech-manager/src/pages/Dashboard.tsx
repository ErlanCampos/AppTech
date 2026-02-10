import { useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { ClipboardList, Clock, CheckCircle, AlertTriangle, TrendingUp, Users, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { getStatusColor, getStatusText } from '../lib/statusUtils';
import clsx from 'clsx';

interface KpiCardProps {
    label: string;
    value: number;
    icon: React.ElementType;
    color: string;
    bgColor: string;
}

const KpiCard = ({ label, value, icon: Icon, color, bgColor }: KpiCardProps) => (
    <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-800 hover:shadow-md transition-all duration-300 group">
        <div className="flex items-center justify-between mb-4">
            <div className={clsx("p-3 rounded-xl transition-transform duration-300 group-hover:scale-110", bgColor)}>
                <Icon className={clsx("w-5 h-5", color)} />
            </div>
            <TrendingUp className="w-4 h-4 text-stone-300 dark:text-stone-700" />
        </div>
        <p className="text-3xl font-bold text-stone-800 dark:text-stone-100 tracking-tight">{value}</p>
        <p className="text-sm text-stone-500 dark:text-stone-400 mt-1 font-medium">{label}</p>
    </div>
);

export const Dashboard = () => {
    const { serviceOrders, users, currentUser } = useAppStore();

    const stats = useMemo(() => {
        const total = serviceOrders.length;
        const pending = serviceOrders.filter(o => o.status === 'pending').length;
        const inProgress = serviceOrders.filter(o => o.status === 'in-progress').length;
        const completed = serviceOrders.filter(o => o.status === 'completed').length;
        const technicians = users.filter(u => u.role === 'technician').length;
        return { total, pending, inProgress, completed, technicians };
    }, [serviceOrders, users]);

    const recentOrders = useMemo(() => {
        return [...serviceOrders]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5);
    }, [serviceOrders]);

    if (!currentUser) return null;

    return (
        <div className="space-y-8 animate-[fadeIn_0.4s_ease-out]">
            <div className="pb-6 border-b border-stone-200 dark:border-stone-800">
                <h2 className="text-3xl font-bold text-stone-800 dark:text-stone-100 tracking-tight">
                    Dashboard
                </h2>
                <p className="text-stone-500 dark:text-stone-400 mt-1">
                    Visão geral das operações • Olá, {currentUser.name}
                </p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <KpiCard
                    label="Total de Ordens"
                    value={stats.total}
                    icon={ClipboardList}
                    color="text-stone-600 dark:text-stone-300"
                    bgColor="bg-stone-100 dark:bg-stone-800"
                />
                <KpiCard
                    label="Pendentes"
                    value={stats.pending}
                    icon={AlertTriangle}
                    color="text-amber-600 dark:text-amber-400"
                    bgColor="bg-amber-50 dark:bg-amber-900/20"
                />
                <KpiCard
                    label="Em Andamento"
                    value={stats.inProgress}
                    icon={Clock}
                    color="text-blue-600 dark:text-blue-400"
                    bgColor="bg-blue-50 dark:bg-blue-900/20"
                />
                <KpiCard
                    label="Concluídas"
                    value={stats.completed}
                    icon={CheckCircle}
                    color="text-emerald-600 dark:text-emerald-400"
                    bgColor="bg-emerald-50 dark:bg-emerald-900/20"
                />
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Technicians count */}
                <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-800">
                    <div className="flex items-center gap-3 mb-1">
                        <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-sm font-semibold text-stone-600 dark:text-stone-400">Equipe Ativa</span>
                    </div>
                    <p className="text-2xl font-bold text-stone-800 dark:text-stone-100">{stats.technicians} técnicos</p>
                </div>

                {/* Completion rate */}
                <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-800">
                    <div className="flex items-center gap-3 mb-1">
                        <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-sm font-semibold text-stone-600 dark:text-stone-400">Taxa de Conclusão</span>
                    </div>
                    <p className="text-2xl font-bold text-stone-800 dark:text-stone-100">
                        {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                    </p>
                </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-stone-100 dark:border-stone-800">
                    <h3 className="text-lg font-bold text-stone-800 dark:text-stone-100">Ordens Recentes</h3>
                </div>

                {recentOrders.length > 0 ? (
                    <div className="divide-y divide-stone-100 dark:divide-stone-800">
                        {recentOrders.map(os => (
                            <div key={os.id} className="px-6 py-4 flex items-center justify-between hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <span className={clsx("px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide border", getStatusColor(os.status))}>
                                        {getStatusText(os.status)}
                                    </span>
                                    <div>
                                        <p className="font-semibold text-stone-800 dark:text-stone-100">{os.title}</p>
                                        <p className="text-sm text-stone-500 dark:text-stone-400 flex items-center gap-1 mt-0.5">
                                            <MapPin className="w-3.5 h-3.5" />
                                            {os.location.address}
                                        </p>
                                    </div>
                                </div>
                                <span className="text-sm text-stone-400 dark:text-stone-500 whitespace-nowrap">
                                    {format(new Date(os.createdAt), 'dd/MM/yyyy')}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="px-6 py-12 text-center text-stone-500 dark:text-stone-500">
                        Nenhuma ordem de serviço registrada.
                    </div>
                )}
            </div>
        </div>
    );
};
