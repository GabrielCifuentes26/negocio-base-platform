declare const Deno: {
  env: {
    get: (name: string) => string | undefined;
  };
  serve: (handler: (request: Request) => Response | Promise<Response>) => void;
};

type InvitationEmailPayload = {
  inviteLink?: string;
  email?: string;
  fullName?: string | null;
  roleName?: string;
  businessName?: string;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function buildEmailHtml(payload: Required<Pick<InvitationEmailPayload, "inviteLink" | "email" | "roleName" | "businessName">> & {
  fullName: string | null;
}) {
  const greetingName = payload.fullName || payload.email;

  return `
    <div style="font-family: Arial, sans-serif; background:#f8fafc; padding:32px;">
      <div style="max-width:560px; margin:0 auto; background:#ffffff; border-radius:24px; padding:32px; border:1px solid #e2e8f0;">
        <p style="font-size:12px; letter-spacing:0.18em; text-transform:uppercase; color:#64748b; margin:0 0 16px;">
          Invitacion a la plataforma
        </p>
        <h1 style="font-size:28px; line-height:1.2; color:#0f172a; margin:0 0 16px;">
          ${payload.businessName} te invito a su espacio de trabajo
        </h1>
        <p style="font-size:15px; line-height:1.7; color:#334155; margin:0 0 12px;">
          Hola ${greetingName},
        </p>
        <p style="font-size:15px; line-height:1.7; color:#334155; margin:0 0 12px;">
          Tu acceso fue preparado con el rol <strong>${payload.roleName}</strong>. Usa el siguiente boton para iniciar sesion y aceptar la invitacion.
        </p>
        <div style="margin:28px 0;">
          <a href="${payload.inviteLink}" style="display:inline-block; background:#0f766e; color:#f8fffd; text-decoration:none; border-radius:999px; padding:14px 22px; font-weight:600;">
            Aceptar invitacion
          </a>
        </div>
        <p style="font-size:13px; line-height:1.7; color:#64748b; margin:0 0 12px;">
          Si el boton no funciona, copia y pega este enlace:
        </p>
        <p style="font-size:13px; line-height:1.7; color:#0f172a; word-break:break-all; margin:0;">
          ${payload.inviteLink}
        </p>
      </div>
    </div>
  `;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Metodo no permitido." }, 405);
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const invitationFromEmail = Deno.env.get("INVITATION_FROM_EMAIL");

    if (!resendApiKey || !invitationFromEmail) {
      return jsonResponse(
        {
          error: "Faltan RESEND_API_KEY o INVITATION_FROM_EMAIL en la configuracion de la funcion.",
        },
        500,
      );
    }

    const payload = (await request.json()) as InvitationEmailPayload;

    if (!payload.inviteLink || !payload.email || !payload.roleName || !payload.businessName) {
      return jsonResponse({ error: "El cuerpo de la solicitud esta incompleto." }, 400);
    }

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: invitationFromEmail,
        to: [payload.email],
        subject: `Invitacion a ${payload.businessName}`,
        html: buildEmailHtml({
          inviteLink: payload.inviteLink,
          email: payload.email,
          fullName: payload.fullName ?? null,
          roleName: payload.roleName,
          businessName: payload.businessName,
        }),
      }),
    });

    if (!resendResponse.ok) {
      const responseText = await resendResponse.text();
      return jsonResponse(
        {
          error: "No se pudo enviar el correo.",
          details: responseText,
        },
        502,
      );
    }

    return jsonResponse({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido al enviar la invitacion.";
    return jsonResponse({ error: message }, 500);
  }
});
