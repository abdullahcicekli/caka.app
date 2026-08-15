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

/** Oturumlu kullanıcının navbar profil menüsü. */
export function UserMenu({ user }: { user: SessionUser }) {
  function signOut() {
    void authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = "/";
        },
      },
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Hesap menüsü"
          className="rounded-full ring-sinir transition hover:ring-4"
        >
          <ProfileAvatar
            name={user.name}
            avatarUrl={user.avatarUrl}
            className="size-10 text-sm"
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-xl">
        <div className="px-3 py-2">
          <p className="truncate text-sm font-medium">{user.name}</p>
          {user.username ? (
            <p className="truncate text-xs text-murekkep/50">
              caka.app/{user.username}
            </p>
          ) : null}
        </div>
        <DropdownMenuSeparator />
        {user.username ? (
          <DropdownMenuItem asChild>
            <Link to={`/${user.username}`}>Sayfam</Link>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem asChild>
            <Link to="/onboarding">Adresini al</Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onSelect={signOut} variant="destructive">
          Çıkış yap
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
