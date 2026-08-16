/**
 * og:image şablonları — 1200×630 paylaşım görsellerinin satori düzenleri.
 *
 * Bu modül SAF'tır: Vite importu / Worker binding'i içermez; girdi olarak
 * data-URI'ler alır. Böylece hem Worker (server/og-image.ts) hem de lokal
 * doğrulama script'i aynı düzenleri render edebilir.
 *
 * Satori kuralları: birden çok çocuğu olan her kapsayıcı display:flex olmalı
 * (KTD7); `h()` bunu div'lere otomatik uygular. Görseller yalnız PNG/JPEG.
 */
import type { OgTemplate } from "@caka/shared";

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

/**
 * app.css `@theme` token'larının AYNASI — PNG çıktı CSS değişkeni okuyamaz
 * (root.tsx'teki PROFILE_THEME_COLORS deseni). app.css'te bu token'lardan
 * biri değişirse burası da güncellenmeli.
 */
const OG_COLORS = {
  zemin: "#f7f6f2", // --color-zemin (açık zemin)
  murekkep: "#14141a", // --color-murekkep (koyu zemin)
  kirec: "#cbe84a", // --color-kirec (lime)
  kirecKoyu: "#233917", // --color-kirec-koyu (lime üzerindeki koyu metin)
  mavi: "#2a55f5", // --color-mavi
  mor: "#5b2aa5", // --color-mor
  cam: "#0e4f4a", // --color-cam
  // app.css token'ı değil: kart zemini beyazı (satori sabiti, ham hex yayma).
  beyaz: "#ffffff",
} as const;

// Türetilmiş yardımcı tonlar (token karışımları; yeni marka rengi değildir):
const LIGHT_INK_65 = "rgba(247,246,242,0.65)"; // zemin %65 — koyu zeminde ikincil metin
const LIGHT_INK_10 = "rgba(247,246,242,0.10)"; // zemin %10 — koyu zeminde pill dolgusu
const DARK_INK_60 = "rgba(20,20,26,0.60)"; // murekkep %60 — açık zeminde ikincil metin
const CARD_SHADOW = "0 12px 32px rgba(20,20,26,0.08)";
// kirec %25 + zemin %75 karışımı: p6'nın "açık yeşilimsi" zemini.
const LIME_TINT = "#ecf2c8";

export interface OgPhoto {
  src: string;
  /** Kaynak piksel boyutları; bilinirse kırpma odağı üst-orta alınır. */
  width?: number;
  height?: number;
}

export interface OgTemplateInput {
  name: string;
  /** Ünvan/bio; boşsa satır hiç basılmaz. */
  title: string;
  /** Normalize edilmiş adres (caka.app/<username>). */
  username: string;
  /** Yüksek çözünürlüklü fotoğraf (p1/p4). */
  photo?: OgPhoto;
  /** Avatar data-URI'si (p2/p3/p6). */
  avatarSrc?: string;
  /** Bağlantı/sosyal blok başlıkları, sayfadaki sırayla (p3). */
  linkTitles?: string[];
  /** Beyaz caka logosu (koyu zeminler) — data-URI. */
  logoLightSrc: string;
  /** Siyah caka logosu (açık/lime zeminler) — data-URI. */
  logoDarkSrc: string;
}

/** Satori'nin kabul ettiği düz nesne ağacı (JSX gerekmez — spike deseni). */
export interface OgNode {
  type: string;
  props: {
    style?: Record<string, unknown>;
    children?: string | OgNode | OgNode[];
    [key: string]: unknown;
  };
}

function h(
  type: string,
  style: Record<string, unknown>,
  children?: string | OgNode | OgNode[],
  extra?: Record<string, unknown>,
): OgNode {
  const merged = type === "div" ? { display: "flex", ...style } : style;
  return { type, props: { style: merged, children, ...extra } };
}

/** Uzun metinde puntoyu kademeli küçültür (taşma yerine küçülme). */
function fitFontSize(text: string, tiers: [number, number][], min: number): number {
  for (const [maxLength, size] of tiers) {
    if (text.length <= maxLength) return size;
  }
  return min;
}

/** Adın ilk grapheme'ine yakın ilk code point'i (surrogate güvenli). */
export function ogInitial(name: string): string {
  const first = Array.from(name.trim())[0];
  return (first ?? "C").toLocaleUpperCase("tr");
}

