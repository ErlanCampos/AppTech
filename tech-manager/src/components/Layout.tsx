
import { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { LayoutDashboard, Calendar, Map as MapIcon, LogOut, Users, ClipboardList, Moon, Sun, Menu, X } from 'lucide-react';
import clsx from 'clsx';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const NavItem = ({ to, icon: Icon, label, onClick }: { to: string, icon: any, label: string, onClick?: () => void }) => (
    <NavLink
        to={to}
        onClick={onClick}
        className={({ isActive }) =>
            clsx(
                "flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group relative overflow-hidden",
                isActive
                    ? "bg-emerald-900/10 dark:bg-emerald-500/10 text-emerald-900 dark:text-emerald-400 shadow-sm"
                    : "text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-emerald-900 dark:hover:text-emerald-400"
            )
        }
    >
        {({ isActive }) => (
            <>
                <div className={clsx(
                    "absolute left-0 top-0 bottom-0 w-1 rounded-r-full transition-all duration-300",
                    isActive ? "bg-emerald-800 dark:bg-emerald-500" : "bg-transparent group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900"
                )} />
                <Icon className={clsx("w-5 h-5 mr-3 transition-colors", isActive ? "text-emerald-800 dark:text-emerald-500" : "text-stone-400 dark:text-stone-500 group-hover:text-emerald-700 dark:group-hover:text-emerald-400")} />
                <span className="relative z-10">{label}</span>
            </>
        )}
    </NavLink>
);

export const Layout = () => {
    const { currentUser, logout, theme, toggleTheme, fetchData } = useAppStore();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        if (!currentUser) {
            navigate('/login');
        } else {
            // Carregar dados assim que o usuário estiver autenticado e o layout montar
            console.log('Layout montado: Iniciando fetchData...');
            fetchData();
        }
    }, [currentUser, navigate, fetchData]);

    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    }, [theme]);

    if (!currentUser) {
        return null;
    }

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const closeSidebar = () => setSidebarOpen(false);

    return (
        <div className="flex h-screen bg-stone-50 dark:bg-stone-950 font-sans transition-colors duration-300">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-30 md:hidden animate-[fadeIn_0.2s_ease-out]"
                    onClick={closeSidebar}
                />
            )}

            {/* Sidebar */}
            <aside className={clsx(
                "fixed md:relative z-40 w-72 h-full bg-white dark:bg-stone-900 flex flex-col border-r border-stone-200 dark:border-stone-800 shadow-[4px_0_24px_-4px_rgba(0,0,0,0.05)] transition-all duration-300",
                sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
            )}>
                <div className="p-8 border-b border-stone-100 dark:border-stone-800">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-emerald-950 dark:text-emerald-500 flex items-center tracking-tight">
                            <div className="p-2 bg-gradient-to-br from-emerald-800 to-stone-800 dark:from-emerald-600 dark:to-stone-900 rounded-lg mr-3 shadow-lg">
                                <LayoutDashboard className="w-5 h-5 text-white" />
                            </div>
                            TechManager
                        </h1>
                        <button
                            onClick={closeSidebar}
                            className="md:hidden p-2 rounded-lg text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                            aria-label="Fechar menu"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="mt-6 flex items-center p-3 bg-stone-50 dark:bg-stone-950/50 rounded-xl border border-stone-100 dark:border-stone-800">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-800 dark:text-emerald-400 font-bold text-lg border-2 border-white dark:border-stone-700 shadow-sm">
                            {currentUser.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-3 overflow-hidden">
                            <p className="text-sm font-semibold text-stone-800 dark:text-stone-200 truncate">{currentUser.name}</p>
                            <p className="text-xs text-stone-500 dark:text-stone-500 uppercase tracking-wider font-medium">
                                {currentUser.role === 'admin' ? 'Administrador' : 'Técnico'}
                            </p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 px-6 py-6 space-y-2 overflow-y-auto">
                    {currentUser.role === 'admin' ? (
                        <>
                            <div className="px-4 py-2 text-xs font-bold text-stone-400 dark:text-stone-600 uppercase tracking-widest">Painel</div>
                            <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" onClick={closeSidebar} />

                            <div className="px-4 py-2 mt-4 text-xs font-bold text-stone-400 dark:text-stone-600 uppercase tracking-widest">Gerenciamento</div>
                            <NavItem to="/technicians" icon={Users} label="Técnicos" onClick={closeSidebar} />
                            <NavItem to="/orders" icon={ClipboardList} label="Ordens de Serviço" onClick={closeSidebar} />
                        </>
                    ) : (
                        <>
                            <div className="px-4 py-2 text-xs font-bold text-stone-400 dark:text-stone-600 uppercase tracking-widest">Minha Área</div>
                            <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" onClick={closeSidebar} />
                            <NavItem to="/my-tasks" icon={ClipboardList} label="Minhas Tarefas" onClick={closeSidebar} />
                        </>
                    )}

                    <div className="px-4 py-2 mt-6 text-xs font-bold text-stone-400 dark:text-stone-600 uppercase tracking-widest">Ferramentas</div>
                    <NavItem to="/calendar" icon={Calendar} label="Calendário" onClick={closeSidebar} />
                    <NavItem to="/map" icon={MapIcon} label="Mapa" onClick={closeSidebar} />
                </nav>

                <div className="p-6 border-t border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900 space-y-3">
                    <button
                        onClick={toggleTheme}
                        className="flex items-center w-full px-4 py-3 text-sm font-medium text-stone-600 dark:text-stone-400 hover:text-emerald-800 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 rounded-xl transition-all duration-200 group"
                        aria-label={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
                    >
                        {theme === 'light' ? (
                            <>
                                <Moon className="w-5 h-5 mr-3 text-stone-400 dark:text-stone-500 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors" />
                                Modo Escuro
                            </>
                        ) : (
                            <>
                                <Sun className="w-5 h-5 mr-3 text-stone-400 dark:text-stone-500 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors" />
                                Modo Claro
                            </>
                        )}
                    </button>

                    <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-3 text-sm font-medium text-stone-600 dark:text-stone-400 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all duration-200 group"
                        aria-label="Sair do sistema"
                    >
                        <LogOut className="w-5 h-5 mr-3 text-stone-400 dark:text-stone-500 group-hover:text-red-500 transition-colors" />
                        Sair do Sistema
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto relative">
                {/* Mobile header */}
                <div className="sticky top-0 z-20 md:hidden flex items-center px-4 py-3 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 rounded-lg text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                        aria-label="Abrir menu"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                    <h1 className="ml-3 text-lg font-bold text-emerald-950 dark:text-emerald-500 tracking-tight">TechManager</h1>
                </div>

                {/* Background Pattern */}
                <div className="fixed inset-0 pointer-events-none opacity-[0.015] dark:opacity-[0.05] dark:invert"
                    style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, black 1px, transparent 0)', backgroundSize: '24px 24px' }}>
                </div>

                <div className="max-w-7xl mx-auto relative z-10 transition-colors duration-300 p-6 md:p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
