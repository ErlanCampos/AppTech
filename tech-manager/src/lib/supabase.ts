import { createClient } from '@supabase/supabase-js';

// These environment variables will need to be set in a .env file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isValidConfig = supabaseUrl && supabaseKey && supabaseUrl !== 'YOUR_SUPABASE_URL_HERE';

if (!isValidConfig) {
    console.warn('Supabase URL or Key is missing or invalid! Check your .env file. using mock client.');
}

// Mock client internals
let _authChangeCallback: any = null;
let _mockSession: any = null;

function createMockSession(email: string, name: string, role: string = 'admin') {
    const userId = crypto.randomUUID();
    return {
        access_token: 'mock-token-' + userId,
        user: {
            id: userId,
            email,
            user_metadata: { full_name: name, role },
        }
    };
}

const mockClient = {
    auth: {
        onAuthStateChange: (callback: any) => {
            _authChangeCallback = callback;
            // Fire initial state
            setTimeout(() => callback(_mockSession ? 'SIGNED_IN' : 'SIGNED_OUT', _mockSession), 0);
            return { data: { subscription: { unsubscribe: () => { _authChangeCallback = null; } } } };
        },
        getSession: async () => ({ data: { session: _mockSession }, error: null }),
        signInWithPassword: async ({ email }: { email: string; password: string }) => {
            _mockSession = createMockSession(email, email.split('@')[0], 'admin');
            if (_authChangeCallback) {
                setTimeout(() => _authChangeCallback('SIGNED_IN', _mockSession), 0);
            }
            return { data: { session: _mockSession, user: _mockSession.user }, error: null };
        },
        signUp: async ({ email, options }: any) => {
            _mockSession = createMockSession(
                email,
                options?.data?.full_name || email.split('@')[0],
                options?.data?.role || 'technician'
            );
            if (_authChangeCallback) {
                setTimeout(() => _authChangeCallback('SIGNED_IN', _mockSession), 0);
            }
            return { data: { session: _mockSession, user: _mockSession.user }, error: null };
        },
        signOut: async () => {
            _mockSession = null;
            if (_authChangeCallback) {
                setTimeout(() => _authChangeCallback('SIGNED_OUT', null), 0);
            }
            return { error: null };
        },
    },
    from: () => ({
        select: () => ({
            eq: () => ({
                single: async () => ({ data: null, error: null }),
                order: () => ({ data: [], error: null }),
            }),
            order: () => ({ data: [], error: null }),
        }),
        insert: async () => ({ data: null, error: null }),
        update: async () => ({ data: null, error: null }),
        delete: () => ({
            eq: async () => ({ data: null, error: null }),
        }),
    })
} as any;

export const supabase = isValidConfig
    ? createClient(supabaseUrl, supabaseKey)
    : mockClient;