/** Tek satır, taşarsa üç nokta. */
const ellipsis = {
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  maxWidth: "100%",
} as const;

/**
 * Yüz odaklı cover-crop. Satori `objectPosition` desteklemez; kaynak boyutları
 * biliniyorsa kırpma elle hesaplanır ve dikey odak üst 1/3'e alınır (portre
 * fotoğraflarda yüz üst yarıdadır — merkez kırpma geniş çerçevede kafayı
 * keserdi). Boyut bilinmiyorsa satori'nin merkezli cover'ına düşer.
 */
const PHOTO_FOCAL_Y = 1 / 3;

function photoBox(
  photo: OgPhoto,
  frameW: number,
  frameH: number,
  extraStyle: Record<string, unknown> = {},
): OgNode {
  if (!photo.width || !photo.height) {
    return h(
      "img",
      { width: frameW, height: frameH, objectFit: "cover", flexShrink: 0, ...extraStyle },
      undefined,
      { src: photo.src, width: frameW, height: frameH },
    );
  }
  const scale = Math.max(frameW / photo.width, frameH / photo.height);
  const imgW = photo.width * scale;
  const imgH = photo.height * scale;
  const left = -Math.round((imgW - frameW) / 2);
  const top = -Math.round(
    Math.min(Math.max(imgH * PHOTO_FOCAL_Y - frameH / 2, 0), imgH - frameH),
  );
  return h(
    "div",
    {
      width: frameW,
      height: frameH,
      overflow: "hidden",
      position: "relative",
      flexShrink: 0,
      ...extraStyle,
    },
    h(
      "img",
      { position: "absolute", left, top, width: imgW, height: imgH },
      undefined,
      { src: photo.src, width: imgW, height: imgH },
    ),
  );
}

/** Dairesel avatar; görsel yoksa baş harf monogramı (ProfileAvatar kuralı). */
function avatarCircle(
  input: OgTemplateInput,
  size: number,
  variant: "onLight" | "onDark",
): OgNode {
  if (input.avatarSrc) {
    return h(
      "img",
      { width: size, height: size, borderRadius: 9999, objectFit: "cover" },
      undefined,
      { src: input.avatarSrc, width: size, height: size },
    );
  }
  return h(
    "div",
    {
      width: size,
      height: size,
      borderRadius: 9999,
      backgroundColor: variant === "onDark" ? OG_COLORS.kirec : OG_COLORS.murekkep,
      color: variant === "onDark" ? OG_COLORS.kirecKoyu : OG_COLORS.kirec,
      alignItems: "center",
      justifyContent: "center",
      fontSize: Math.round(size * 0.44),
      fontWeight: 700,
    },
    ogInitial(input.name),
  );
}

/** Koyu pill: lime nokta + caka.app/<adres>. */
function addressPill(username: string, variant: "onDark" | "onLight"): OgNode {
  return h(
    "div",
    {
      alignItems: "center",
      gap: 14,
      backgroundColor: variant === "onDark" ? LIGHT_INK_10 : OG_COLORS.murekkep,
      borderRadius: 9999,
      padding: "16px 30px",
    },
    [
      h("div", {
        width: 14,
        height: 14,
        borderRadius: 9999,
        backgroundColor: OG_COLORS.kirec,
      }),
      h(
        "div",
        { fontSize: 27, fontWeight: 700, color: OG_COLORS.zemin, ...ellipsis },
        `caka.app/${username}`,
      ),
    ],
  );
}

function logo(src: string, height: number): OgNode {
  // logo-*.png oranı 219×277 ≈ 0.79 (g/y).
  const width = Math.round(height * (219 / 277));
  return h("img", { width, height }, undefined, { src, width, height });
}

