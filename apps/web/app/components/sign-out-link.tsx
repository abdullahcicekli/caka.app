import { authClient } from "~/lib/auth-client";
import { cn } from "~/lib/utils";
import { appCatalog } from "~/content/app";
import { useCatalog } from "~/lib/locale";

/** Sade app.auth.signOut bağlantısı; çıkışta ana sayfaya döner. */
export function SignOutLink({ className }: { className?: string }) {
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
    <button
      type="button"
      onClick={signOut}
      className={cn("text-sm text-murekkep/50 hover:text-murekkep", className)}
    >
      Çıkış yap
    </button>
  );
}
