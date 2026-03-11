import { useState } from "react";
import { useProfileStore } from "@/lib/profile-store";
import { OnboardingWizard } from "@/components/OnboardingWizard";

type ModuloOnboarding = "saude" | "trabalho" | "casa" | "financeiro";

interface ModuleOnboardingGuardProps {
  modulo: ModuloOnboarding;
  children: React.ReactNode;
  /** When true, renders onboarding as a full-page wrapper (for standalone pages like Financeiro) */
  fullPage?: boolean;
}

export function ModuleOnboardingGuard({ modulo, children, fullPage }: ModuleOnboardingGuardProps) {
  const { isOnboardingDone, profileLoading, profile } = useProfileStore();
  const [justCompleted, setJustCompleted] = useState(false);

  if (profileLoading) return null;

  const wasDoneBefore = !!profile?.[`onboarding_${modulo}` as keyof typeof profile];
  const needsOnboarding = !isOnboardingDone(modulo) && !justCompleted;

  if (needsOnboarding) {
    if (fullPage) {
      return (
        <div className="min-h-screen bg-background">
          <div className="max-w-lg mx-auto px-4 py-8">
            <OnboardingWizard
              modulo={modulo}
              onComplete={() => setJustCompleted(true)}
              isRefresh={wasDoneBefore}
            />
          </div>
        </div>
      );
    }

    return (
      <OnboardingWizard
        modulo={modulo}
        onComplete={() => setJustCompleted(true)}
        isRefresh={wasDoneBefore}
      />
    );
  }

  return <>{children}</>;
}
