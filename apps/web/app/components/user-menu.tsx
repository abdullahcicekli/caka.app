import {
  ArrowSeparateVertical,
  EditPencil,
  LogOut,
  OpenNewWindow,
  Settings,
  ViewGrid,
} from "iconoir-react";
import { Link } from "react-router";

import { ProfileAvatar } from "~/components/profile-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { authClient } from "~/lib/auth-client";
import { appCatalog } from "~/content/app";
import { useCatalog } from "~/lib/locale";

export interface SessionUser {
  name: string;
  username: string | null;
  avatarUrl: string | null;
}

function signOut() {
  void authClient.signOut({
    fetchOptions: {
      onSuccess: () => {
        window.location.href = "/";
      },
    },
  });
}

/** Panel kenar çubuğunun hesap menüsü gövdesi.
 *
 * "Panel" satırı YOK: bu menü yalnız panelin içinde açılıyor, bulunduğun
 * yere bağlantı vermek anlamsız olurdu. (Navbar artık kendi hesap
 * bölümünü menü katmanında taşıyor — bkz. `MenuAccountSection`.) */
function AccountMenuContent({ user }: { user: SessionUser }) {
  const app = useCatalog(appCatalog);
  return (
    <>
      <div className="flex items-center gap-2.5 px-2 py-1.5">
        <ProfileAvatar
          name={user.name}
          avatarUrl={user.avatarUrl}
          className="size-9 flex-none text-xs"
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{user.name}</p>
          {user.username ? (
            <p className="truncate text-xs text-murekkep/50">caka.app/{user.username}</p>
          ) : null}
        </div>
      </div>
      <DropdownMenuSeparator />
      {user.username ? (
        <>
          <DropdownMenuItem asChild>
            <a href={`/${user.username}`} target="_blank" rel="noreferrer">
              <OpenNewWindow /> {app.nav.viewProfile}
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/edit">
              <EditPencil /> {app.nav.editProfile}
            </Link>
          </DropdownMenuItem>
        </>
      ) : (
        <DropdownMenuItem asChild>
          <Link to="/onboarding">
            <OpenNewWindow /> {app.auth.claimAddress}
          </Link>
        </DropdownMenuItem>
      )}
      {/* Ayarlar sayfası henüz yok; menüde yerini tutar ama tıklanamaz. */}
      <DropdownMenuItem disabled>
        <Settings /> {app.nav.accountSettings}
        <span className="ml-auto rounded-full bg-zemin px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase">
          {app.nav.comingSoon}
        </span>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={signOut} variant="destructive">
        <LogOut /> {app.auth.signOut}
      </DropdownMenuItem>
    </>
  );
}

/**
 * Landing menü katmanının hesap bölümü — oturum açıkken katmanın EN ÜSTÜNDE.
 *
 * Radix dropdown'ı değil, düz bir liste. Sebebi: katman zaten
 * `role="dialog"` ve kendi odak tuzağını yönetiyor; içine ikinci bir menü
 * koymak iki tuzağı iç içe geçirir ve Escape'in hangisini kapatacağı
 * belirsizleşirdi. Satırlar sıradan bağlantı, odak sırası katmanın
 * doğal sırası.
 *
 * Eskiden burada avatara bağlı AYRI bir dropdown vardı; iki ayrı katman
 * aynı köşeden açılıyordu. Tek panelde birleşti.
 */
export function MenuAccountSection({
  user,
  onNavigate,
}: {
  user: SessionUser;
  onNavigate: () => void;
}) {
  const app = useCatalog(appCatalog);
  return (
    <div className="lp-menu-account">
      <div className="lp-menu-account-head">
        <ProfileAvatar
          name={user.name}
          avatarUrl={user.avatarUrl}
          className="size-9 flex-none text-xs"
        />
        <span className="lp-menu-account-id">
          <strong>{user.name}</strong>
          {user.username ? <small>caka.app/{user.username}</small> : null}
        </span>
      </div>
      <ul className="lp-menu-account-links">
        {user.username ? (
          <>
            {/* Panel ilk sırada: oturumlu kullanıcının navbardan aradığı şey
                önce burası. Adresi olmayan kullanıcıya gösterilmez —
                /dashboard onboarding'e geri yollardı. */}
            <li>
              <Link to="/dashboard" onClick={onNavigate}>
                <ViewGrid width={17} height={17} aria-hidden /> {app.nav.dashboard}
              </Link>
            </li>
            <li>
              <a
                href={`/${user.username}`}
                target="_blank"
                rel="noreferrer"
                onClick={onNavigate}
              >
                <OpenNewWindow width={17} height={17} aria-hidden /> {app.nav.viewProfile}
              </a>
            </li>
            <li>
              <Link to="/edit" onClick={onNavigate}>
                <EditPencil width={17} height={17} aria-hidden /> {app.nav.editProfile}
              </Link>
            </li>
          </>
        ) : (
          <li>
            <Link to="/onboarding" onClick={onNavigate}>
              <OpenNewWindow width={17} height={17} aria-hidden /> {app.auth.claimAddress}
            </Link>
          </li>
        )}
        {/* Ayarlar sayfası henüz yok: yerini tutar ama ODAK ALMAZ — tıklanamaz
            bir satırı Tab döngüsüne sokmak klavye kullanıcısını boşa durdurur. */}
        <li>
          <span className="lp-menu-account-soon">
            <Settings width={17} height={17} aria-hidden /> {app.nav.accountSettings}
            <em>{app.nav.comingSoon}</em>
          </span>
        </li>
        <li>
          <button type="button" className="lp-menu-account-out" onClick={signOut}>
            <LogOut width={17} height={17} aria-hidden /> {app.auth.signOut}
          </button>
        </li>
      </ul>
    </div>
  );
}

/** Panel sol sütunundaki hesap menüsü: avatar + ad + adres, üste açılır. */
export function SidebarUserMenu({ user }: { user: SessionUser }) {
  const app = useCatalog(appCatalog);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="dash-account-trigger" aria-label={app.auth.accountMenu}>
          <ProfileAvatar
            name={user.name}
            avatarUrl={user.avatarUrl}
            className="size-8 flex-none text-xs"
          />
          <span className="dash-account-labels">
            <strong>{user.name}</strong>
            {user.username ? <small>@{user.username}</small> : null}
          </span>
          <ArrowSeparateVertical width={15} height={15} aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" sideOffset={8} className="w-[238px]">
        <AccountMenuContent user={user} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
