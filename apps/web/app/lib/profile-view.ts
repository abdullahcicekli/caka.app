/** Layout dokümanından görünüm için güvenli okuma yardımcıları. */

interface SeedBlock {
  type?: string;
  data?: { name?: string; title?: string; avatarAssetId?: string };
}

export interface SeedProfile {
  name: string | null;
  avatarUrl: string | null;
}

/** Tohum layout'taki profil kartından isim + avatar URL'ini çeker. */
export function parseSeedProfile(layoutJson: string): SeedProfile {
  try {
    const layout = JSON.parse(layoutJson) as { blocks?: SeedBlock[] };
    const block = layout.blocks?.find((b) => b.type === "profile");
    return {
      name: block?.data?.name ?? null,
      avatarUrl: block?.data?.avatarAssetId ? `/i/${block.data.avatarAssetId}` : null,
    };
  } catch {
    return { name: null, avatarUrl: null };
  }
}

/** Baş harfler (avatarsız durumlar için, R14'ün baş-harf kuralıyla uyumlu). */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase("tr") ?? "")
    .join("");
}
