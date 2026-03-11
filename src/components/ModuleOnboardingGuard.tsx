import { useState } from "react";
import { useProfileStore } from "@/lib/profile-store";
import { OnboardingWizard } from "@/components/OnboardingWizard";

type ModuloOnboarding = "saude" | "trabalho" | "casa" | "financeiro";

interface ModuleOnboardingGuardProps {
  modulo: ModuloOnboarding;
  children: React.ReactNode;
}

export function ModuleOnboardingGuard({ modulo, children }: ModuleOnboardingGuardProps) {
  const { isOnboardingDone, profileLoading } = useProfileStore();
  const [justCompleted, setJustCompleted] = useState(false);

  if (profileLoading) return null;

  if (!isOnboardingDone(modulo) && !justCompleted) {
    return (
      <OnboardingWizard
        modulo={modulo}
        onComplete={() => setJustCompleted(true)}
      />
    );
  }

  return <>{children}</>;
}
