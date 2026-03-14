import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface AgentAlert {
  severity: "warning" | "error";
  title: string;
  body: string;
  module_focus: string;
  recommended_action: string;
}

export function AlertBanner({ alerts }: { alerts: AgentAlert[] }) {
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());
  const navigate = useNavigate();

  const visibleAlerts = alerts.filter((_, i) => !dismissed.has(i));
  if (!visibleAlerts.length) return null;

  return (
    <div className="space-y-2 mb-4">
      {alerts.map((alert, i) =>
        dismissed.has(i) ? null : (
          <Alert
            key={i}
            variant={alert.severity === "error" ? "destructive" : "default"}
            className="relative"
          >
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="pr-8">{alert.title}</AlertTitle>
            <AlertDescription>
              <p className="text-sm mb-2">{alert.body}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const mod = alert.module_focus;
                  if (["trabalho", "casa", "saude", "metas"].includes(mod)) {
                    navigate(`/?mod=${mod}`);
                  } else {
                    navigate(`/${mod}`);
                  }
                }}
              >
                {alert.recommended_action}
              </Button>
            </AlertDescription>
            <button
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
              onClick={() => setDismissed((prev) => new Set(prev).add(i))}
            >
              <X className="h-3 w-3" />
            </button>
          </Alert>
        )
      )}
    </div>
  );
}
