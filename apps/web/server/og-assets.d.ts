// og:image üretiminde bundle'a gömülen asset'lerin Vite `?inline` tipleri:
// import base64 data-URI string döner (font + logo, çalışma zamanında CDN yok).
declare module "*.ttf?inline" {
  const dataUri: string;
  export default dataUri;
}

declare module "*.png?inline" {
  const dataUri: string;
  export default dataUri;
}
