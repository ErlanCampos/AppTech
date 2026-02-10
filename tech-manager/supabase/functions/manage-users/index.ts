import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, DELETE, OPTIONS",
};

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

        // Verify the caller is authenticated
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response(JSON.stringify({ error: "Missing authorization" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Create client with user's token to verify identity
        const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
            global: { headers: { Authorization: authHeader } },
        });

        const { data: { user: caller }, error: authError } = await userClient.auth.getUser();
        if (authError || !caller) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Check admin role from profiles table (not hardcoded email)
        const adminClient = createClient(supabaseUrl, serviceRoleKey);
        const { data: callerProfile } = await adminClient
            .from('profiles')
            .select('role')
            .eq('id', caller.id)
            .single();

        if (!callerProfile || callerProfile.role !== 'admin') {
            return new Response(JSON.stringify({ error: "Apenas administradores podem gerenciar técnicos" }), {
                status: 403,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        if (req.method === "POST") {
            const { email, password, full_name } = await req.json();

            if (!email || !password || !full_name) {
                return new Response(JSON.stringify({ error: "Email, senha e nome são obrigatórios" }), {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
            }

            const { data, error } = await adminClient.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: { full_name, role: "technician" },
            });

            if (error) {
                return new Response(JSON.stringify({ error: error.message }), {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
            }

            return new Response(JSON.stringify({ user: data.user }), {
                status: 201,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        if (req.method === "DELETE") {
            const { user_id } = await req.json();

            if (!user_id) {
                return new Response(JSON.stringify({ error: "user_id é obrigatório" }), {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
            }

            // Prevent deleting yourself
            if (user_id === caller.id) {
                return new Response(JSON.stringify({ error: "Não é possível excluir a si mesmo" }), {
                    status: 403,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
            }

            // Unassign technician from orders before deleting
            await adminClient
                .from('service_orders')
                .update({ assigned_technician_id: null })
                .eq('assigned_technician_id', user_id);

            const { error } = await adminClient.auth.admin.deleteUser(user_id);
            if (error) {
                return new Response(JSON.stringify({ error: error.message }), {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
            }

            return new Response(JSON.stringify({ success: true }), {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        return new Response(JSON.stringify({ error: "Method not allowed" }), {
            status: 405,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: (err as Error).message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
