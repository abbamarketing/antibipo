import { useState } from "react";
import { useProfileStore } from "@/lib/profile-store";
import { OnboardingWizard } from "@/components/OnboardingWizard";

type ModuloOnboarding = "saude" | "trabalho" | "casa" | "financeiro";

interface ModuleOnboardingGuardProps {
  modulo: ModuloOnboarding;
  children: React.ReactNode;
}

export function ModuleOnboardingGuard({ modulo, children }: ModuleOnboardingGuardProps) {
  const { isOnboardingDone, profileLoading, profile } = useProfileStore();
  const [justCompleted, setJustCompleted] = useState(false);

  if (profileLoading) return null;

  const wasDoneBefore = !!profile?.[`onboarding_${modulo}` as keyof typeof profile];
  const needsOnboarding = !isOnboardingDone(modulo) && !justCompleted;

  if (needsOnboarding) {
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
