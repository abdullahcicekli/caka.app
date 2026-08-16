import { useEffect, useMemo, useRef, useState } from "react";
import { env } from "cloudflare:workers";
import {
  AtSign,
  CalendarDays,
  Check,
  ChevronLeft,
  ImageIcon,
  Link2,
  Mail,
  MoreHorizontal,
  Pencil,
  Rocket,
  Search,
  Sparkles,
  Store,
  TrendingUp,
  Users,
} from "lucide-react";
import { Form, Link, data, redirect, useNavigate, useNavigation } from "react-router";

import { ProfileAvatar } from "~/components/profile-avatar";
import { SocialIcon } from "~/components/icons/social";
import {
  discoveryOptions,
  onboardingPlatforms,
  onboardingPurposes,
  onboardingTemplates,
  platformById,
} from "~/content/onboarding";
import { parseSeedProfile } from "~/lib/profile-view";
import {
  PROFILE_BIO_MAX,
  PROFILE_NAME_MAX,
  parseProfileLayout,
  socialPlatformSchema,
  type SocialPlatform,
} from "@caka/shared";
import { getSession } from "../../server/auth";
import { isAssetOwnedByUser } from "../../server/onboarding-api";
import {
  completeOnboarding,
  getProfileByUserId,
  parseOnboardingData,
  updateOnboardingData,
  type OnboardingData,
  type OnboardingLink,
} from "../../server/profile";
import type { Route } from "./+types/onboarding.kurulum";

const STEPS = [
  "profil",
  "platformlar",
  "amac",
  "kesif",
  "sablon",
  "baglantilar",
  "hazirlaniyor",
  "hazir",
] as const;
type Step = (typeof STEPS)[number];

const NEXT_STEP: Record<Step, Step | null> = {
  profil: "platformlar",
  platformlar: "amac",
  amac: "kesif",
  kesif: "sablon",
  sablon: "baglantilar",
  baglantilar: "hazirlaniyor",
  hazirlaniyor: "hazir",
  hazir: null,
};

const PREVIOUS_STEP: Partial<Record<Step, Step>> = {
  platformlar: "profil",
  amac: "platformlar",
  kesif: "amac",
  sablon: "kesif",
  baglantilar: "sablon",
};

function stepPath(step: Step) {
  return `/onboarding/kurulum/${step}`;
}

function asStep(value: string | undefined): Step | null {
  return STEPS.includes(value as Step) ? (value as Step) : null;
}

function sanitizeText(value: FormDataEntryValue | null, max: number) {
  return String(value ?? "").trim().slice(0, max);
}

