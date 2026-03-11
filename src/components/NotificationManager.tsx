import { useEffect, useRef } from "react";
import { Medicamento, today } from "@/lib/store";

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
  const lastInactivity = useRef<number>(Date.now());

  useEffect(() => {
    requestPermission();
  }, []);

  // Morning reminder — once per day
  useEffect(() => {
    const check = () => {
      const now = new Date();
      const hour = now.getHours();
      const todayStr = today();

      // Morning notification between 7-9
      if (hour >= 7 && hour <= 9 && lastMorning.current !== todayStr && !hasEnergy) {
        lastMorning.current = todayStr;
        notify("FLOW", "Selecione seu estado de energia para começar.");
      }
    };

    check();
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, [hasEnergy]);

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

          // Notify if within 5 min window and not taken
          if (nowMinutes >= medMinutes && nowMinutes <= medMinutes + 5 && !isMedTaken(med.id, h)) {
            lastMedCheck.current = checkKey;
            notify("Medicação", `${med.nome} — ${med.dose} · ${h}`);
          }
        });
      });
    };

    check();
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, [medicamentos, isMedTaken]);

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
        notify("FLOW", "Há um tempo sem atividade. Como estão as tarefas?");
        lastInactivity.current = Date.now(); // reset to avoid spam
      }
    }, 15 * 60 * 1000); // check every 15min

    return () => {
      window.removeEventListener("click", resetInactivity);
      window.removeEventListener("keydown", resetInactivity);
      clearInterval(check);
    };
  }, [hasEnergy]);

  return null;
}
