import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

Deno.serve(async (req) => {
    try {
        const { record } = await req.json();

        // 1. Initialize Supabase Admin Client
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // 2. Fetch WhatsApp Config
        const { data: config, error: configError } = await supabase
            .from("whatsapp_config")
            .select("*")
            .single();

        if (configError || !config || !config.instance_id || !config.instance_token) {
            console.log("WhatsApp automation not configured or missing keys.");
            return new Response("Not configured", { status: 200 });
        }

        // 3. Prepare Message
        const whatsapp = record.whatsapp.replace(/\D/g, ""); // Remove non-digits
        const date = new Date(record.data_hora).toLocaleDateString("pt-BR");
        const time = new Date(record.data_hora).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
        });

        const message = `Olá ${record.nome_cliente || "Cliente"}! 👋 Seu agendamento de *${record.servico}* na *Felipe Barbearia* foi confirmado!\n\n📅 *Data:* ${date}\n⏰ *Horário:* ${time}\n\nAguardamos você! ✂️`;

        // 4. Send to Z-API
        const url = `${config.z_api_url}${config.instance_id}/token/${config.instance_token}/send-text`;

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "client-token": config.client_token || "",
            },
            body: JSON.stringify({
                phone: `55${whatsapp}`,
                message: message,
            }),
        });

        const result = await response.json();

        // 5. Update agendamento status
        if (response.ok) {
            await supabase
                .from("agendamentos")
                .update({ whatsapp_notificado: true })
                .eq("id", record.id);
        }

        return new Response(JSON.stringify(result), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
});
