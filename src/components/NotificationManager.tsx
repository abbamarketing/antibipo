import { useEffect, useRef } from "react";
import { Medicamento, today } from "@/lib/store";
import { useCalendarStore } from "@/lib/calendar-store";
import { useMetasStore } from "@/lib/metas-store";
import { useCasaStore } from "@/lib/casa-store";

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

function notify(title: string, body: string) {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, { body, icon: "/favicon.ico" });
  }
}

export function NotificationManager({ medicamentos, isMedTaken, hasEnergy }: NotificationManagerProps) {
  const lastMorning = useRef<string>("");
  const lastMedCheck = useRef<string>("");
  const lastMeetingCheck = useRef<string>("");
  const lastInactivity = useRef<number>(Date.now());

  const now = new Date();
  const calStore = useCalendarStore(now.getFullYear(), now.getMonth() + 1);
  const metasStore = useMetasStore();

  useEffect(() => {
    requestPermission();

    // Welcome notification on first PWA open
    const welcomed = localStorage.getItem("flow_welcomed");
    if (!welcomed && "Notification" in window) {
      const checkPerm = () => {
        if (Notification.permission === "granted") {
          localStorage.setItem("flow_welcomed", "1");
          setTimeout(() => {
            notify("Bem-vindo ao FLOW", "App instalado com sucesso. Suas notificacoes estao ativas.");
          }, 2000);
        }
      };
      // Check immediately and also after a delay (user might grant permission)
      checkPerm();
      setTimeout(checkPerm, 5000);
    }
  }, []);

  // Morning reminder — once per day
  useEffect(() => {
    const check = () => {
      const now = new Date();
      const hour = now.getHours();
      const todayStr = today();

      if (hour >= 7 && hour <= 9 && lastMorning.current !== todayStr && !hasEnergy) {
        lastMorning.current = todayStr;

        // Count today's meetings
        const meetings = calStore.todayMeetings.length;
        const meetingMsg = meetings > 0 ? ` Voce tem ${meetings} reuniao(oes) hoje.` : "";

        // Check pending goals
        const pendingGoals = metasStore.metasAtivas.length;
        const goalMsg = pendingGoals > 0 ? ` ${pendingGoals} metas ativas.` : "";

        notify("FLOW", `Selecione seu estado de energia para comecar.${meetingMsg}${goalMsg}`);
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

  // Inactivity check — if no interaction for 2h, ask about tasks
  useEffect(() => {
    const resetInactivity = () => {
      lastInactivity.current = Date.now();
    };

    window.addEventListener("click", resetInactivity);
    window.addEventListener("keydown", resetInactivity);

    const check = setInterval(() => {
      const elapsed = Date.now() - lastInactivity.current;
      if (elapsed > 2 * 60 * 60 * 1000 && hasEnergy) {
        notify("FLOW", "Ha um tempo sem atividade. Como estao as tarefas?");
        lastInactivity.current = Date.now();
      }
    }, 15 * 60 * 1000);

    return () => {
      window.removeEventListener("click", resetInactivity);
      window.removeEventListener("keydown", resetInactivity);
      clearInterval(check);
    };
  }, [hasEnergy]);

  // Evening reminder — weight and exercise check
  useEffect(() => {
    const check = () => {
      const now = new Date();
      const hour = now.getHours();
      const todayStr = today();
      const eveningKey = `flow_evening_${todayStr}`;

      if (hour >= 20 && hour <= 21 && !sessionStorage.getItem(eveningKey) && hasEnergy) {
        sessionStorage.setItem(eveningKey, "1");
        notify("FLOW", "Registrou tudo hoje? Peso, exercicio e humor ajudam no acompanhamento.");
      }
    };

    check();
    const interval = setInterval(check, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [hasEnergy]);

  return null;
}
