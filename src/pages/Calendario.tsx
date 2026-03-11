import { useState } from "react";
import { useCalendarStore, Reuniao } from "@/lib/calendar-store";
import { ArrowLeft, ChevronLeft, ChevronRight, Plus, X, Clock, MapPin, Users, Trash2, Video, Phone, CalendarDays } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";

const tipoConfig: Record<string, { label: string; icon: typeof Video; color: string }> = {
  reuniao: { label: "Reuniao", icon: Users, color: "bg-blue-500" },
  consulta: { label: "Consulta", icon: Plus, color: "bg-green-500" },
  call: { label: "Call", icon: Phone, color: "bg-purple-500" },
  evento: { label: "Evento", icon: CalendarDays, color: "bg-orange-500" },
  outro: { label: "Outro", icon: Clock, color: "bg-muted-foreground" },
};

export default function Calendario() {
  const navigate = useNavigate();
  const now = new Date();
  const [ano, setAno] = useState(now.getFullYear());
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState<number | null>(now.getDate());
  const [showAdd, setShowAdd] = useState(false);

  // New meeting form
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [horaInicio, setHoraInicio] = useState("09:00");
  const [horaFim, setHoraFim] = useState("10:00");
  const [local, setLocal] = useState("");
  const [tipo, setTipo] = useState("reuniao");

  const store = useCalendarStore(ano, mes);

  const prevMonth = () => {
    if (mes === 1) { setMes(12); setAno(ano - 1); }
    else setMes(mes - 1);
    setSelectedDay(null);
  };

  const nextMonth = () => {
    if (mes === 12) { setMes(1); setAno(ano + 1); }
    else setMes(mes + 1);
    setSelectedDay(null);
  };

  // Calendar grid
  const monthStart = startOfMonth(new Date(ano, mes - 1));
  const monthEnd = endOfMonth(monthStart);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days: Date[] = [];
  let day = calStart;
  while (day <= calEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  const selectedDateStr = selectedDay
    ? `${ano}-${String(mes).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`
    : null;
  const dayMeetings = selectedDay ? store.reunioesPorDia(selectedDay) : [];

  const handleAdd = () => {
    if (!titulo.trim() || !selectedDay) return;
    store.addReuniao({
      titulo: titulo.trim(),
      descricao: descricao.trim() || null,
      data: selectedDateStr!,
      hora_inicio: horaInicio,
      hora_fim: horaFim || null,
      local: local.trim() || null,
      participantes: null,
      tipo,
      lembrete_min: 15,
      cor: "#6366f1",
    });
    setTitulo("");
    setDescricao("");
    setLocal("");
    setShowAdd(false);
  };

  const mesLabel = format(new Date(ano, mes - 1), "MMMM yyyy", { locale: ptBR });

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-4 pb-24">
        {/* Header */}
        <header className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate("/")} className="p-1.5 rounded-md hover:bg-secondary transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="font-mono text-sm font-bold tracking-tight">CALENDARIO</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="p-1.5 rounded-md hover:bg-secondary"><ChevronLeft className="w-4 h-4" /></button>
            <span className="font-mono text-xs capitalize min-w-[120px] text-center">{mesLabel}</span>
            <button onClick={nextMonth} className="p-1.5 rounded-md hover:bg-secondary"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </header>

        {/* Calendar Grid */}
        <div className="mb-4">
          <div className="grid grid-cols-7 mb-1">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"].map((d) => (
              <div key={d} className="text-center font-mono text-[9px] text-muted-foreground py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
            {days.map((d, i) => {
              const dayNum = d.getDate();
              const inMonth = isSameMonth(d, monthStart);
              const today = isToday(d);
              const isSelected = selectedDay === dayNum && inMonth;
              const hasEvents = inMonth && store.diasComReuniao.has(dayNum);

              return (
                <button
                  key={i}
                  onClick={() => inMonth && setSelectedDay(dayNum)}
                  className={`py-2.5 text-center relative transition-all ${
                    !inMonth
                      ? "bg-background/50 text-muted-foreground/30"
                      : isSelected
                      ? "bg-primary text-primary-foreground"
                      : today
                      ? "bg-accent text-accent-foreground"
                      : "bg-card hover:bg-secondary"
                  }`}
                >
                  <span className="text-xs font-mono">{dayNum}</span>
                  {hasEvents && !isSelected && (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected day detail */}
        {selectedDay && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
                {format(new Date(ano, mes - 1, selectedDay), "EEEE, dd MMM", { locale: ptBR })}
              </h3>
              <button
                onClick={() => setShowAdd(true)}
                className="text-primary hover:opacity-80 transition-opacity"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Add meeting form */}
            {showAdd && (
              <div className="bg-card rounded-xl border p-4 space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold">Nova reuniao</span>
                  <button onClick={() => setShowAdd(false)} className="text-muted-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <input
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Titulo da reuniao"
                  className="w-full bg-background border rounded-md p-2.5 text-sm font-body focus:outline-none focus:ring-1 focus:ring-primary"
                  autoFocus
                />
                <input
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Descricao (opcional)"
                  className="w-full bg-background border rounded-md p-2.5 text-sm font-body focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="font-mono text-[9px] text-muted-foreground">INICIO</label>
                    <input type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)}
                      className="w-full bg-background border rounded-md p-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                  <div className="flex-1">
                    <label className="font-mono text-[9px] text-muted-foreground">FIM</label>
                    <input type="time" value={horaFim} onChange={(e) => setHoraFim(e.target.value)}
                      className="w-full bg-background border rounded-md p-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                </div>
                <input
                  value={local}
                  onChange={(e) => setLocal(e.target.value)}
                  placeholder="Local ou link (opcional)"
                  className="w-full bg-background border rounded-md p-2.5 text-sm font-body focus:outline-none focus:ring-1 focus:ring-primary"
                />
                {/* Tipo */}
                <div className="flex gap-1.5">
                  {Object.entries(tipoConfig).map(([key, cfg]) => {
                    const Icon = cfg.icon;
                    return (
                      <button
                        key={key}
                        onClick={() => setTipo(key)}
                        className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-md text-[9px] font-mono transition-all ${
                          tipo === key
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        <Icon className="w-3 h-3" />
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={handleAdd}
                  disabled={!titulo.trim()}
                  className="w-full py-2.5 rounded-md bg-primary text-primary-foreground font-mono text-xs tracking-wider hover:opacity-90 disabled:opacity-40"
                >
                  AGENDAR
                </button>
              </div>
            )}

            {/* Day meetings */}
            {dayMeetings.length > 0 ? (
              dayMeetings.map((r) => {
                const cfg = tipoConfig[r.tipo] || tipoConfig.outro;
                const Icon = cfg.icon;
                return (
                  <div key={r.id} className="bg-card rounded-xl border p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-8 rounded-full ${cfg.color}`} />
                        <div>
                          <h4 className="text-sm font-medium">{r.titulo}</h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-[10px] text-muted-foreground flex items-center gap-0.5">
                              <Clock className="w-2.5 h-2.5" />
                              {r.hora_inicio}{r.hora_fim ? ` — ${r.hora_fim}` : ""}
                            </span>
                            <span className="font-mono text-[9px] text-muted-foreground flex items-center gap-0.5">
                              <Icon className="w-2.5 h-2.5" /> {cfg.label}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => store.deleteReuniao(r.id)}
                        className="text-muted-foreground/40 hover:text-destructive transition-colors p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {r.descricao && <p className="text-xs text-muted-foreground font-body pl-4">{r.descricao}</p>}
                    {r.local && (
                      <p className="text-[10px] text-muted-foreground font-mono flex items-center gap-1 pl-4">
                        <MapPin className="w-2.5 h-2.5" /> {r.local}
                      </p>
                    )}
                  </div>
                );
              })
            ) : !showAdd ? (
              <div className="bg-card rounded-lg border border-dashed p-6 text-center">
                <CalendarDays className="w-5 h-5 mx-auto text-muted-foreground/40 mb-1.5" />
                <p className="text-xs text-muted-foreground font-body">Nenhuma reuniao neste dia.</p>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
