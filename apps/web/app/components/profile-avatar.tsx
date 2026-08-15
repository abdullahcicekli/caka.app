import { initials } from "~/lib/profile-view";
import { cn } from "~/lib/utils";

interface ProfileAvatarProps {
  name: string;
  avatarUrl: string | null;
  className?: string;
}

/** Avatar görseli; yoksa marka renkli baş-harf dairesi (R14 kuralı). */
export function ProfileAvatar({ name, avatarUrl, className }: ProfileAvatarProps) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt=""
        className={cn("rounded-full object-cover", className)}
      />
    );
  }
  return (
    <div
      aria-hidden
      className={cn(
        "flex items-center justify-center rounded-full bg-kirec font-bold text-kirec-koyu",
        className,
      )}
    >
      {initials(name)}
    </div>
  );
}
