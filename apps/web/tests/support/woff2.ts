/**
 * Küçük bir WOFF2 okuyucu — yalnız test için, yalnız gereken kadarı.
 *
 * Neden elle yazıldı: depoya yeni bir bağımlılık sokmadan, gönderdiğimiz font
 * DOSYASININ kendisini (tarayıcının indireceği baytları) okuyabilmek için.
 * Yan bir "manifest" dosyasına bakan test, fontu değiştiren birini yakalamaz.
 *
 * WOFF2'de yalnız `glyf`/`loca` (ve isteğe bağlı `hmtx`) dönüştürülür; `cmap`
 * ve `maxp` sıkıştırılmış akışın içinde OLDUĞU GİBİ durur. Bu yüzden brotli
 * akışını açıp tablo dizininin verdiği kaymadan okumak yetiyor —
 * `glyf` yeniden kurulmuyor.
 *
 * Kaynak: W3C WOFF2 File Format 1.0 (https://www.w3.org/TR/WOFF2/).
 */
import { brotliDecompressSync } from "node:zlib";

/** WOFF2 tablo dizininde 0-62 arası indekslerle kısaltılan tablo adları. */
const KNOWN_TAGS = [
  "cmap", "head", "hhea", "hmtx", "maxp", "name", "OS/2", "post",
  "cvt ", "fpgm", "glyf", "loca", "prep", "CFF ", "VORG", "EBDT",
  "EBLC", "gasp", "hdmx", "kern", "LTSH", "PCLT", "VDMX", "vhea",
  "vmtx", "BASE", "GDEF", "GPOS", "GSUB", "EBSC", "JSTF", "MATH",
  "CBDT", "CBLC", "COLR", "CPAL", "SVG ", "sbix", "acnt", "avar",
  "bdat", "bloc", "bsln", "cvar", "fdsc", "feat", "fmtx", "fvar",
  "gvar", "hsty", "just", "lcar", "mort", "morx", "opbd", "prop",
  "trak", "Zapf", "Silf", "Glat", "Gloc", "Feat", "Sill",
] as const;

export type Woff2Font = {
  /** Tablo adı → açılmış tablo baytları (dönüştürülmüş tablolar HAM hâlleriyle). */
  tables: Map<string, Buffer>;
  /** `maxp`'ten okunan glif sayısı. */
  numGlyphs: number;
  /** `cmap`'ten çıkarılan kod noktası kümesi. */
  codepoints: Set<number>;
};

/** UIntBase128: 7 bitlik gruplar, en anlamlıdan başlayarak; son baytın 8. biti 0. */
function readUIntBase128(buf: Buffer, offset: number): [value: number, next: number] {
  let value = 0;
  for (let i = 0; i < 5; i += 1) {
    const byte = buf[offset + i];
    if (byte === undefined) throw new Error("WOFF2: UIntBase128 dosyanın dışına taştı");
    if (i === 0 && byte === 0x80) throw new Error("WOFF2: UIntBase128 başında yasak sıfır dolgusu");
    value = value * 128 + (byte & 0x7f);
    if ((byte & 0x80) === 0) return [value, offset + i + 1];
  }
  throw new Error("WOFF2: UIntBase128 çok uzun");
}

