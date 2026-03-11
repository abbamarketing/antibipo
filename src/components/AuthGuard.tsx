import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Zap } from "lucide-react";

async function storeGoogleTokens(userId: string, providerToken: string, providerRefreshToken?: string | null) {
  try {
    await supabase.from("configuracoes").upsert(
      {
        user_id: userId,
        chave: "google_tokens",
        valor: {
          access_token: providerToken,
          refresh_token: providerRefreshToken || null,
          updated_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,chave" }
    );
    console.log("Google tokens stored for Gemini API access");
  } catch (e) {
    console.error("Failed to store Google tokens:", e);
  }
}

export function AuthGuard({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!session) {
        navigate("/auth", { replace: true });
      } else {
        setReady(true);
        // Capture provider tokens on OAuth sign-in (only available right after callback)
        if (event === "SIGNED_IN" && session.provider_token) {
          await storeGoogleTokens(
            session.user.id,
            session.provider_token,
            session.provider_refresh_token
          );
        }
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/auth", { replace: true });
      else setReady(true);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Zap className="w-6 h-6 text-primary animate-pulse" />
      </div>
    );
  }

  return <>{children}</>;
}
