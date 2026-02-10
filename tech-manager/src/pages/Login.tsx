import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useNavigate } from 'react-router-dom';
import { Wrench, Lock, Mail, User as UserIcon, Loader2 } from 'lucide-react';

import { supabase } from '../lib/supabase';

export const Login = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');


    const currentUser = useAppStore(state => state.currentUser);
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (currentUser) {
            navigate('/dashboard');
        }
    }, [currentUser, navigate]);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setMessage('');

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email: email.trim(),
                    password,
                });
                if (error) throw error;
            } else {
                const { data, error } = await supabase.auth.signUp({
                    email: email.trim(),
                    password,
                    options: {
                        data: {
                            full_name: fullName,
                            role: 'technician',
                        },
                    },
                });
                if (error) throw error;

                if (data.session) {
                    return;
                }

                setMessage('Conta criada com sucesso! Faça login.');
                setIsLogin(true);
                setPassword('');
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Ocorreu um erro na autenticação';
            if (msg.includes('User already registered')) {
                setError('Este email já está cadastrado. Faça login.');
            } else if (msg.includes('Invalid login credentials')) {
                setError('Email ou senha incorretos.');
            } else if (msg.includes('Email not confirmed')) {
                setError('Email não confirmado. Verifique sua caixa de entrada.');
            } else {
                setError(msg);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-stone-950 relative overflow-hidden">
            {/* Abstract Background Shapes */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-emerald-900/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] bg-stone-800/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
                <div className="absolute -bottom-[10%] left-[20%] w-[30%] h-[30%] bg-emerald-800/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
            </div>

            <div className="bg-stone-900/50 backdrop-blur-lg border border-stone-800 p-8 rounded-2xl shadow-2xl w-full max-w-md relative z-10 animate-[fadeIn_0.5s_ease-out]">
                <div className="flex justify-center mb-8">
                    <div className="bg-gradient-to-br from-emerald-700 to-stone-700 p-4 rounded-2xl shadow-lg transform hover:scale-105 transition-transform duration-300">
                        <Wrench className="w-10 h-10 text-white" />
                    </div>
                </div>

                <h2 className="text-3xl font-bold text-center text-white mb-2 tracking-tight">
                    {isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}
                </h2>
                <p className="text-stone-400 text-center mb-8">
                    {isLogin ? 'Faça login para gerenciar suas operações' : 'Preencha os dados para começar'}
                </p>

                <form onSubmit={handleAuth} className="space-y-5">
                    {!isLogin && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-stone-300 mb-1">Nome Completo</label>
                                <div className="relative">
                                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-500" />
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-stone-950/50 border border-stone-800 rounded-xl text-white placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
                                        placeholder="Seu Nome"
                                        required
                                    />
                                </div>
                            </div>


                        </>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-stone-300 mb-1">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-500" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-stone-950/50 border border-stone-800 rounded-xl text-white placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
                                placeholder="seu@email.com"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-stone-300 mb-1">Senha</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-500" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-stone-950/50 border border-stone-800 rounded-xl text-white placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
                                placeholder="••••••••"
                                required
                                minLength={6}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="border rounded-lg p-3 text-sm text-center bg-red-900/20 border-red-500/30 text-red-300">
                            {error}
                        </div>
                    )}

                    {message && (
                        <div className="border rounded-lg p-3 text-sm text-center bg-emerald-900/20 border-emerald-500/30 text-emerald-300">
                            {message}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-600 hover:to-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-stone-900 focus:ring-emerald-500 transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            isLogin ? 'Entrar' : 'Criar Conta'
                        )}
                    </button>
                </form>

                <div className="mt-6 pt-6 border-t border-stone-800 text-center">
                    <button
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setError('');
                            setMessage('');
                        }}
                        className="text-stone-400 hover:text-emerald-400 text-sm transition-colors"
                    >
                        {isLogin ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Entre'}
                    </button>
                </div>
            </div>
        </div>
    );
};