function readText(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

export function meta({}: Route.MetaArgs) {
  return [{ title: "Sayfanı hazırla — Caka" }];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const session = await getSession(env, request);
  if (!session) throw redirect("/login");
  const profile = await getProfileByUserId(env, session.user.id);
  if (!profile) throw redirect("/onboarding");
  const step = asStep(params.step);
  if (!step) throw redirect(stepPath("profil"));

  const finishStep = step === "hazirlaniyor" || step === "hazir";
  if (profile.onboardingCompletedAt && !finishStep) throw redirect("/edit");
  if (!profile.onboardingCompletedAt && finishStep) throw redirect(stepPath("profil"));

  const onboarding = parseOnboardingData(profile.onboardingData);
  const seed = parseSeedProfile(profile.layout);
  const layout = parseProfileLayout(profile.layout);
  return {
    step,
    username: profile.username,
    theme: profile.theme,
    layout,
    onboarding,
    defaults: {
      name: onboarding.name ?? seed.name ?? session.user.name,
      bio: onboarding.bio ?? "",
      avatarUrl: onboarding.avatarAssetId
        ? `/i/${onboarding.avatarAssetId}`
        : seed.avatarUrl ?? session.user.image ?? null,
      avatarAssetId: onboarding.avatarAssetId ?? null,
    },
  };
}

export async function action({ request, params }: Route.ActionArgs) {
  const session = await getSession(env, request);
  if (!session) throw redirect("/login");
  const profile = await getProfileByUserId(env, session.user.id);
  if (!profile) throw redirect("/onboarding");
  const step = asStep(params.step);
  if (!step || step === "hazirlaniyor" || step === "hazir") {
    throw redirect(stepPath("profil"));
  }

  const form = await request.formData();
  const intent = String(form.get("intent") ?? "continue");
  let patch: OnboardingData = {};

  if (step === "profil") {
    const name = sanitizeText(form.get("name"), PROFILE_NAME_MAX);
    if (!name) return data({ error: "Adını yazmalısın" }, { status: 400 });
    const bio = readText(form.get("bio"));
    if (bio.length > PROFILE_BIO_MAX) {
      return data(
        { error: `Açıklama en fazla ${PROFILE_BIO_MAX} karakter olabilir` },
        { status: 400 },
      );
    }
    const avatarAssetId = sanitizeText(form.get("avatarAssetId"), 64);
    if (avatarAssetId && !(await isAssetOwnedByUser(env, avatarAssetId, session.user.id))) {
      return data({ error: "Fotoğraf doğrulanamadı" }, { status: 400 });
    }
    patch = {
      name,
      bio,
      ...(avatarAssetId ? { avatarAssetId } : {}),
    };
  }

  if (step === "platformlar") {
    const platforms = form
      .getAll("platform")
      .map(String)
      .flatMap((value) => {
        const parsed = socialPlatformSchema.safeParse(value);
        return parsed.success ? [parsed.data] : [];
      });
    patch = { platforms };
  }

  if (step === "amac") {
    const allowed = new Set(onboardingPurposes.map((item) => item.id));
    patch = {
      purposes: form
        .getAll("purpose")
        .map(String)
        .filter((value) => allowed.has(value as never)),
    };
  }

  if (step === "kesif") {
    const allowed = new Set(discoveryOptions.map((item) => item.id));
    const discovery = String(form.get("discovery") ?? "");
    patch = { discovery: allowed.has(discovery as never) ? discovery : "" };
  }

  if (step === "sablon") {
    const template = intent === "skip" ? "sade" : String(form.get("template") ?? "sade");
    patch = {
      template: onboardingTemplates.some((item) => item.id === template)
        ? template
        : "sade",
    };
  }

  if (step === "baglantilar") {
    const stored = parseOnboardingData(profile.onboardingData);
    const platforms = form
      .getAll("linkPlatform")
      .map(String)
      .flatMap((value) => {
        const parsed = socialPlatformSchema.safeParse(value);
        return parsed.success ? [parsed.data] : [];
      });
    const values = form.getAll("linkValue").map((value) => sanitizeText(value, 2048));
    const links: OnboardingLink[] = platforms.map((platform, index) => ({
      platform,
      value: values[index] ?? "",
    }));
    if (intent !== "skip") {
      for (const extra of form.getAll("extraLink")) {
        const value = sanitizeText(extra, 2048);
        if (value) links.push({ platform: "website", value });
      }
    }
    try {
      await completeOnboarding(env, session.user, { ...stored, links });
    } catch {
      return data({ error: "Bağlantılardan biri geçerli değil" }, { status: 400 });
    }
    throw redirect(stepPath("hazirlaniyor"));
  }

  await updateOnboardingData(env, session.user.id, patch);
  const next = NEXT_STEP[step];
  throw redirect(next ? stepPath(next) : "/edit");
}

function Progress({ step }: { step: Step }) {
  const firstFlow = ["profil", "platformlar", "amac", "kesif"] as Step[];
  const secondFlow = ["sablon", "baglantilar", "hazirlaniyor"] as Step[];
  const flow = firstFlow.includes(step) ? firstFlow : secondFlow;
  if (step === "hazir") return null;
  const active = Math.max(0, flow.indexOf(step));
  return (
    <div className="onboarding-progress" aria-label={`Adım ${active + 1}/${flow.length}`}>
      {flow.map((item, index) => (
        <span key={item} className={index === active ? "is-active" : ""} />
      ))}
    </div>
  );
}

function BottomActions({
  label = "Devam et",
  canSkip = true,
  disabled = false,
}: {
  label?: string;
  canSkip?: boolean;
  disabled?: boolean;
}) {
  const navigation = useNavigation();
  const pending = navigation.state !== "idle";
  return (
    <div className="onboarding-actions">
      <button type="submit" name="intent" value="continue" disabled={pending || disabled}>
        {pending ? "Kaydediliyor…" : label}
      </button>
      {canSkip ? (
        <button className="onboarding-skip" type="submit" name="intent" value="skip">
          Bu adımı geç
        </button>
      ) : null}
    </div>
  );
}

function PurposeIcon({ name }: { name: string }) {
  const icons: Record<string, typeof Link2> = {
    link: Link2,
    image: ImageIcon,
    calendar: CalendarDays,
    mail: Mail,
    store: Store,
    trend: TrendingUp,
    search: Search,
    sparkles: Sparkles,
    at: AtSign,
    users: Users,
    rocket: Rocket,
    more: MoreHorizontal,
  };
  const Icon = icons[name] ?? Link2;
  return <Icon size={21} strokeWidth={1.8} />;
}

function ProfileStep({
  defaults,
  username,
}: {
  defaults: { name: string; bio: string; avatarUrl: string | null; avatarAssetId: string | null };
  username: string;
}) {
  const [avatarUrl, setAvatarUrl] = useState(defaults.avatarUrl);
  const [avatarAssetId, setAvatarAssetId] = useState(defaults.avatarAssetId ?? "");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [name, setName] = useState(defaults.name);
  const [bio, setBio] = useState(defaults.bio);
  const fileRef = useRef<HTMLInputElement>(null);
  const bioHighlightRef = useRef<HTMLDivElement>(null);
  const remaining = PROFILE_BIO_MAX - bio.length;
  const bioTooLong = remaining < 0;
  const acceptedBio = bio.slice(0, PROFILE_BIO_MAX);
  const overflowBio = bio.slice(PROFILE_BIO_MAX);

  async function upload(file: File) {
    setUploading(true);
    setUploadError("");
    try {
      const response = await fetch("/api/onboarding/avatar", {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const result = (await response.json()) as { id?: string; url?: string; error?: string };
      if (!response.ok || !result.id || !result.url) {
        throw new Error(result.error || "Fotoğraf yüklenemedi");
      }
      setAvatarAssetId(result.id);
      setAvatarUrl(result.url);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Fotoğraf yüklenemedi");
    } finally {
      setUploading(false);
    }
  }

  return (
    <Form method="post" className="onboarding-form onboarding-profile-form">
      <input type="hidden" name="avatarAssetId" value={avatarAssetId} />
      <p className="onboarding-account-note">
        <AtSign size={18} /> {username} hesabından alındı
      </p>
      <button
        className="onboarding-avatar-button"
        type="button"
        onClick={() => fileRef.current?.click()}
      >
        <span className="onboarding-avatar-visual">
          <ProfileAvatar name={name || defaults.name} avatarUrl={avatarUrl} className="size-28" />
          <span className="avatar-edit-badge" aria-hidden><Pencil size={16} /></span>
        </span>
        <span>{uploading ? "Yükleniyor…" : "Fotoğrafı değiştir"}</span>
      </button>
      <input
        ref={fileRef}
        className="sr-only"
        type="file"
        accept="image/jpeg,image/png"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
        }}
      />
      {uploadError ? <p className="onboarding-error">{uploadError}</p> : null}
      <input
        className="onboarding-input"
        name="name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        maxLength={PROFILE_NAME_MAX}
        aria-label="Adın"
        required
      />
      <div className={`onboarding-bio-field ${bioTooLong ? "is-invalid" : ""}`}>
        <div ref={bioHighlightRef} className="onboarding-bio-highlight" aria-hidden>
          <span>{acceptedBio}</span>
          {overflowBio ? <mark>{overflowBio}</mark> : null}
        </div>
        <textarea
          className="onboarding-input onboarding-textarea"
          name="bio"
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          onScroll={(event) => {
            if (bioHighlightRef.current) {
              bioHighlightRef.current.scrollTop = event.currentTarget.scrollTop;
            }
          }}
          placeholder="Kendini birkaç kelimeyle anlat."
          aria-label="Kısa açıklama"
          aria-invalid={bioTooLong}
          aria-describedby="bio-counter bio-error"
        />
        <span id="bio-counter" className="onboarding-character-count" aria-live="polite">
          {remaining}
        </span>
      </div>
      <p id="bio-error" className={`onboarding-validation-message ${bioTooLong ? "is-visible" : ""}`}>
        {bioTooLong
          ? `Açıklama ${Math.abs(remaining)} karakter fazla. Devam etmek için metni kısalt.`
          : ""}
      </p>
      <BottomActions canSkip={false} disabled={bioTooLong || !name.trim()} />
    </Form>
  );
}

function PlatformsStep({ initial }: { initial: SocialPlatform[] }) {
  const [selected, setSelected] = useState<SocialPlatform[]>(initial);
  return (
    <Form method="post" className="onboarding-form">
      {selected.map((platform) => (
        <input key={platform} type="hidden" name="platform" value={platform} />
      ))}
      <header className="onboarding-heading">
        <h1>Hangi platformlardasın?</h1>
        <p>Seçtiğin her platform sayfanda bir blok olarak görünür. Kullanıcı adlarını sonra da girebilirsin.</p>
      </header>
      <div className="platform-grid">
        {onboardingPlatforms.map((platform) => {
          const active = selected.includes(platform.id);
          return (
            <button
              key={platform.id}
              type="button"
              aria-pressed={active}
              className={active ? "is-selected" : ""}
              onClick={() =>
                setSelected((items) =>
                  items.includes(platform.id)
                    ? items.filter((item) => item !== platform.id)
                    : [...items, platform.id],
                )
              }
            >
              <span className={`platform-mark ${platform.tone}`}>
                <SocialIcon platform={platform.id} width={18} height={18} strokeWidth={2.2} />
              </span>
              <span>{platform.label}</span>
            </button>
          );
        })}
      </div>
      <BottomActions />
    </Form>
  );
}

function PurposeStep({ initial }: { initial: string[] }) {
  const [selected, setSelected] = useState(initial);
  return (
    <Form method="post" className="onboarding-form">
      {selected.map((purpose) => (
        <input key={purpose} type="hidden" name="purpose" value={purpose} />
      ))}
      <header className="onboarding-heading">
        <h1>Caka’yı ne için kullanacaksın?</h1>
        <p>Sana uyanları seç. Sayfanı buna göre hazırlayalım, ayarlarla uğraşma.</p>
      </header>
      <div className="selection-list">
        {onboardingPurposes.map((purpose) => {
          const active = selected.includes(purpose.id);
          return (
            <button
              key={purpose.id}
              type="button"
              aria-pressed={active}
              className={active ? "is-selected" : ""}
              onClick={() =>
                setSelected((items) =>
                  items.includes(purpose.id)
                    ? items.filter((item) => item !== purpose.id)
                    : [...items, purpose.id],
                )
              }
            >
              <PurposeIcon name={purpose.icon} />
              <span>{purpose.label}</span>
              {active ? <Check className="ml-auto" size={19} /> : null}
            </button>
          );
        })}
      </div>
      <BottomActions />
    </Form>
  );
}

function DiscoveryStep({ initial }: { initial: string }) {
  const [selected, setSelected] = useState(initial);
  return (
    <Form method="post" className="onboarding-form">
      <header className="onboarding-heading">
        <h1>Sayfana geçmeden son bir soru</h1>
        <p>Caka’yı nereden duydun?</p>
      </header>
      <div className="selection-list discovery-list">
        {discoveryOptions.map((option) => (
          <label key={option.id} className={selected === option.id ? "is-selected" : ""}>
            <PurposeIcon name={option.icon} />
            <span>{option.label}</span>
            <input
              type="radio"
              name="discovery"
              value={option.id}
              checked={selected === option.id}
              onChange={() => setSelected(option.id)}
            />
            <span className="radio-dot" />
          </label>
        ))}
      </div>
      <BottomActions label="Sayfama git" />
    </Form>
  );
}

function TemplateStep({
  initial,
  name,
  avatarUrl,
  platforms,
}: {
  initial: string;
  name: string;
  avatarUrl: string | null;
  platforms: SocialPlatform[];
}) {
  const [selected, setSelected] = useState(initial || "gece");
  const previewPlatforms = platforms.slice(0, 3);
  return (
    <Form method="post" className="onboarding-form onboarding-wide-form">
      <input type="hidden" name="template" value={selected} />
      <header className="onboarding-heading compact">
        <h1>Bir şablon seç</h1>
        <p>Sana uyan stili seç, içeriğini sonra ekle.</p>
      </header>
      <div className="template-grid">
        {onboardingTemplates.map((template) => (
          <button
            type="button"
            key={template.id}
            aria-pressed={selected === template.id}
            className={`${template.className} ${selected === template.id ? "is-selected" : ""}`}
            onClick={() => setSelected(template.id)}
          >
            <ProfileAvatar name={name} avatarUrl={avatarUrl} className="template-avatar" />
            <strong>{name.split(" ")[0]}</strong>
            <small>Tasarım · İstanbul</small>
            <span className="template-social-list" aria-hidden>
              {(previewPlatforms.length ? previewPlatforms : [null, null, null]).map((platform, index) => {
                const config = platform ? platformById(platform) : null;
                return (
                  <span className="template-social-row" key={platform ?? `placeholder-${index}`}>
                    <span className={`template-social-icon ${config?.tone ?? "is-placeholder"}`}>
                      {platform ? <SocialIcon platform={platform} width={12} height={12} strokeWidth={2.2} /> : null}
                    </span>
                    <span className="template-social-skeleton" />
                  </span>
                );
              })}
            </span>
          </button>
        ))}
      </div>
      <BottomActions label="Bu şablonla başla" />
    </Form>
  );
}

function LinksStep({ platforms, links }: { platforms: SocialPlatform[]; links: OnboardingLink[] }) {
  const selected = platforms.length ? platforms : (["website"] as SocialPlatform[]);
  const initial = new Map(links.map((link) => [link.platform, link.value]));
  const [extras, setExtras] = useState(["", ""]);
  return (
    <Form method="post" className="onboarding-form links-form">
      <header className="onboarding-heading compact">
        <h1>Bağlantılarını ekle</h1>
        <p>Seçtiğin platformların kullanıcı adlarını gir.</p>
      </header>
      <section className="link-fields">
        <h2>Seçtiklerin</h2>
        {selected.map((platform) => {
          const config = platformById(platform);
          return (
            <label key={platform}>
              <span className={`platform-mark ${config.tone}`}>
                <SocialIcon platform={config.id} width={18} height={18} strokeWidth={2.2} />
              </span>
              <span className="floating-input">
                <small>{platform === "website" ? "Adres" : "Kullanıcı adı"}</small>
                <input
                  name="linkValue"
                  defaultValue={initial.get(platform) ?? ""}
                  placeholder={config.placeholder}
                  autoCapitalize="none"
                />
              </span>
              <input type="hidden" name="linkPlatform" value={platform} />
            </label>
          );
        })}
        <h2>Ek bağlantılar</h2>
        {extras.map((value, index) => (
          <label key={index}>
            <span className="platform-mark platform-link">↗</span>
            <span className="floating-input single-line">
              <input
                name="extraLink"
                value={value}
                placeholder="adres"
                onChange={(event) =>
                  setExtras((items) => items.map((item, i) => (i === index ? event.target.value : item)))
                }
              />
            </span>
          </label>
        ))}
      </section>
      <BottomActions />
    </Form>
  );
}

function PreparingStep() {
  const navigate = useNavigate();
  useEffect(() => {
    const timer = window.setTimeout(() => navigate(stepPath("hazir")), 1600);
    return () => window.clearTimeout(timer);
  }, [navigate]);
  return (
    <div className="preparing-card" aria-live="polite">
      <h1><span className="loading-ring" /> İçeriğin bulunuyor…</h1>
      <div className="preparing-grid" aria-hidden>
        {Array.from({ length: 9 }, (_, index) => <span key={index} />)}
      </div>
      <p>Bağlantıların sayfana yerleştiriliyor</p>
    </div>
  );
}

function ReadyStep({
  name,
  bio,
  avatarUrl,
  links,
}: {
  name: string;
  bio: string;
  avatarUrl: string | null;
  links: OnboardingLink[];
}) {
  return (
    <div className="ready-screen">
      <header className="onboarding-heading compact">
        <h1>Güzel görünüyor</h1>
        <p>Sayfan iyi bir başlangıç yaptı. Düzenlemeye devam ederek daha da iyileştirebilirsin.</p>
      </header>
      <div className="ready-preview">
        <ProfileAvatar name={name} avatarUrl={avatarUrl} className="size-16" />
        <strong>{name}</strong>
        <small>{bio}</small>
        <div>
          {links.slice(0, 2).map((link) => {
            const platform = platformById(link.platform);
            return (
              <span key={`${link.platform}-${link.value}`}>
                <span className={`platform-mark ${platform.tone}`}>
                  <SocialIcon platform={platform.id} width={18} height={18} strokeWidth={2.2} />
                </span>
              </span>
            );
          })}
        </div>
        <p>Yeni sayfan yayında</p>
      </div>
      <Link className="ready-button" to="/edit">Sayfamı düzenlemeye devam et</Link>
    </div>
  );
}

export default function OnboardingSetup({ loaderData, actionData }: Route.ComponentProps) {
  const { step, onboarding, defaults, username } = loaderData;
  const back = PREVIOUS_STEP[step];
  const content = useMemo(() => {
    if (step === "profil") return <ProfileStep defaults={defaults} username={username} />;
    if (step === "platformlar") return <PlatformsStep initial={onboarding.platforms ?? []} />;
    if (step === "amac") return <PurposeStep initial={onboarding.purposes ?? []} />;
    if (step === "kesif") return <DiscoveryStep initial={onboarding.discovery ?? ""} />;
    if (step === "sablon") {
      return (
        <TemplateStep
          initial={onboarding.template ?? ""}
          name={defaults.name}
          avatarUrl={defaults.avatarUrl}
          platforms={onboarding.platforms ?? []}
        />
      );
    }
    if (step === "baglantilar") {
      return <LinksStep platforms={onboarding.platforms ?? []} links={onboarding.links ?? []} />;
    }
    if (step === "hazirlaniyor") return <PreparingStep />;
    return (
      <ReadyStep
        name={onboarding.name ?? defaults.name}
        bio={onboarding.bio ?? ""}
        avatarUrl={defaults.avatarUrl}
        links={onboarding.links ?? []}
      />
    );
  }, [defaults, onboarding, step, username]);

  return (
    <main className="onboarding-shell">
      {step !== "hazir" ? (
        <nav className="onboarding-topbar" aria-label="Kurulum adımları">
          {back ? (
            <Link className="onboarding-back" to={stepPath(back)}>
              <ChevronLeft size={17} strokeWidth={2} />
              Geri
            </Link>
          ) : <span className="onboarding-back-placeholder" aria-hidden />}
          <Progress step={step} />
          <span className="onboarding-topbar-spacer" aria-hidden />
        </nav>
      ) : null}
      {actionData?.error ? <p className="onboarding-global-error">{actionData.error}</p> : null}
      {content}
    </main>
  );
}
