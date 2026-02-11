import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kadjzzzlgrcjfgwqebmn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthZGp6enpsZ3JjamZnd3FlYm1uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3Njg3ODAsImV4cCI6MjA4NjM0NDc4MH0.x7W2MAKY2iMATibiPW3U4k6GonSVZ_64WHxue2ubuIA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    }
});
