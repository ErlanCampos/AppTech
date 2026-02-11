import { useState, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Mail, Users, Search, ClipboardList, CheckCircle, Clock, X, UserPlus, Trash2, Loader2, Lock, User as UserIcon } from 'lucide-react';
import clsx from 'clsx';

export const Technicians = () => {
    const { users, serviceOrders, currentUser, createTechnician, deleteTechnician } = useAppStore();
    const [searchQuery, setSearchQuery] = useState('');

    // Admin create form
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState('');
    const [formSuccess, setFormSuccess] = useState('');

    // Delete confirmation
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const isAdmin = currentUser?.role === 'admin';

    const technicians = useMemo(() => {
        const techs = users.filter(u => u.role === 'technician');
        if (!searchQuery.trim()) return techs;
        const q = searchQuery.toLowerCase();
        return techs.filter(t => t.name.toLowerCase().includes(q) || t.email.toLowerCase().includes(q));
    }, [users, searchQuery]);

    const getTechStats = (techId: string) => {
        const orders = serviceOrders.filter(os => os.assignedTechnicianId === techId);
        return {
            total: orders.length,
            pending: orders.filter(o => o.status === 'pending').length,
            inProgress: orders.filter(o => o.status === 'in-progress').length,
            completed: orders.filter(o => o.status === 'completed').length,
        };
    };

    const totalTechs = users.filter(u => u.role === 'technician').length;
    const totalAssigned = serviceOrders.filter(os => os.assignedTechnicianId).length;

    const getInitials = (name: string) => {
        return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
    };

    const getAvatarColor = (id: string) => {
        const colors = [
            'from-emerald-400 to-teal-500',
            'from-blue-400 to-indigo-500',
            'from-amber-400 to-orange-500',
            'from-rose-400 to-pink-500',
            'from-cyan-400 to-sky-500',
            'from-lime-400 to-green-500',
        ];
        const idx = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
        return colors[idx % colors.length];
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);
        setFormError('');
        setFormSuccess('');

        try {
            await createTechnician(newName.trim(), newEmail.trim(), newPassword.trim());
            setFormSuccess('Técnico criado com sucesso!');
            setNewName('');
            setNewEmail('');
            setNewPassword('');
            setTimeout(() => {
                setShowCreateForm(false);
                setFormSuccess('');
            }, 2000);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Erro ao criar técnico';
            setFormError(msg);
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async (userId: string) => {
        setDeleteLoading(true);
        try {
            await deleteTechnician(userId);
            setDeleteTarget(null);
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : 'Erro ao excluir técnico');
        } finally {
            setDeleteLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-[fadeIn_0.4s_ease-out]">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-5 border-b border-stone-200 dark:border-stone-800">
                <div>
                    <h2 className="text-3xl font-bold text-stone-800 dark:text-stone-100 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                            <Users className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        Técnicos
                    </h2>
                    <p className="text-stone-500 dark:text-stone-400 mt-1 ml-14">
                        {totalTechs} técnicos • {totalAssigned} ordens atribuídas
                    </p>
                </div>
                {isAdmin && (
                    <button
                        onClick={() => { setShowCreateForm(!showCreateForm); setFormError(''); setFormSuccess(''); }}
                        className={clsx(
                            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all",
                            showCreateForm
                                ? "bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300"
                                : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm hover:shadow-md"
                        )}
                    >
                        {showCreateForm ? <X className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                        {showCreateForm ? 'Cancelar' : 'Novo Técnico'}
                    </button>
                )}
            </div>

            {/* Create Technician Form (Admin only) */}
            {isAdmin && showCreateForm && (
                <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-6 shadow-sm animate-[fadeIn_0.3s_ease-out]">
                    <h3 className="text-lg font-bold text-stone-800 dark:text-stone-100 mb-4 flex items-center gap-2">
                        <UserPlus className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        Criar Novo Técnico
                    </h3>
                    <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-1">Nome Completo</label>
                            <div className="relative">
                                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    placeholder="Nome do técnico"
                                    required
                                    className="w-full pl-10 pr-3 py-2.5 bg-stone-50 dark:bg-stone-950/50 border border-stone-200 dark:border-stone-800 rounded-xl text-sm text-stone-800 dark:text-stone-200 placeholder-stone-400 dark:placeholder-stone-600 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-1">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                                <input
                                    type="email"
                                    value={newEmail}
                                    onChange={e => setNewEmail(e.target.value)}
                                    placeholder="email@exemplo.com"
                                    required
                                    className="w-full pl-10 pr-3 py-2.5 bg-stone-50 dark:bg-stone-950/50 border border-stone-200 dark:border-stone-800 rounded-xl text-sm text-stone-800 dark:text-stone-200 placeholder-stone-400 dark:placeholder-stone-600 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-1">Senha</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    placeholder="Mínimo 6 caracteres"
                                    required
                                    minLength={6}
                                    className="w-full pl-10 pr-3 py-2.5 bg-stone-50 dark:bg-stone-950/50 border border-stone-200 dark:border-stone-800 rounded-xl text-sm text-stone-800 dark:text-stone-200 placeholder-stone-400 dark:placeholder-stone-600 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>
                        <div className="md:col-span-3 flex items-center gap-3">
                            <button
                                type="submit"
                                disabled={formLoading}
                                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                                {formLoading ? 'Criando...' : 'Criar Técnico'}
                            </button>
                            {formError && <p className="text-sm text-red-500 dark:text-red-400">{formError}</p>}
                            {formSuccess && <p className="text-sm text-emerald-600 dark:text-emerald-400">{formSuccess}</p>}
                        </div>
                    </form>
                </div>
            )}

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { label: 'Técnicos', value: totalTechs, color: 'text-stone-700 dark:text-stone-300', bg: 'bg-stone-50 dark:bg-stone-800/50' },
                    { label: 'Ordens Atribuídas', value: totalAssigned, color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/10' },
                    { label: 'Não Atribuídas', value: serviceOrders.filter(os => !os.assignedTechnicianId).length, color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/10' },
                ].map(({ label, value, color, bg }) => (
                    <div key={label} className={clsx("px-4 py-3 rounded-xl border border-stone-100 dark:border-stone-800 transition-all", bg)}>
                        <p className={clsx("text-xl font-bold", color)}>{value}</p>
                        <p className="text-xs font-medium text-stone-500 dark:text-stone-500">{label}</p>
                    </div>
                ))}
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-stone-500" />
                <input
                    type="text"
                    placeholder="Buscar técnico por nome ou email..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl text-sm text-stone-700 dark:text-stone-300 placeholder-stone-400 dark:placeholder-stone-600 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
                {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Technicians Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {technicians.map((tech) => {
                    const stats = getTechStats(tech.id);
                    return (
                        <div key={tech.id} className="bg-white dark:bg-stone-900 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-800 hover:shadow-md transition-all group overflow-hidden">
                            <div className="p-5">
                                {/* Profile */}
                                <div className="flex items-center gap-4 mb-5">
                                    <div className={clsx("w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-sm shadow-sm group-hover:scale-105 transition-transform duration-300", getAvatarColor(tech.id))}>
                                        {getInitials(tech.name)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-stone-800 dark:text-stone-100 truncate">{tech.name}</h3>
                                        <div className="flex items-center text-stone-500 dark:text-stone-400 text-sm mt-0.5">
                                            <Mail className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                                            <span className="truncate">{tech.email}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Order Stats */}
                                <div className="grid grid-cols-3 gap-2 mb-4">
                                    <div className="text-center px-2 py-2 bg-stone-50 dark:bg-stone-950/30 rounded-lg">
                                        <div className="flex items-center justify-center gap-1 mb-0.5">
                                            <ClipboardList className="w-3 h-3 text-stone-400 dark:text-stone-600" />
                                            <span className="text-sm font-bold text-stone-700 dark:text-stone-300">{stats.total}</span>
                                        </div>
                                        <p className="text-[0.6rem] text-stone-400 dark:text-stone-500 font-medium uppercase tracking-wide">Total</p>
                                    </div>
                                    <div className="text-center px-2 py-2 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                                        <div className="flex items-center justify-center gap-1 mb-0.5">
                                            <Clock className="w-3 h-3 text-blue-500 dark:text-blue-400" />
                                            <span className="text-sm font-bold text-blue-700 dark:text-blue-400">{stats.inProgress}</span>
                                        </div>
                                        <p className="text-[0.6rem] text-stone-400 dark:text-stone-500 font-medium uppercase tracking-wide">Ativas</p>
                                    </div>
                                    <div className="text-center px-2 py-2 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg">
                                        <div className="flex items-center justify-center gap-1 mb-0.5">
                                            <CheckCircle className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                                            <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{stats.completed}</span>
                                        </div>
                                        <p className="text-[0.6rem] text-stone-400 dark:text-stone-500 font-medium uppercase tracking-wide">Feitas</p>
                                    </div>
                                </div>

                                {/* Workload bar */}
                                {stats.total > 0 && (
                                    <div className="mb-1">
                                        <div className="flex justify-between items-center mb-1.5">
                                            <span className="text-[0.65rem] font-medium text-stone-400 dark:text-stone-500 uppercase tracking-wide">Conclusão</span>
                                            <span className="text-[0.65rem] font-bold text-emerald-600 dark:text-emerald-400">
                                                {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                                            </span>
                                        </div>
                                        <div className="w-full h-1.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-emerald-500 rounded-full transition-all duration-500 ease-out"
                                                style={{ width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="px-5 py-2.5 bg-stone-50 dark:bg-stone-950/30 border-t border-stone-100 dark:border-stone-800 flex justify-between items-center">
                                <span className="text-xs font-medium px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400 rounded-full border border-emerald-100 dark:border-emerald-900/20">
                                    Ativo
                                </span>
                                {isAdmin && (
                                    <>
                                        {deleteTarget === tech.id ? (
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-red-500 dark:text-red-400">Excluir?</span>
                                                <button
                                                    onClick={() => handleDelete(tech.id)}
                                                    disabled={deleteLoading}
                                                    className="text-xs px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg font-semibold transition-colors disabled:opacity-60"
                                                >
                                                    {deleteLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Sim'}
                                                </button>
                                                <button
                                                    onClick={() => setDeleteTarget(null)}
                                                    className="text-xs px-2 py-1 bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400 rounded-lg font-semibold hover:bg-stone-300 dark:hover:bg-stone-700 transition-colors"
                                                >
                                                    Não
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setDeleteTarget(tech.id)}
                                                className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                                                title="Excluir técnico"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}

                {technicians.length === 0 && (
                    <div className="col-span-full py-16 text-center bg-stone-50 dark:bg-stone-950/20 rounded-2xl border border-dashed border-stone-300 dark:border-stone-800">
                        <div className="w-12 h-12 bg-white dark:bg-stone-900 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                            <Users className="w-6 h-6 text-stone-300 dark:text-stone-600" />
                        </div>
                        <h3 className="text-lg font-bold text-stone-700 dark:text-stone-300">
                            {searchQuery ? 'Nenhum resultado' : 'Nenhum técnico cadastrado'}
                        </h3>
                        <p className="text-stone-500 dark:text-stone-500 max-w-xs mx-auto mt-2">
                            {searchQuery ? 'Tente buscar por outro nome ou email.' : isAdmin ? 'Clique em "Novo Técnico" para adicionar.' : 'Técnicos aparecerão aqui quando cadastrados.'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
