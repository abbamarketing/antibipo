import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Zap } from "lucide-react";

export default function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        navigate("/", { replace: true });
      }
      setChecking(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/", { replace: true });
      else setChecking(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    setError("");

    if (isSignUp) {
      const { error: err } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
      });
      if (err) {
        setError(err.message);
        setLoading(false);
      }
    } else {
      const { error: err } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });
      if (err) {
        setError(err.message === "Invalid login credentials" ? "Email ou senha incorretos." : err.message);
        setLoading(false);
      }
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Zap className="w-6 h-6 text-primary animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div>
          <h1 className="font-mono text-2xl font-bold tracking-tight">LifeBit</h1>
          <p className="text-sm text-muted-foreground font-body mt-2">
            Saúde mental, um dia de cada vez.
          </p>
        </div>

        <div className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            className="w-full py-3 px-4 rounded-lg border bg-card text-foreground font-body text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground"
            autoFocus
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="Senha"
            className="w-full py-3 px-4 rounded-lg border bg-card text-foreground font-body text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground"
          />

          {error && (
            <p className="text-sm text-destructive font-body">{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || !email.trim() || !password.trim()}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 font-mono text-sm tracking-wider"
          >
            {loading ? "ENTRANDO..." : isSignUp ? "CRIAR CONTA" : "ENTRAR"}
          </button>
        </div>

        <button
          onClick={() => { setIsSignUp(!isSignUp); setError(""); }}
          className="text-xs text-muted-foreground hover:text-primary font-mono transition-colors"
        >
          {isSignUp ? "Já tem conta? Entrar" : "Não tem conta? Criar"}
        </button>
      </div>
    </div>
  );
}
