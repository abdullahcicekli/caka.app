import { ChevronsUpDown, ExternalLink, LogOut, Pencil, Settings } from "lucide-react";
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
function AccountMenuContent({ user }: { user: SessionUser }) {
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
              <ExternalLink /> Profili gör
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/edit">
              <Pencil /> Profili düzenle
            </Link>
          </DropdownMenuItem>
        </>
      ) : (
        <DropdownMenuItem asChild>
          <Link to="/onboarding">
            <ExternalLink /> Adresini al
          </Link>
        </DropdownMenuItem>
      )}
      {/* Ayarlar sayfası henüz yok; menüde yerini tutar ama tıklanamaz. */}
      <DropdownMenuItem disabled>
        <Settings /> Hesap ayarları
        <span className="ml-auto rounded-full bg-zemin px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase">
          Yakında
        </span>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={signOut} variant="destructive">
        <LogOut /> Çıkış yap
      </DropdownMenuItem>
    </>
  );
}

/** Oturumlu kullanıcının navbar profil menüsü. */
export function UserMenu({ user }: { user: SessionUser }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Hesap menüsü"
          className="cursor-pointer rounded-full ring-sinir transition hover:ring-4"
        >
          <ProfileAvatar name={user.name} avatarUrl={user.avatarUrl} className="size-10 text-sm" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <AccountMenuContent user={user} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Panel sol sütunundaki hesap menüsü: avatar + ad + adres, üste açılır. */
export function SidebarUserMenu({ user }: { user: SessionUser }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="dash-account-trigger" aria-label="Hesap menüsü">
          <ProfileAvatar
            name={user.name}
            avatarUrl={user.avatarUrl}
            className="size-8 flex-none text-xs"
          />
          <span className="dash-account-labels">
            <strong>{user.name}</strong>
            {user.username ? <small>@{user.username}</small> : null}
          </span>
          <ChevronsUpDown size={15} aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" sideOffset={8} className="w-[238px]">
        <AccountMenuContent user={user} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
