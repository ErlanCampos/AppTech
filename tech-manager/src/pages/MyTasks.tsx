
import { useAppStore } from '../store/useAppStore';
import { Calendar as CalendarIcon, MapPin, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';
import { getStatusColor, getStatusText } from '../lib/statusUtils';

export const MyTasks = () => {
    const { serviceOrders, currentUser, updateServiceOrderStatus } = useAppStore();

    if (!currentUser) return null;

    const myTasks = serviceOrders.filter(os => os.assignedTechnicianId === currentUser.id);


    return (
        <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
            <div className="pb-6 border-b border-stone-200 dark:border-stone-800">
                <h2 className="text-3xl font-bold text-stone-800 dark:text-stone-100 tracking-tight">Minhas Tarefas</h2>
                <p className="text-stone-500 dark:text-stone-400 mt-1">Acompanhe suas ordens de serviço designadas</p>
            </div>

            <div className="grid gap-6">
                {myTasks.map(os => (
                    <div key={os.id} className="bg-white dark:bg-stone-900 p-6 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-800 hover:shadow-md transition-shadow flex flex-col md:flex-row gap-6">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                                <span className={clsx("px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide border", getStatusColor(os.status))}>
                                    {getStatusText(os.status)}
                                </span>
                                <h3 className="text-xl font-bold text-stone-800 dark:text-stone-100">{os.title}</h3>
                            </div>

                            <p className="text-stone-600 dark:text-stone-400 mb-6 leading-relaxed">{os.description}</p>

                            <div className="space-y-3 text-sm text-stone-500 dark:text-stone-500">
                                <div className="flex items-center">
                                    <div className="w-8 h-8 rounded-full bg-stone-50 dark:bg-stone-950/50 flex items-center justify-center mr-3 border border-stone-100 dark:border-stone-800">
                                        <CalendarIcon className="w-4 h-4 text-stone-400 dark:text-stone-600" />
                                    </div>
                                    <span className="font-semibold text-stone-700 dark:text-stone-300 mr-1">Agendado:</span>
                                    {format(new Date(os.date), "dd/MM/yyyy 'às' HH:mm")}
                                </div>
                                <div className="flex items-center">
                                    <div className="w-8 h-8 rounded-full bg-stone-50 dark:bg-stone-950/50 flex items-center justify-center mr-3 border border-stone-100 dark:border-stone-800">
                                        <MapPin className="w-4 h-4 text-stone-400 dark:text-stone-600" />
                                    </div>
                                    <span className="font-semibold text-stone-700 dark:text-stone-300 mr-1">Local:</span>
                                    {os.location.address}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 justify-center min-w-[220px] border-t md:border-t-0 md:border-l border-stone-100 dark:border-stone-800 pt-6 md:pt-0 md:pl-6">
                            <span className="text-xs font-bold text-stone-400 dark:text-stone-600 uppercase tracking-widest mb-1">Ações</span>

                            <button
                                onClick={() => updateServiceOrderStatus(os.id, 'in-progress')}
                                disabled={os.status === 'in-progress' || os.status === 'completed'}
                                className={clsx(
                                    "w-full flex items-center justify-center px-4 py-3 rounded-xl text-sm font-bold transition-all shadow-sm",
                                    os.status === 'in-progress'
                                        ? "bg-blue-50 dark:bg-blue-900/10 text-blue-800 dark:text-blue-400 border border-blue-100 dark:border-blue-900/20 cursor-default opacity-50"
                                        : "bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-600 hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                )}
                            >
                                <Clock className="w-4 h-4 mr-2" />
                                Iniciar Serviço
                            </button>

                            <button
                                onClick={() => updateServiceOrderStatus(os.id, 'completed')}
                                disabled={os.status === 'completed'}
                                className={clsx(
                                    "w-full flex items-center justify-center px-4 py-3 rounded-xl text-sm font-bold transition-all shadow-sm",
                                    os.status === 'completed'
                                        ? "bg-emerald-50 dark:bg-emerald-900/10 text-emerald-800 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/20 cursor-default icon-pop"
                                        : "bg-emerald-600 dark:bg-emerald-700 text-white hover:bg-emerald-700 dark:hover:bg-emerald-600 hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                )}
                            >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Finalizar Serviço
                            </button>
                        </div>
                    </div>
                ))}

                {myTasks.length === 0 && (
                    <div className="text-center py-20 bg-stone-50 dark:bg-stone-950/20 rounded-2xl border border-dashed border-stone-300 dark:border-stone-800">
                        <div className="mx-auto w-16 h-16 bg-white dark:bg-stone-900 rounded-full flex items-center justify-center shadow-sm mb-4 text-stone-300 dark:text-stone-600">
                            <CheckCircle className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-stone-800 dark:text-stone-200">Nenhuma tarefa atribuída</h3>
                        <p className="text-stone-500 dark:text-stone-500 max-w-xs mx-auto mt-2">Você está em dia! Acompanhe por aqui quando novas ordens de serviço forem atribuídas a você.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
