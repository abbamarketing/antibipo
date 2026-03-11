/**
 * Shared helper for calling Google Gemini API using user's OAuth token.
 * Falls back gracefully — returns null if user token unavailable.
 */

interface GeminiMessage {
  role: string;
  content: string;
}

interface GeminiToolDef {
  type: string;
  function: {
    name: string;
    description: string;
    parameters: any;
  };
}

export interface GeminiOptions {
  messages: GeminiMessage[];
  tools?: GeminiToolDef[];
  tool_choice?: { type: string; function: { name: string } };
  model?: string; // e.g. "gemini-2.0-flash" (default)
}

export interface GeminiResult {
  text?: string;
  toolCall?: { name: string; arguments: string };
}

// ── Token management ──────────────────────────────────────────────

export async function getGoogleTokens(
  supabase: any,
  userId: string
): Promise<{ access_token: string; refresh_token: string | null } | null> {
  const { data } = await supabase
    .from("configuracoes")
    .select("valor")
    .eq("user_id", userId)
    .eq("chave", "google_tokens")
    .maybeSingle();
  return data?.valor ?? null;
}

async function refreshGoogleToken(refreshToken: string): Promise<string | null> {
  const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
  if (!clientId || !clientSecret || !refreshToken) return null;

  try {
    const resp = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });
    if (!resp.ok) {
      console.error("Token refresh failed:", resp.status, await resp.text());
      return null;
    }
    const data = await resp.json();
    return data.access_token || null;
  } catch (e) {
    console.error("Token refresh error:", e);
    return null;
  }
}

// ── Format conversion (OpenAI-style → Gemini native) ─────────────

function convertSchemaTypes(schema: any): any {
  if (!schema || typeof schema !== "object") return schema;
  const result: any = { ...schema };
  if (typeof result.type === "string") result.type = result.type.toUpperCase();
  if (result.properties) {
    const p: any = {};
    for (const [k, v] of Object.entries(result.properties)) p[k] = convertSchemaTypes(v);
    result.properties = p;
  }
  if (result.items) result.items = convertSchemaTypes(result.items);
  if (result.enum && result.type === "NUMBER") {
    // Gemini doesn't support enum on numbers, convert to description
    delete result.enum;
  }
  delete result.additionalProperties;
  return result;
}

function toGeminiBody(opts: GeminiOptions) {
  const systemMsg = opts.messages.find((m) => m.role === "system");
  const contents = opts.messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  const body: any = { contents };
  if (systemMsg) body.systemInstruction = { parts: [{ text: systemMsg.content }] };

  if (opts.tools?.length) {
    body.tools = [
      {
        functionDeclarations: opts.tools.map((t) => ({
          name: t.function.name,
          description: t.function.description,
          parameters: convertSchemaTypes(t.function.parameters),
        })),
      },
    ];
    if (opts.tool_choice?.function?.name) {
      body.toolConfig = {
        functionCallingConfig: {
          mode: "ANY",
          allowedFunctionNames: [opts.tool_choice.function.name],
        },
      };
    }
  }
  return body;
}

function parseGeminiResponse(data: any): GeminiResult | null {
  const parts = data?.candidates?.[0]?.content?.parts;
  if (!parts?.length) return null;

  const fc = parts.find((p: any) => p.functionCall);
  if (fc) {
    return {
      toolCall: {
        name: fc.functionCall.name,
        arguments: JSON.stringify(fc.functionCall.args),
      },
    };
  }
  const tp = parts.find((p: any) => p.text);
  return tp ? { text: tp.text } : null;
}

// ── Core API call ─────────────────────────────────────────────────

async function callOnce(accessToken: string, opts: GeminiOptions): Promise<GeminiResult | null> {
  const model = opts.model || "gemini-2.0-flash";
  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(toGeminiBody(opts)),
    }
  );
  if (!resp.ok) {
    console.error(`Gemini ${resp.status}:`, await resp.text().catch(() => ""));
    return null;
  }
  return parseGeminiResponse(await resp.json());
}

// ── Public API ────────────────────────────────────────────────────

/**
 * Call Gemini using the user's stored OAuth token. Handles refresh automatically.
 * Returns null if no tokens or call fails — caller should fall back to Lovable AI.
 */
export async function callGeminiWithUserToken(
  supabase: any,
  userId: string,
  opts: GeminiOptions
): Promise<GeminiResult | null> {
  const tokens = await getGoogleTokens(supabase, userId);
  if (!tokens?.access_token) return null;

  // Try with current access token
  let result = await callOnce(tokens.access_token, opts);
  if (result) return result;

  // Token might be expired — try refresh
  if (tokens.refresh_token) {
    const newToken = await refreshGoogleToken(tokens.refresh_token);
    if (newToken) {
      await supabase.from("configuracoes").upsert(
        {
          user_id: userId,
          chave: "google_tokens",
          valor: {
            access_token: newToken,
            refresh_token: tokens.refresh_token,
            updated_at: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,chave" }
      );
      result = await callOnce(newToken, opts);
      if (result) return result;
    }
  }

  return null;
}

/**
 * Extract user_id from the request's Authorization header.
 */
export async function getUserIdFromRequest(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return null;

  const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}
