/** Layout dokümanından görünüm için güvenli okuma yardımcıları. */

interface SeedBlock {
  type?: string;
  data?: { name?: string; title?: string };
}

/** Tohum layout'taki profil kartından ismi çeker; bozuk JSON'da null. */
export function parseSeedName(layoutJson: string): string | null {
  try {
    const layout = JSON.parse(layoutJson) as { blocks?: SeedBlock[] };
    const block = layout.blocks?.find((b) => b.type === "profile");
    return block?.data?.name ?? null;
  } catch {
    return null;
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
