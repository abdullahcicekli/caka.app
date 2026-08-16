import { z } from "zod";

/**
 * og:image şablonları — kullanıcıya özel paylaşım görselinin yerleşimi.
 * `themeSchema` deseniyle aynı: enum + normalize; Ayarlar sayfası (Faz 2)
 * `OG_TEMPLATE_OPTIONS` listesinden seçim sunacak.
 */
export const ogTemplateSchema = z.enum(["p1", "p2", "p3", "p4", "p5", "p6"]);
export type OgTemplate = z.infer<typeof ogTemplateSchema>;

export const DEFAULT_OG_TEMPLATE: OgTemplate = "p1";

/** Türkçe şablon etiketleri (Ayarlar arayüzü için). */
export const OG_TEMPLATE_OPTIONS: readonly { id: OgTemplate; label: string }[] = [
  { id: "p1", label: "Portre" },
  { id: "p2", label: "Adres" },
  { id: "p3", label: "Bağlantılar" },
  { id: "p4", label: "Tam kadraj" },
  { id: "p5", label: "Monogram" },
  { id: "p6", label: "Kart" },
];

/** DB'den okunan şablonu doğrular; bilinmeyen değer varsayılana düşer. */
export function normalizeOgTemplate(value: string): OgTemplate {
  const parsed = ogTemplateSchema.safeParse(value);
  return parsed.success ? parsed.data : DEFAULT_OG_TEMPLATE;
}
