// Role de RLS do Power BI do DeskRio (deixe vazio se o relatório não usa RLS)
const PBI_RLS_ROLE = Deno.env.get("PBI_RLS_ROLE") ?? "";

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

function buildCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "*";

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

function jsonResponse(req: Request, payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...buildCorsHeaders(req),
      "Content-Type": "application/json",
    },
  });
}

// Generic, safe error response. Internal details are logged server-side only.
function safeError(req: Request, message: string, status = 400) {
  return jsonResponse(req, { error: message }, status);
}

function logInternal(stage: string, value: unknown) {
  try {
    if (value instanceof Error) {
      console.error(`[${stage}]`, value.message);
    } else if (typeof value === "string") {
      console.error(`[${stage}]`, value);
    } else {
      console.error(`[${stage}]`, JSON.stringify(value));
    }
  } catch {
    console.error(`[${stage}] <unserializable error>`);
  }
}

Deno.serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const tenantId = Deno.env.get("POWERBI_TENANT_ID");
    const clientId = Deno.env.get("POWERBI_CLIENT_ID");
    const clientSecret = Deno.env.get("POWERBI_CLIENT_SECRET");
    const defaultWorkspaceId = Deno.env.get("POWERBI_WORKSPACE_ID");

    const missingSecrets = [
      ["SUPABASE_URL", supabaseUrl],
      ["SUPABASE_ANON_KEY", supabaseAnonKey],
      ["POWERBI_TENANT_ID", tenantId],
      ["POWERBI_CLIENT_ID", clientId],
      ["POWERBI_CLIENT_SECRET", clientSecret],
      ["POWERBI_WORKSPACE_ID", defaultWorkspaceId],
    ]
      .filter(([, value]) => !value)
      .map(([name]) => name);

    if (missingSecrets.length > 0) {
      logInternal("config", `Secrets ausentes: ${missingSecrets.join(", ")}`);
      return safeError(req, "Erro interno do servidor.", 500);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return safeError(req, "Não autorizado.", 401);
    }

    const supabase = createClient(supabaseUrl!, supabaseAnonKey!, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      logInternal("auth", userError?.message || "Token sem usuário associado.");
      return safeError(req, "Não autorizado.", 401);
    }

    // Any authenticated user who reached this function (and passed route/menu guards
    // on the client) is allowed to obtain a Power BI embed token. Role-based access
    // control is enforced at the route and sidebar level, not inside the embed.

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return safeError(req, "Requisição inválida.", 400);
    }

    const { reportId, workspaceId, isPaginated } = (body || {}) as {
      reportId?: string;
      workspaceId?: string;
      isPaginated?: boolean;
    };

    if (!reportId || typeof reportId !== "string") {
      return safeError(req, "Requisição inválida.", 400);
    }

    const groupId = (typeof workspaceId === "string" && workspaceId) || defaultWorkspaceId!;

    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    const tokenParams = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId!,
      client_secret: clientSecret!,
      scope: "https://analysis.windows.net/powerbi/api/.default",
    });

    const tokenRes = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenParams.toString(),
    });

    if (!tokenRes.ok) {
      const upstream = await tokenRes.text();
      logInternal("azure_ad", `${tokenRes.status} ${upstream}`);
      return safeError(req, "Falha ao autenticar com o provedor.", 502);
    }

    const { access_token } = await tokenRes.json();

    if (!access_token) {
      logInternal("azure_ad", "Azure AD não retornou access_token.");
      return safeError(req, "Falha ao autenticar com o provedor.", 502);
    }

    const reportUrl = `https://api.powerbi.com/v1.0/myorg/groups/${groupId}/reports/${reportId}`;
    const reportRes = await fetch(reportUrl, {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!reportRes.ok) {
      const upstream = await reportRes.text();
      logInternal("report_details", `${reportRes.status} ${upstream}`);
      return safeError(req, "Não foi possível obter os detalhes do relatório.", 502);
    }

    const reportDetails = await reportRes.json();
    const embedUrl = reportDetails.embedUrl;
    const datasetId = reportDetails.datasetId;

    if (!embedUrl) {
      logInternal("report_details", "embedUrl ausente");
      return safeError(req, "Não foi possível obter os detalhes do relatório.", 502);
    }

    if (!isPaginated && !datasetId) {
      logInternal("report_details", "datasetId ausente");
      return safeError(req, "Não foi possível obter os detalhes do relatório.", 502);
    }

    const embedTokenUrl = `https://api.powerbi.com/v1.0/myorg/groups/${groupId}/reports/${reportId}/GenerateToken`;
    const embedHeaders = {
      Authorization: `Bearer ${access_token}`,
      "Content-Type": "application/json",
    };

    let embedTokenRes: Response;

    if (isPaginated) {
      const paginatedTokenUrl = `https://api.powerbi.com/v1.0/myorg/groups/${groupId}/reports/${reportId}/GenerateToken`;
      embedTokenRes = await fetch(paginatedTokenUrl, {
        method: "POST",
        headers: embedHeaders,
        body: JSON.stringify({ accessLevel: "View" }),
      });
      if (!embedTokenRes.ok) {
        const upstream = await embedTokenRes.text();
        logInternal("embed_token_paginated", `${paginatedTokenUrl} ${embedTokenRes.status} ${upstream}`);
        return safeError(req, "Não foi possível gerar o token de incorporação.", 502);
      }
    } else {
      // First try without identities (works for non-RLS datasets)
      const firstTry = await fetch(embedTokenUrl, {
        method: "POST",
        headers: embedHeaders,
        body: JSON.stringify({ accessLevel: "View" }),
      });

      embedTokenRes = firstTry;
      let firstBody = "";

      if (!firstTry.ok) {
        firstBody = await firstTry.text();
        const needsIdentity =
          firstBody.includes("EffectiveIdentity") ||
          firstBody.includes("identity") ||
          firstBody.includes("TokenAccessors_GenerateTokenCannotBeNullOrEmpty");

        if (needsIdentity) {
          const retryRes = await fetch(embedTokenUrl, {
            method: "POST",
            headers: embedHeaders,
            body: JSON.stringify({
              accessLevel: "View",
              identities: [
                {
                  username: user.email,
                  roles: PBI_RLS_ROLE ? [PBI_RLS_ROLE] : [],
                  datasets: [datasetId],
                },
              ],
            }),
          });
          embedTokenRes = retryRes;
        }

        if (!embedTokenRes.ok) {
          const upstream = embedTokenRes === firstTry ? firstBody : await embedTokenRes.text();
          logInternal("embed_token", `${embedTokenRes.status} ${upstream}`);
          return safeError(req, "Não foi possível gerar o token de incorporação.", 502);
        }
      }
    }

    const embedToken = await embedTokenRes.json();

    return jsonResponse(req, {
      accessToken: embedToken.token,
      embedUrl,
      expiry: embedToken.expiration,
      reportId,
    });
  } catch (err) {
    logInternal("unexpected", err);
    return safeError(req, "Erro interno do servidor.", 500);
  }
});