/** p1 Portre — solda fotoğraf, sağda koyu panel. */
function portrait(input: OgTemplateInput): OgNode {
  const nameSize = fitFontSize(input.name, [[14, 84], [22, 66], [34, 52]], 42);
  return h(
    "div",
    { width: "100%", height: "100%", backgroundColor: OG_COLORS.murekkep },
    [
      // photo, resolveOgTemplate garantisiyle dolu (yoksa p5'e düşülür).
      photoBox(input.photo as OgPhoto, 480, OG_HEIGHT),
      h(
        "div",
        {
          flexGrow: 1,
          width: OG_WIDTH - 480,
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px 64px",
        },
        [
          h(
            "div",
            {
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: 6,
              color: LIGHT_INK_65,
            },
            "caka.app",
          ),
          h("div", { flexDirection: "column", gap: 18, maxWidth: "100%" }, [
            h(
              "div",
              {
                fontSize: nameSize,
                fontWeight: 700,
                color: OG_COLORS.zemin,
                lineHeight: 1.08,
                // satori: lineClamp yalniz display block ile calisir (flex degil).
                display: "block",
                lineClamp: 2,
                maxWidth: "100%",
              },
              input.name,
            ),
            ...(input.title
              ? [
                  h(
                    "div",
                    { fontSize: 30, color: LIGHT_INK_65, ...ellipsis },
                    input.title,
                  ),
                ]
              : []),
          ]),
          h("div", {}, addressPill(input.username, "onDark")),
        ],
      ),
    ],
  );
}

/** p2 Adres — lime zemin, çok büyük kullanıcı adı. */
function address(input: OgTemplateInput): OgNode {
  const usernameSize = fitFontSize(input.username, [[9, 150], [13, 116], [19, 88], [25, 68]], 54);
  return h(
    "div",
    {
      width: "100%",
      height: "100%",
      backgroundColor: OG_COLORS.kirec,
      flexDirection: "column",
      justifyContent: "space-between",
      padding: "56px 64px",
    },
    [
      h("div", { justifyContent: "space-between", alignItems: "center" }, [
        avatarCircle(input, 92, "onLight"),
        logo(input.logoDarkSrc, 72),
      ]),
      h("div", { flexDirection: "column", gap: 8, maxWidth: "100%" }, [
        h(
          "div",
          { fontSize: 34, fontWeight: 700, color: OG_COLORS.kirecKoyu },
          "caka.app/",
        ),
        h(
          "div",
          {
            fontSize: usernameSize,
            fontWeight: 700,
            color: OG_COLORS.murekkep,
            lineHeight: 1.02,
            ...ellipsis,
          },
          input.username,
        ),
        ...(input.title
          ? [
              h(
                "div",
                {
                  fontSize: 32,
                  color: OG_COLORS.kirecKoyu,
                  marginTop: 16,
                  ...ellipsis,
                },
                input.title,
              ),
            ]
          : []),
      ]),
      // Alt boşluk dengesi (justify-between üçüncü nokta).
      h("div", { height: 8 }),
    ],
  );
}

/** p3 Bağlantılar — solda kimlik, sağda en çok 3 bağlantı kartı. */
function linksCard(input: OgTemplateInput): OgNode {
  const titles = (input.linkTitles ?? []).filter((title) => title.trim());
  const shown = titles.slice(0, 3);
  const rest = titles.length - shown.length;
  const nameSize = fitFontSize(input.name, [[16, 52], [26, 42]], 34);
  const iconColors = [OG_COLORS.mavi, OG_COLORS.mor, OG_COLORS.cam];
  return h(
    "div",
    {
      width: "100%",
      height: "100%",
      backgroundColor: OG_COLORS.zemin,
      alignItems: "center",
      padding: "56px 64px",
      gap: 56,
    },
    [
      h(
        "div",
        { flexDirection: "column", gap: 22, width: 430, flexShrink: 0 },
        [
          avatarCircle(input, 140, "onLight"),
          h(
            "div",
            {
              fontSize: nameSize,
              fontWeight: 700,
              color: OG_COLORS.murekkep,
              lineHeight: 1.1,
              // satori: lineClamp yalniz display block ile calisir (flex degil).
              display: "block",
              lineClamp: 2,
              maxWidth: "100%",
            },
            input.name,
          ),
          ...(input.title
            ? [
                h(
                  "div",
                  { fontSize: 27, color: DARK_INK_60, ...ellipsis },
                  input.title,
                ),
              ]
            : []),
          h("div", {}, addressPill(input.username, "onLight")),
        ],
      ),
      h(
        "div",
        { flexDirection: "column", gap: 18, flexGrow: 1, justifyContent: "center" },
        [
          ...shown.map((title, index) =>
            h(
              "div",
              {
                alignItems: "center",
                gap: 22,
                backgroundColor: OG_COLORS.beyaz,
                borderRadius: 24,
                padding: "26px 30px",
                boxShadow: CARD_SHADOW,
              },
              [
                h(
                  "div",
                  {
                    width: 58,
                    height: 58,
                    borderRadius: 16,
                    flexShrink: 0,
                    backgroundColor: iconColors[index % iconColors.length],
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 28,
                    fontWeight: 700,
                    color: OG_COLORS.zemin,
                  },
                  ogInitial(title),
                ),
                h(
                  "div",
                  {
                    fontSize: 31,
                    fontWeight: 700,
                    color: OG_COLORS.murekkep,
                    ...ellipsis,
                  },
                  title,
                ),
              ],
            ),
          ),
          ...(rest > 0
            ? [
                h(
                  "div",
                  { fontSize: 26, color: DARK_INK_60, marginLeft: 12 },
                  `ve ${rest} bağlantı daha`,
                ),
              ]
            : []),
        ],
      ),
    ],
  );
}

