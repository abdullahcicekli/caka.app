// Panel iskeleti: giriş korumalı yönetim sayfalarının ortak çatısı.
//
// Solda kalıcı DashSidebar (mobil kırılımı `.dash-shell` CSS'inde: 820px
// altında sidebar üste yatar), sağda ince başlık çubuğu (sayfa ikonu + adı)
// ve max-w sınırlı içerik sütunu: h1 başlık + kısa açıklama + kartlar.
// Kart dili sayfaların kendisinde durur: `rounded-2xl border border-sinir
// bg-white p-6` (dashboard kartlarıyla aynı).
//
// Tuval editörü (edit.tsx) ve yazı editörü (edit.yazi.tsx) bu iskelete
// bilerek GİRMEZ — tam ekran çalışırlar.
import type { ComponentType, ReactNode, SVGProps } from "react";

import { DashSidebar, type DashAccount } from "~/components/dash-sidebar";

export function PanelShell({
  icon: Icon,
  title,
  description,
  titleAside,
  username,
  account,
  children,
}: {
  /** iconoir-react bileşeni. `size` prop'u yoktur; ölçü width/height ile verilir. */
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  description?: string;
  /** h1 satırının sağına iliştirilen küçük durum alanı (ör. kayıt durumu). */
  titleAside?: ReactNode;
  username: string;
  account: DashAccount;
  children: ReactNode;
}) {
  return (
    <main className="dash-shell">
      <DashSidebar username={username} account={account} />

      <div className="flex min-w-0 flex-col">
        <header className="flex items-center gap-2.5 border-b border-sinir bg-white px-6 py-3 text-sm font-semibold">
          <Icon width={16} height={16} aria-hidden />
          {title}
        </header>

        <section className="mx-auto w-full max-w-3xl px-6 py-8">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h1 className="text-2xl font-bold">{title}</h1>
            {titleAside}
          </div>
          {description ? (
            <p className="mt-2 max-w-xl text-sm text-murekkep/60">{description}</p>
          ) : null}
          <div className="mt-6 flex flex-col gap-5">{children}</div>
        </section>
      </div>
    </main>
  );
}
