import phone3d from "~/assets/landing/phone-3d.webp";

/** Mavi bölümdeki 3D bento telefon görseli (örnek sayfayla birebir). */
export function PhoneIllustration() {
  return (
    <img
      src={phone3d}
      alt=""
      loading="lazy"
      className="mx-auto w-full max-w-[520px] rounded-2xl"
    />
  );
}
