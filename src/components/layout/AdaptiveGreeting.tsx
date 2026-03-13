/** Adaptive micro-copy based on dayScore */
export function AdaptiveGreeting({ dayScore }: { dayScore: number; alertLevel: string }) {
  let message: string;
  if (dayScore >= 75) {
    message = "Você está voando hoje! Aproveite o momentum.";
  } else if (dayScore >= 50) {
    message = "Dia estável. Mantenha o ritmo, sem pressa.";
  } else if (dayScore >= 30) {
    message = "Um passo de cada vez hoje. Tudo bem ir devagar.";
  } else {
    message = "Dia de cuidar de si. Só o essencial, sem cobranças.";
  }

  return (
    <p className="font-body text-xs text-foreground/70 leading-relaxed">
      {message}
    </p>
  );
}
