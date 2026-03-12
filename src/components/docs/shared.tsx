import React from "react";

export function DocCard({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <section className="bg-card rounded-lg border p-4 mb-3">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-primary" />
        <h2 className="font-mono text-xs font-semibold tracking-wider uppercase">{title}</h2>
      </div>
      <div className="space-y-2 text-xs text-foreground/80 leading-relaxed">{children}</div>
    </section>
  );
}

export function Step({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div className="flex gap-3 py-1.5">
      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary font-mono text-[10px] flex items-center justify-center font-bold">{n}</span>
      <div>
        <p className="font-mono text-[11px] font-medium text-foreground">{title}</p>
        <p className="text-muted-foreground text-[10px] mt-0.5">{desc}</p>
      </div>
    </div>
  );
}
