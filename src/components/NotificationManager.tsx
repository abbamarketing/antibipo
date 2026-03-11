import { useEffect, useRef } from "react";
import { Medicamento, today } from "@/lib/store";
import { useCalendarStore } from "@/lib/calendar-store";
import { useMetasStore } from "@/lib/metas-store";
import { useCasaStore } from "@/lib/casa-store";
import { useTrackerStore } from "@/lib/tracker-store";
import { isRecorrenteDue, type RecorrenteConfig } from "@/lib/tracker-blueprints";

interface NotificationManagerProps {
  medicamentos: Medicamento[];
  isMedTaken: (medId: string, horario: string) => boolean;
  hasEnergy: boolean;
}

function requestPermission() {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
}

function notify(title: string, body: string, tag?: string) {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, { body, icon: "/favicon.ico", tag }); // tag deduplicates
  }
}

// Throttle: only notify once per tag per session
const notifiedTags = new Set<string>();
function notifyOnce(title: string, body: string, tag: string) {
  if (notifiedTags.has(tag)) return;
  notifiedTags.add(tag);
  notify(title, body, tag);
}

export function NotificationManager({ medicamentos, isMedTaken, hasEnergy }: NotificationManagerProps) {
  const lastMorning = useRef<string>("");
  const lastMedCheck = useRef<string>("");
  const lastMeetingCheck = useRef<string>("");
  const lastInactivity = useRef<number>(Date.now());

  const now = new Date();
  const calStore = useCalendarStore(now.getFullYear(), now.getMonth() + 1);
  const metasStore = useMetasStore();
  const casaStore = useCasaStore();
  const trackerStore = useTrackerStore();

  useEffect(() => {
    requestPermission();

    // Welcome notification on first PWA open
    const welcomed = localStorage.getItem("ab_welcomed");
    if (!welcomed && "Notification" in window) {
      const checkPerm = () => {
        if (Notification.permission === "granted") {
          localStorage.setItem("ab_welcomed", "1");
          setTimeout(() => {
            notify("AntiBipolaridade", "App instalado com sucesso. Suas notificacoes estao ativas.");
          }, 2000);
        }
      };
      checkPerm();
      setTimeout(checkPerm, 5000);
    }
  }, []);

  // Morning reminder — once per day (7-9h)
  useEffect(() => {
    const check = () => {
      const now = new Date();
      const hour = now.getHours();
      const todayStr = today();

      if (hour >= 7 && hour <= 9 && lastMorning.current !== todayStr && !hasEnergy) {
        lastMorning.current = todayStr;

        const meetings = calStore.todayMeetings.length;
        const meetingMsg = meetings > 0 ? ` ${meetings} reuniao(oes) hoje.` : "";
        const pendingGoals = metasStore.metasAtivas.length;
        const goalMsg = pendingGoals > 0 ? ` ${pendingGoals} metas ativas.` : "";

        notify("AntiBipolaridade", `Selecione seu estado de energia para comecar.${meetingMsg}${goalMsg}`);
      }
    };

    check();
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, [hasEnergy, calStore.todayMeetings, metasStore.metasAtivas]);

  // Med reminders
  useEffect(() => {
    const check = () => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const checkKey = `${today()}-${currentTime}`;

      if (lastMedCheck.current === checkKey) return;

      medicamentos.forEach((med) => {
        med.horarios.forEach((h) => {
          const [hh, mm] = h.split(":");
          const medMinutes = parseInt(hh) * 60 + parseInt(mm);
          const nowMinutes = now.getHours() * 60 + now.getMinutes();

          if (nowMinutes >= medMinutes && nowMinutes <= medMinutes + 5 && !isMedTaken(med.id, h)) {
            lastMedCheck.current = checkKey;
            notify("Medicacao", `${med.nome} — ${med.dose} · ${h}`);
          }
        });
      });
    };

    check();
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, [medicamentos, isMedTaken]);

  // Meeting reminders — 15 min before
  useEffect(() => {
    const check = () => {
      const now = new Date();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const todayStr = today();

      calStore.todayMeetings.forEach((r) => {
        const [hh, mm] = r.hora_inicio.split(":");
        const meetMinutes = parseInt(hh) * 60 + parseInt(mm);
        const diff = meetMinutes - nowMinutes;
        const checkKey = `${todayStr}-${r.id}-${r.hora_inicio}`;

        if (diff > 0 && diff <= (r.lembrete_min || 15) && lastMeetingCheck.current !== checkKey) {
          lastMeetingCheck.current = checkKey;
          notify("Reuniao em breve", `${r.titulo} — ${r.hora_inicio}${r.local ? ` · ${r.local}` : ""}`);
        }
      });
    };

    check();
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, [calStore.todayMeetings]);

  // Pending tasks reminder — once at 10h and once at 14h
  useEffect(() => {
    const check = () => {
      const now = new Date();
      const hour = now.getHours();
      const todayStr = today();

      if ((hour === 10 || hour === 14) && hasEnergy) {
        const tag = `pending_tasks_${todayStr}_${hour}`;
        // Count casa tasks due
        const casaDue = casaStore.tarefas.filter((t) => {
          if (t.ativo === false) return false;
          const lastDone = casaStore.registros.find((r) => r.tarefa_casa_id === t.id);
          const lastDate = lastDone ? new Date(lastDone.feito_em) : null;
          const daysSince = lastDate ? Math.floor((now.getTime() - lastDate.getTime()) / 86400000) : 999;
          const freqDays = t.frequencia === "diario" ? 1 : t.frequencia === "semanal" ? 7 : t.frequencia === "quinzenal" ? 15 : 30;
          return daysSince >= freqDays;
        }).length;

        // Count tracker tasks due
        const trackersDue = trackerStore.trackers.filter((t) => {
          if (!t.ativo || t.tipo !== "recorrente") return false;
          const config = t.config as unknown as RecorrenteConfig;
          const last = trackerStore.getLastCompletion(t.id);
          return isRecorrenteDue(config, last);
        }).length;

        const total = casaDue + trackersDue;
        if (total > 0) {
          const parts: string[] = [];
          if (casaDue > 0) parts.push(`${casaDue} tarefa(s) de casa`);
          if (trackersDue > 0) parts.push(`${trackersDue} tracker(s)`);
          notifyOnce("Tarefas pendentes", `Voce tem ${parts.join(" e ")} aguardando.`, tag);
        }
      }
    };

    check();
    const interval = setInterval(check, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [hasEnergy, casaStore.tarefas, casaStore.registros, trackerStore.trackers]);

  // Mood check-in reminder — every 3h (9, 12, 15, 18, 21)
  useEffect(() => {
    const check = () => {
      const now = new Date();
      const hour = now.getHours();
      const todayStr = today();
      const checkinHours = [9, 12, 15, 18, 21];

      if (checkinHours.includes(hour) && hasEnergy) {
        const tag = `mood_checkin_${todayStr}_${hour}`;
        const lastCheckin = localStorage.getItem("last_mood_checkin");
        const elapsed = lastCheckin ? Date.now() - parseInt(lastCheckin, 10) : Infinity;

        if (elapsed > 2.5 * 60 * 60 * 1000) { // 2.5h since last check-in
          notifyOnce("Check-in emocional", "Como voce esta se sentindo? Abra o app para registrar.", tag);
        }
      }
    };

    check();
    const interval = setInterval(check, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [hasEnergy]);

  // Inactivity check — if no interaction for 2h (reduced from always)
  useEffect(() => {
    const resetInactivity = () => {
      lastInactivity.current = Date.now();
    };

    window.addEventListener("click", resetInactivity);
    window.addEventListener("keydown", resetInactivity);

    const check = setInterval(() => {
      const elapsed = Date.now() - lastInactivity.current;
      if (elapsed > 2 * 60 * 60 * 1000 && hasEnergy) {
        notify("AntiBipolaridade", "Ha um tempo sem atividade. Como estao as tarefas?");
        lastInactivity.current = Date.now();
      }
    }, 15 * 60 * 1000);

    return () => {
      window.removeEventListener("click", resetInactivity);
      window.removeEventListener("keydown", resetInactivity);
      clearInterval(check);
    };
  }, [hasEnergy]);

  // Evening reminder — weight and exercise check (20-21h)
  useEffect(() => {
    const check = () => {
      const now = new Date();
      const hour = now.getHours();
      const todayStr = today();
      const eveningKey = `ab_evening_${todayStr}`;

      if (hour >= 20 && hour <= 21 && !sessionStorage.getItem(eveningKey) && hasEnergy) {
        sessionStorage.setItem(eveningKey, "1");
        notify("AntiBipolaridade", "Registrou tudo hoje? Peso, exercicio e humor ajudam no acompanhamento.");
      }
    };

    check();
    const interval = setInterval(check, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [hasEnergy]);

  return null;
}
