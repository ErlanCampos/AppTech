import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class GlobalError extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    private handleReload = () => {
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-stone-900 p-8 rounded-2xl shadow-xl max-w-md w-full border border-stone-200 dark:border-stone-800 text-center">
                        <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="w-8 h-8 text-red-500 dark:text-red-400" />
                        </div>

                        <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100 mb-2">
                            Algo deu errado
                        </h1>

                        <p className="text-stone-600 dark:text-stone-400 mb-6">
                            Ocorreu um erro inesperado na aplicação. Nossos técnicos já foram notificados (mentira, olha o console).
                        </p>

                        {this.state.error && (
                            <div className="bg-red-50 dark:bg-red-950/30 p-4 rounded-xl mb-6 text-left overflow-auto max-h-32 border border-red-100 dark:border-red-900/30">
                                <p className="font-mono text-xs text-red-700 dark:text-red-300 break-words">
                                    {this.state.error.message}
                                </p>
                            </div>
                        )}

                        <button
                            onClick={this.handleReload}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all shadow-md hover:shadow-lg"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Recarregar Página
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
