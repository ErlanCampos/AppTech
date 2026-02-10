import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Session, AuthChangeEvent } from '@supabase/supabase-js';

// These environment variables will need to be set in a .env file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isValidConfig = supabaseUrl && supabaseKey && supabaseUrl !== 'YOUR_SUPABASE_URL_HERE';

if (!isValidConfig) {
    console.warn('Supabase URL or Key is missing or invalid! Check your .env file. using mock client.');
}

// Mock client internals
type AuthCallback = (event: AuthChangeEvent, session: Session | null) => void;
let _authChangeCallback: AuthCallback | null = null;
let _mockSession: Session | null = null;

function createMockSession(email: string, name: string, role: string = 'admin'): Session {
    const userId = crypto.randomUUID();
    return {
        access_token: 'mock-token-' + userId,
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'mock-refresh-token',
        user: {
            id: userId,
            email,
            aud: 'authenticated',
            app_metadata: { provider: 'email' },
            user_metadata: { full_name: name, role },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        }
    };
}

const mockClient = {
    auth: {
        onAuthStateChange: (callback: AuthCallback) => {
            _authChangeCallback = callback;
            // Fire initial state
            setTimeout(() => _authChangeCallback?.(_mockSession ? 'SIGNED_IN' : 'SIGNED_OUT', _mockSession), 0);
            return { data: { subscription: { unsubscribe: () => { _authChangeCallback = null; } } } };
        },
        getSession: async () => ({ data: { session: _mockSession }, error: null }),
        signInWithPassword: async ({ email }: { email: string; password: string }) => {
            _mockSession = createMockSession(email, email.split('@')[0], 'admin');
            if (_authChangeCallback) {
                setTimeout(() => _authChangeCallback?.('SIGNED_IN', _mockSession), 0);
            }
            return { data: { session: _mockSession, user: _mockSession.user }, error: null };
        },
        signUp: async ({ email, options }: { email: string; options?: { data?: { full_name?: string; role?: string } } }) => {
            _mockSession = createMockSession(
                email,
                options?.data?.full_name || email.split('@')[0],
                options?.data?.role || 'technician'
            );
            if (_authChangeCallback) {
                setTimeout(() => _authChangeCallback?.('SIGNED_IN', _mockSession), 0);
            }
            return { data: { session: _mockSession, user: _mockSession.user }, error: null };
        },
        signOut: async () => {
            _mockSession = null;
            if (_authChangeCallback) {
                setTimeout(() => _authChangeCallback?.('SIGNED_OUT', null), 0);
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
} as unknown as SupabaseClient;

export const supabase = isValidConfig
    ? createClient(supabaseUrl, supabaseKey)
    : mockClient;
