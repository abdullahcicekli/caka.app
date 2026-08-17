// Public sayfaların navbar'ı için oturum kullanıcısı. `home.tsx` bu okumayı
// kendi loader'ında yapıyor; hukuki sayfalarda üç kez tekrarlamamak için
// buraya alındı (iş mantığı route dosyasında yaşamaz).
//
// `home.tsx`'ten farkı: avatar onarımı (`ensureProfileAvatar`) yapılmaz —
// hukuki sayfalar salt okunur yüzeylerdir, yazma yapmazlar.
import { parseSeedProfile } from "../app/lib/profile-view";
import { getSession } from "./auth";
import { getProfileByUserId } from "./profile";

export type NavUser = {
  name: string;
  username: string | null;
  avatarUrl: string | null;
};

/**
 * Navbar'ın kullanıcı menüsünü göstermesi tamamen kozmetik bir ayrıntı; bunun
 * için yapılan oturum okuması ve D1 sorgusu bir uyum sayfasını 500'e
 * düşürmemeli. Hata hâlinde anonim navbar'a inilir ve olay loglanır: sayfa
 * (hukuki metin) okunur kalır.
 */
export async function getNavUser(
  env: Env,
  request: Request,
): Promise<NavUser | null> {
  try {
    const session = await getSession(env, request);
    if (!session) return null;

    const profile = await getProfileByUserId(env, session.user.id);
    const seed = profile ? parseSeedProfile(profile.layout) : null;
    return {
      name: session.user.name,
      username: profile?.username ?? null,
      avatarUrl: seed?.avatarUrl ?? session.user.image ?? null,
    };
  } catch (error) {
    console.error(
      JSON.stringify({
        message: "nav user lookup failed",
        error: String(error),
      }),
    );
    return null;
  }
}
