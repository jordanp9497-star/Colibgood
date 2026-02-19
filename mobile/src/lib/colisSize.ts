import type { ColisSize, PackageDraft } from "@/types";

/** Prix en € par taille (acompte MVP) */
export const COLS_SIZE_PRICE_EUR: Record<ColisSize, number> = {
  petit: 5,
  moyen: 10,
  gros: 15,
  special: 25,
};

/** Presets dimensions (cm) / poids (kg) par taille pour le backend */
export const COLS_SIZE_PRESETS: Record<ColisSize, { length: number; width: number; height: number; weight: number }> = {
  petit: { length: 20, width: 20, height: 20, weight: 2 },
  moyen: { length: 40, width: 30, height: 30, weight: 5 },
  gros: { length: 60, width: 40, height: 40, weight: 10 },
  special: { length: 120, width: 80, height: 80, weight: 30 },
};

/** Package draft à partir de la taille (optionnel: précision pour colis spécial) */
export function packageDraftFromSize(size: ColisSize, specialDescription?: string): PackageDraft {
  const p = COLS_SIZE_PRESETS[size];
  const content =
    size === "special"
      ? specialDescription?.trim() || "Colis spécial (électroménager, encombrant, etc.)"
      : "À préciser après réservation";
  return {
    ...p,
    content,
  };
}
