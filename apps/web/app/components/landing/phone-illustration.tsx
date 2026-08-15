/**
 * Mavi bölümdeki telefon görseli için CSS yer tutucusu: zemin renkli çerçeve
 * içinde bento karoları. 3D render hazır olduğunda bu bileşen tek bir <img>
 * ile değiştirilebilir — dış API'si yok, sahnesi kendi içinde.
 */
export function PhoneIllustration() {
  return (
    <div aria-hidden className="relative mx-auto w-64 rotate-[-6deg] sm:w-72">
      <div className="rounded-[2.5rem] border-8 border-white/40 bg-zemin p-4 shadow-2xl">
        <div className="mx-auto mb-4 h-1.5 w-16 rounded-full bg-sinir" />
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-1 h-24 rounded-2xl bg-kum" />
          <div className="col-span-1 flex h-24 items-center justify-center rounded-2xl border-2 border-dashed border-sinir text-2xl text-murekkep/40">
            +
          </div>
          <div className="col-span-1 flex h-20 items-center justify-center rounded-2xl bg-kirec">
            <div className="size-10 rounded-full bg-zemin" />
          </div>
          <div className="col-span-1 h-20 rounded-2xl bg-kum" />
          <div className="col-span-2 flex h-12 items-center justify-between rounded-full bg-kirec px-4">
            <div className="size-5 rounded-full bg-kirec-koyu/20" />
            <span className="text-sm text-kirec-koyu/60">›</span>
          </div>
          <div className="col-span-2 flex h-12 items-center justify-between rounded-full bg-kum px-4">
            <div className="size-5 rounded-full bg-murekkep/15" />
            <span className="text-sm text-murekkep/40">›</span>
          </div>
        </div>
      </div>
      <div className="absolute -top-4 -right-6 size-16 rotate-12 rounded-2xl bg-kum shadow-lg" />
      <div className="absolute -bottom-5 -left-7 size-14 -rotate-12 rounded-2xl bg-kirec shadow-lg" />
    </div>
  );
}
