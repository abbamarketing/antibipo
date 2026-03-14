export type EnergyStatus = 'atual' | 'expirando' | 'expirado' | 'sem_dados';

export function getEnergyStatus(sessao: { hora_inicio: string } | null): EnergyStatus {
  if (!sessao) return 'sem_dados';
  const horas = (Date.now() - new Date(sessao.hora_inicio).getTime()) / (1000 * 60 * 60);
  if (horas >= 4) return 'expirado';
  if (horas >= 3) return 'expirando';
  return 'atual';
}