export function parseWoff2(file: Buffer): Woff2Font {
  if (file.toString("latin1", 0, 4) !== "wOF2") throw new Error("WOFF2 imzası yok");
  const numTables = file.readUInt16BE(12);
  const totalCompressedSize = file.readUInt32BE(20);

  let cursor = 48;
  const directory: { tag: string; offset: number; length: number }[] = [];
  let streamOffset = 0;
  for (let i = 0; i < numTables; i += 1) {
    const flags = file[cursor];
    cursor += 1;
    const tagIndex = flags & 0x3f;
    const transformVersion = flags >> 6;
    let tag: string;
    if (tagIndex === 0x3f) {
      tag = file.toString("latin1", cursor, cursor + 4);
      cursor += 4;
    } else {
      tag = KNOWN_TAGS[tagIndex];
    }
    let origLength: number;
    [origLength, cursor] = readUIntBase128(file, cursor);
    // `glyf`/`loca` için 0 = DÖNÜŞTÜRÜLMÜŞ; öteki tablolarda 0 = ham.
    const transformed =
      tag === "glyf" || tag === "loca" ? transformVersion === 0 : transformVersion !== 0;
    let lengthInStream = origLength;
    if (transformed) [lengthInStream, cursor] = readUIntBase128(file, cursor);
    directory.push({ tag, offset: streamOffset, length: lengthInStream });
    streamOffset += lengthInStream;
  }

  const compressed = file.subarray(cursor, cursor + totalCompressedSize);
  const stream = brotliDecompressSync(compressed);
  const tables = new Map<string, Buffer>();
  for (const entry of directory) {
    tables.set(entry.tag, stream.subarray(entry.offset, entry.offset + entry.length));
  }

  const maxp = tables.get("maxp");
  if (!maxp) throw new Error("WOFF2: maxp tablosu yok");
  const cmap = tables.get("cmap");
  if (!cmap) throw new Error("WOFF2: cmap tablosu yok");

  return { tables, numGlyphs: maxp.readUInt16BE(4), codepoints: readCmap(cmap) };
}

/** `cmap`'in TÜM alt tablolarındaki kod noktalarını toplar (format 4, 6, 12). */
function readCmap(cmap: Buffer): Set<number> {
  const out = new Set<number>();
  const numSubtables = cmap.readUInt16BE(2);
  const seen = new Set<number>();
  for (let i = 0; i < numSubtables; i += 1) {
    const offset = cmap.readUInt32BE(4 + i * 8 + 4);
    if (seen.has(offset)) continue;
    seen.add(offset);
    readCmapSubtable(cmap, offset, out);
  }
  return out;
}

function readCmapSubtable(cmap: Buffer, base: number, out: Set<number>): void {
  const format = cmap.readUInt16BE(base);
  if (format === 4) {
    const segCountX2 = cmap.readUInt16BE(base + 6);
    const segCount = segCountX2 / 2;
    const endBase = base + 14;
    const startBase = endBase + segCountX2 + 2;
    const deltaBase = startBase + segCountX2;
    const rangeBase = deltaBase + segCountX2;
    for (let s = 0; s < segCount; s += 1) {
      const end = cmap.readUInt16BE(endBase + s * 2);
      const start = cmap.readUInt16BE(startBase + s * 2);
      if (start > end) continue;
      const delta = cmap.readInt16BE(deltaBase + s * 2);
      const rangeOffset = cmap.readUInt16BE(rangeBase + s * 2);
      for (let cp = start; cp <= end && cp !== 0xffff; cp += 1) {
        let gid: number;
        if (rangeOffset === 0) {
          gid = (cp + delta) & 0xffff;
        } else {
          const at = rangeBase + s * 2 + rangeOffset + (cp - start) * 2;
          if (at + 1 >= cmap.length) continue;
          const raw = cmap.readUInt16BE(at);
          gid = raw === 0 ? 0 : (raw + delta) & 0xffff;
        }
        if (gid !== 0) out.add(cp);
      }
    }
    return;
  }
  if (format === 6) {
    const first = cmap.readUInt16BE(base + 6);
    const count = cmap.readUInt16BE(base + 8);
    for (let i = 0; i < count; i += 1) {
      if (cmap.readUInt16BE(base + 10 + i * 2) !== 0) out.add(first + i);
    }
    return;
  }
  if (format === 12) {
    const nGroups = cmap.readUInt32BE(base + 12);
    for (let g = 0; g < nGroups; g += 1) {
      const at = base + 16 + g * 12;
      const start = cmap.readUInt32BE(at);
      const end = cmap.readUInt32BE(at + 4);
      for (let cp = start; cp <= end; cp += 1) out.add(cp);
    }
    return;
  }
  // Format 0/2/13/14 bu fontta yok; sessizce atlamak yerine görünür kalsın
  // diye bilerek hiçbir şey yapılmıyor — kapsama testi eksik çıkarsa fark edilir.
}
