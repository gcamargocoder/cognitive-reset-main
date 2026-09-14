export type AccessTier = "unlimited" | "paid" | "vip" | "trial" | "expired";

export type AccessProfile = {
  paywallEnabled: boolean;
  isPaid: boolean;
  vipCourtesyExpiresAt: string | null;
  createdAt: string;
};

const TRIAL_DAYS = 5;

export function computeAccessTier(p: AccessProfile): AccessTier {
  if (!p.paywallEnabled) return "unlimited";
  return computeTierIgnoringFlag(p);
}

/**
 * Ignora paywallEnabled — usado pelo painel Admin para mostrar "quantos
 * usuários cairiam em cada faixa se a trava fosse ligada agora", mesmo
 * enquanto ela está desligada. Nunca usar para decidir bloqueio real.
 */
export function computeTierIgnoringFlag(
  p: Omit<AccessProfile, "paywallEnabled">,
): Exclude<AccessTier, "unlimited"> {
  if (p.isPaid) return "paid";
  if (p.vipCourtesyExpiresAt && new Date(p.vipCourtesyExpiresAt) > new Date()) return "vip";
  const trialEnds = new Date(p.createdAt).getTime() + TRIAL_DAYS * 86_400_000;
  if (Date.now() < trialEnds) return "trial";
  return "expired";
}

export function isSosUnlocked(tier: AccessTier) {
  return tier === "unlimited" || tier === "paid" || tier === "vip";
}

/** positionInSession: índice 0-based da técnica dentro da sessão (Ansiedade, Pânico...). */
export function isTechniqueUnlocked(tier: AccessTier, positionInSession: number) {
  if (tier === "unlimited" || tier === "paid" || tier === "vip") return true;
  if (tier === "trial") return positionInSession === 0;
  return false;
}

export function isTrilhaDayUnlocked(tier: AccessTier, day: number) {
  if (tier === "unlimited" || tier === "paid" || tier === "vip") return true;
  if (tier === "trial") return day <= 2;
  return false;
}

/** Idade em anos completos a partir de uma data de nascimento (YYYY-MM-DD). */
export function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const hadBirthdayThisYear =
    today.getMonth() > birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());
  if (!hadBirthdayThisYear) age -= 1;
  return age;
}
