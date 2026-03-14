import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { logActivity } from "@/lib/activity-log";

interface Props {
  children: ReactNode;
  name?: string;
}

interface State {
  hasError: boolean;
  error: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: "" };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }

  componentDidCatch(error: Error) {
    logActivity("error_boundary" as any, {
      component: this.props.name || "unknown",
      error: error.message,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 flex flex-col items-center gap-3 text-center">
          <AlertTriangle className="w-6 h-6 text-destructive" />
          <p className="text-sm font-medium text-foreground">Algo deu errado neste módulo</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <RefreshCw className="w-3 h-3" />
            Recarregar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
