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

/** Menü gövdesi: navbar (avatar) ve panel (geniş) tetikleyicileri paylaşır. */
function AccountMenuContent({
  user,
  showDashboard = false,
}: {
  user: SessionUser;
  /** "Panel" satırı yalnız panel DIŞINDAN açılan menüde (navbar) görünür;
      panelin kendi kenar çubuğunda bulunduğun yere bağlantı olurdu. */
  showDashboard?: boolean;
}) {
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
          {/* Panel ilk sırada: oturumlu kullanıcının navbardan aradığı şey
              önce burası. Adresi olmayan kullanıcıya gösterilmez —
              /dashboard onboarding'e geri yollardı. */}
          {showDashboard ? (
            <DropdownMenuItem asChild>
              <Link to="/dashboard">
                <ViewGrid /> Panel
              </Link>
            </DropdownMenuItem>
          ) : null}
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
            <OpenNewWindow /> Adresini al
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

/** Oturumlu kullanıcının navbar profil menüsü. */
export function UserMenu({ user }: { user: SessionUser }) {
  const app = useCatalog(appCatalog);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={app.auth.accountMenu}
          className="cursor-pointer rounded-full ring-sinir transition hover:ring-4"
        >
          <ProfileAvatar name={user.name} avatarUrl={user.avatarUrl} className="size-10 text-sm" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <AccountMenuContent user={user} showDashboard />
      </DropdownMenuContent>
    </DropdownMenu>
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