/** p4 Tam kadraj — fotoğraf zemin + koyu gradyan. */
function fullBleed(input: OgTemplateInput): OgNode {
  const nameSize = fitFontSize(input.name, [[16, 72], [26, 56]], 44);
  return h(
    "div",
    { width: "100%", height: "100%", backgroundColor: OG_COLORS.murekkep },
    [
      photoBox(input.photo as OgPhoto, OG_WIDTH, OG_HEIGHT, {
        position: "absolute",
        top: 0,
        left: 0,
      }),
      // Okunabilirlik fotoğraftan bağımsız GARANTİ olmalı (beyaz/kalabalık
      // fotoğraf + beyaz metin en kötü senaryo): üstte logo scrim'i, altta
      // metin bloğunun arkasını neredeyse opaklaştıran güçlü gradyan.
      h("div", {
        position: "absolute",
        top: 0,
        left: 0,
        width: OG_WIDTH,
        height: 220,
        backgroundImage:
          "linear-gradient(180deg, rgba(20,20,26,0.65) 0%, rgba(20,20,26,0) 100%)",
      }),
      h("div", {
        position: "absolute",
        bottom: 0,
        left: 0,
        width: OG_WIDTH,
        height: Math.round(OG_HEIGHT * 0.55),
        backgroundImage:
          "linear-gradient(180deg, rgba(20,20,26,0) 0%, rgba(20,20,26,0.62) 35%, rgba(20,20,26,0.88) 65%, rgba(20,20,26,0.95) 100%)",
      }),
      h(
        "div",
        {
          position: "absolute",
          top: 0,
          left: 0,
          width: OG_WIDTH,
          height: OG_HEIGHT,
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px 64px",
        },
        [
          h("div", {}, logo(input.logoLightSrc, 76)),
          h(
            "div",
            { justifyContent: "space-between", alignItems: "flex-end", gap: 40 },
            [
              h(
                "div",
                { flexDirection: "column", gap: 12, flexGrow: 1, maxWidth: 760 },
                [
                  h(
                    "div",
                    {
                      fontSize: nameSize,
                      fontWeight: 700,
                      color: OG_COLORS.zemin,
                      lineHeight: 1.08,
                      // satori: lineClamp yalniz display block ile calisir (flex degil).
                      display: "block",
                      lineClamp: 2,
                      maxWidth: "100%",
                    },
                    input.name,
                  ),
                  ...(input.title
                    ? [
                        h(
                          "div",
                          { fontSize: 29, color: LIGHT_INK_65, ...ellipsis },
                          input.title,
                        ),
                      ]
                    : []),
                ],
              ),
              h(
                "div",
                {
                  alignItems: "center",
                  gap: 14,
                  backgroundColor: OG_COLORS.kirec,
                  borderRadius: 9999,
                  padding: "16px 30px",
                  flexShrink: 0,
                },
                [
                  h("div", {
                    width: 14,
                    height: 14,
                    borderRadius: 9999,
                    backgroundColor: OG_COLORS.murekkep,
                  }),
                  h(
                    "div",
                    { fontSize: 27, fontWeight: 700, color: OG_COLORS.kirecKoyu },
                    `caka.app/${input.username}`,
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    ],
  );
}

/** p5 Monogram — fotoğrafsız; lime karede ilk harf. */
function monogram(input: OgTemplateInput): OgNode {
  const nameSize = fitFontSize(input.name, [[14, 76], [22, 60], [34, 48]], 40);
  return h(
    "div",
    {
      width: "100%",
      height: "100%",
      backgroundColor: OG_COLORS.murekkep,
      alignItems: "center",
      padding: "72px",
      gap: 64,
    },
    [
      h(
        "div",
        {
          width: 340,
          height: 340,
          borderRadius: 48,
          flexShrink: 0,
          backgroundColor: OG_COLORS.kirec,
          alignItems: "center",
          justifyContent: "center",
          fontSize: 190,
          fontWeight: 700,
          color: OG_COLORS.kirecKoyu,
        },
        ogInitial(input.name),
      ),
      h(
        "div",
        { flexDirection: "column", gap: 18, flexGrow: 1, justifyContent: "center" },
        [
          h(
            "div",
            {
              fontSize: nameSize,
              fontWeight: 700,
              color: OG_COLORS.zemin,
              lineHeight: 1.1,
              // satori: lineClamp yalniz display block ile calisir (flex degil).
              display: "block",
              lineClamp: 2,
              maxWidth: "100%",
            },
            input.name,
          ),
          ...(input.title
            ? [
                h(
                  "div",
                  { fontSize: 30, color: LIGHT_INK_65, ...ellipsis },
                  input.title,
                ),
              ]
            : []),
          h("div", { alignItems: "center", gap: 16, marginTop: 14 }, [
            logo(input.logoLightSrc, 46),
            h(
              "div",
              { fontSize: 30, fontWeight: 700, color: OG_COLORS.kirec, ...ellipsis },
              `/${input.username}`,
            ),
          ]),
        ],
      ),
    ],
  );
}

/** p6 Kart — açık yeşilimsi zeminde ortalanmış beyaz kart. */
function card(input: OgTemplateInput): OgNode {
  const nameSize = fitFontSize(input.name, [[18, 52], [30, 42]], 34);
  return h(
    "div",
    {
      width: "100%",
      height: "100%",
      backgroundColor: LIME_TINT,
      alignItems: "center",
      justifyContent: "center",
    },
    h(
      "div",
      {
        width: 680,
        flexDirection: "column",
        alignItems: "center",
        gap: 20,
        backgroundColor: OG_COLORS.beyaz,
        borderRadius: 40,
        padding: "48px 56px",
        boxShadow: CARD_SHADOW,
      },
      [
        avatarCircle(input, 132, "onLight"),
        h(
          "div",
          {
            fontSize: nameSize,
            fontWeight: 700,
            color: OG_COLORS.murekkep,
            textAlign: "center",
            lineHeight: 1.1,
            // satori: lineClamp yalniz display block ile calisir (flex degil).
            display: "block",
            lineClamp: 2,
            maxWidth: "100%",
          },
          input.name,
        ),
        ...(input.title
          ? [
              h(
                "div",
                {
                  fontSize: 27,
                  color: DARK_INK_60,
                  textAlign: "center",
                  lineHeight: 1.35,
                  // satori: lineClamp yalniz display block ile calisir (flex degil).
                  display: "block",
                  lineClamp: 2,
                  maxWidth: "100%",
                },
                input.title,
              ),
            ]
          : []),
        h("div", { marginTop: 8 }, addressPill(input.username, "onLight")),
      ],
    ),
  );
}

/**
 * Kenar durum düşüşleri: p1/p4 fotoğrafsız kalırsa p5 monogram; p3 hiç
 * bağlantı başlığı yoksa p6 kart. Hash içerik girdilerinden hesaplandığı için
 * düşüş deterministiktir (aynı içerik → aynı görsel).
 */
export function resolveOgTemplate(
  template: OgTemplate,
  input: Pick<OgTemplateInput, "photo" | "linkTitles">,
): OgTemplate {
  if ((template === "p1" || template === "p4") && !input.photo) return "p5";
  if (template === "p3" && !(input.linkTitles ?? []).some((t) => t.trim())) {
    return "p6";
  }
  return template;
}

export function buildOgNode(template: OgTemplate, input: OgTemplateInput): OgNode {
  const node = (() => {
    switch (resolveOgTemplate(template, input)) {
      case "p1":
        return portrait(input);
      case "p2":
        return address(input);
      case "p3":
        return linksCard(input);
      case "p4":
        return fullBleed(input);
      case "p5":
        return monogram(input);
      case "p6":
        return card(input);
    }
  })();
  // fontFamily kökte ZORUNLU: verilmezse satori @cf-wasm/og'nin gömülü Noto
  // varsayılanına kayar ve ağırlıklar karışır (Satoshi yalnız fallback olur).
  node.props.style = { fontFamily: "Satoshi", ...node.props.style };
  return node;
}
