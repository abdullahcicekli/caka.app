/**
 * og:image raster katmanı — satori + resvg (WASM) ve gömülü font/logo varlıkları.
 *
 * Bu modül YALNIZCA `server/og-image.ts` içinden `await import(...)` ile
 * dinamik yüklenir: WASM + base64 fontlar ana server chunk'ına girmez, og ile
 * ilgisi olmayan SSR/auth istekleri bu yükü taşımaz. Modül değerlendirmesi
 * bir gün patlarsa (ör. `?inline` data-URI yerine URL dönerse) dinamik import
 * reject olur, og handler'ı fallback görsele düşer — site ayakta kalır.
 */
import { CustomFont, render } from "@cf-wasm/og";

import {
  isOgSourceImageSafe,
  jpegSize,
  pngSize,
  type OgProfileData,
} from "@caka/shared";
import { buildOgNode, OG_HEIGHT, OG_WIDTH, type OgTemplateInput } from "./og-templates";

// Vite `?inline`: dosyayı base64 data-URI olarak bundle'a gömer (CDN'e çıkılmaz).
import satoshiRegularUri from "../app/assets/fonts/Satoshi-Regular.ttf?inline";
import satoshiBoldUri from "../app/assets/fonts/Satoshi-Bold.ttf?inline";
import logoWhiteUri from "../app/assets/brand/logo-white.png?inline";
import logoBlackUri from "../app/assets/brand/logo-black.png?inline";

function dataUriToArrayBuffer(uri: string): ArrayBuffer {
  const b64 = uri.slice(uri.indexOf(",") + 1);
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

// Fontlar ilk render'da bir kez çözülür ve isolate ömrünce yeniden kullanılır.
let fonts: CustomFont[] | null = null;
function getFonts(): CustomFont[] {
  fonts ??= [
    new CustomFont("Satoshi", dataUriToArrayBuffer(satoshiRegularUri), { weight: 400 }),
    new CustomFont("Satoshi", dataUriToArrayBuffer(satoshiBoldUri), { weight: 700 }),
  ];
  return fonts;
}

// Satori yalnız PNG/JPEG kaynak kabul eder (KTD7); WebP vb. yok sayılır ve
// şablon deterministik biçimde monogram/karta düşer.
const SATORI_IMAGE_TYPES = new Set(["image/png", "image/jpeg"]);

interface OgAssetImage {
  src: string;
  width?: number;
  height?: number;
}

/**
 * R2 asset'ini satori'nin okuyabileceği data-URI'ye çevirir (dışa fetch yok).
 * Boyutlar yüz odaklı kırpma için başlıktan okunur; okunamazsa merkez kırpma.
 * Piksel tavanını aşan (veya boyutu okunamayan büyük) görsel KULLANILMAZ:
 * resvg dev bir görseli RGBA'ya açarken isolate'i OOM ile öldürür — null
 * dönülür ve şablon görselsiz dalına düşer (p1/p4 monogram fallback'i).
 */
async function assetToImage(env: Env, assetId: string): Promise<OgAssetImage | null> {
  const object = await env.BUCKET.get(assetId);
  if (!object) return null;
  const contentType = object.httpMetadata?.contentType ?? "";
  if (!SATORI_IMAGE_TYPES.has(contentType)) return null;
  const buffer = await object.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const size = contentType === "image/png" ? pngSize(bytes) : jpegSize(bytes);
  if (!isOgSourceImageSafe(size, bytes.length)) return null;
  let binary = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return {
    src: `data:${contentType};base64,${btoa(binary)}`,
    width: size?.width,
    height: size?.height,
  };
}

export async function renderOgPng(
  env: Env,
  data: OgProfileData,
): Promise<Uint8Array<ArrayBuffer>> {
  const input: OgTemplateInput = {
    name: data.name,
    title: data.title,
    username: data.username,
    linkTitles: data.linkTitles,
    logoLightSrc: logoWhiteUri,
    logoDarkSrc: logoBlackUri,
  };
  if ((data.template === "p1" || data.template === "p4") && data.photoAssetId) {
    input.photo = (await assetToImage(env, data.photoAssetId)) ?? undefined;
  }
  // p3 bağlantısızsa p6'ya düşer; p6 avatar ister — o yüzden p3 de dahil.
  const needsAvatar =
    data.template === "p2" || data.template === "p3" || data.template === "p6";
  if (needsAvatar && data.avatarAssetId) {
    input.avatarSrc = (await assetToImage(env, data.avatarAssetId))?.src;
  }
  const result = render(buildOgNode(data.template, input) as Parameters<typeof render>[0], {
    width: OG_WIDTH,
    height: OG_HEIGHT,
    fonts: getFonts(),
    format: "png",
  });
  const png = await result.asPng();
  return new Uint8Array(png.image);
}
