import type { ReactNode } from "react";

/** Reusable glass-card wrapper – 24px radius + heavy blur */
export function GlassCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl bg-card/40 backdrop-blur-xl shadow-sm border border-border/20 ${className}`}>
      {children}
    </div>
  );
}
