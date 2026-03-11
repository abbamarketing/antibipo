import { useCalendarStore } from "@/lib/calendar-store";
import { brasiliaTime } from "@/lib/brasilia";
import { Clock, MapPin, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function TodayEvents() {
  const now = brasiliaTime();
  const { todayMeetings } = useCalendarStore(now.getFullYear(), now.getMonth() + 1);
  const navigate = useNavigate();

  if (!todayMeetings || todayMeetings.length === 0) return null;

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
          Agenda de hoje
        </span>
        <button
          onClick={() => navigate("/calendario")}
          className="font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-0.5"
        >
          ver tudo <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      <div className="space-y-2">
        {todayMeetings.map((r) => (
          <button
            key={r.id}
            onClick={() => navigate("/calendario")}
            className="w-full text-left bg-card border rounded-lg px-3 py-2.5 flex items-start gap-3 hover:bg-secondary/50 transition-colors"
          >
            <div
              className="w-1 rounded-full self-stretch mt-0.5 shrink-0"
              style={{ backgroundColor: r.cor || "hsl(var(--primary))" }}
            />
            <div className="flex-1 min-w-0">
              <p className="font-mono text-xs font-medium truncate">{r.titulo}</p>
              <div className="flex items-center gap-3 mt-1 text-muted-foreground">
                <span className="flex items-center gap-1 font-mono text-[10px]">
                  <Clock className="w-3 h-3" />
                  {r.hora_inicio?.slice(0, 5)}
                  {r.hora_fim && ` – ${r.hora_fim.slice(0, 5)}`}
                </span>
                {r.local && (
                  <span className="flex items-center gap-1 font-mono text-[10px] truncate">
                    <MapPin className="w-3 h-3 shrink-0" />
                    {r.local}
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
