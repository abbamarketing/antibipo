import { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";
import { queueSize } from "@/lib/offline-queue";

export function OfflineIndicator() {
  const [offline, setOffline] = useState(!navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const handleOffline = () => {
      setOffline(true);
      setPendingCount(queueSize());
    };

    const handleOnline = () => {
      setOffline(false);
      // Brief delay to update pending count after sync
      setTimeout(() => setPendingCount(queueSize()), 2000);
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  // Periodically update pending count while offline
  useEffect(() => {
    if (!offline) return;
    const interval = setInterval(() => {
      setPendingCount(queueSize());
    }, 5000);
    return () => clearInterval(interval);
  }, [offline]);

  if (!offline) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-50 bg-amber-600 text-white px-4 py-2 text-center animate-in slide-in-from-top-2 duration-300">
      <div className="flex items-center justify-center gap-2 max-w-lg mx-auto">
        <WifiOff className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="font-mono text-xs">
          Sem conexao — alteracoes serao sincronizadas
          {pendingCount > 0 && ` (${pendingCount} pendente${pendingCount > 1 ? "s" : ""})`}
        </span>
      </div>
    </div>
  );
}
