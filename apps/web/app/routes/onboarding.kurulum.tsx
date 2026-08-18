import { useEffect, useMemo, useRef, useState } from "react";
import { env } from "cloudflare:workers";
import {
  AtSign,
  Calendar,
  Check,
  EditPencil,
  GraphUp,
  Group,
  Link as LinkIcon,
  Mail,
  MediaImage,
  MoreHoriz,
  NavArrowLeft,
  Rocket,
  Search,
  Shop,
  Sparks,
} from "iconoir-react";
import { Form, Link, data, redirect, useNavigate, useNavigation } from "react-router";

import { ProfileAvatar } from "~/components/profile-avatar";
import { SocialIcon } from "~/components/icons/social";
import {
  DISCOVERY_IDS,
  PURPOSE_IDS,
  TEMPLATE_ORDER,
} from "~/content/onboarding/shared";
import { useOnboardingLists } from "~/lib/onboarding";
import { parseSeedProfile } from "~/lib/profile-view";
import { noIndexMeta } from "~/lib/seo";
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
import { localeFromRequest, localizedRedirect } from "../../server/locale";
import { DEFAULT_LOCALE } from "@caka/shared";
import { appCatalog } from "~/content/app";
import { useCatalog } from "~/lib/locale";

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
  return noIndexMeta(appCatalog[DEFAULT_LOCALE].titles.setup);
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const session = await getSession(env, request);
  if (!session) throw localizedRedirect(request, "/login");
  const profile = await getProfileByUserId(env, session.user.id);
  if (!profile) throw localizedRedirect(request, "/onboarding");
  const step = asStep(params.step);
  if (!step) throw redirect(stepPath("profil"));

  const finishStep = step === "hazirlaniyor" || step === "hazir";
  if (profile.onboardingCompletedAt && !finishStep) throw localizedRedirect(request, "/edit");
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
  // Sunucu tarafı: hook yok, katalog doğrudan istekten çözülen dille okunur.
  const app = appCatalog[localeFromRequest(request)];
  const session = await getSession(env, request);
  if (!session) throw localizedRedirect(request, "/login");
  const profile = await getProfileByUserId(env, session.user.id);
  if (!profile) throw localizedRedirect(request, "/onboarding");
  const step = asStep(params.step);
  if (!step || step === "hazirlaniyor" || step === "hazir") {
    throw redirect(stepPath("profil"));
  }

  const form = await request.formData();
  const intent = String(form.get("intent") ?? "continue");
  let patch: OnboardingData = {};

  if (step === "profil") {
    const name = sanitizeText(form.get("name"), PROFILE_NAME_MAX);
    if (!name) return data({ error: app.setup.nameRequired }, { status: 400 });
    const bio = readText(form.get("bio"));
    if (bio.length > PROFILE_BIO_MAX) {
      return data(
        { error: `Açıklama en fazla ${PROFILE_BIO_MAX} karakter olabilir` },
        { status: 400 },
      );
    }
    const avatarAssetId = sanitizeText(form.get("avatarAssetId"), 64);
    if (avatarAssetId && !(await isAssetOwnedByUser(env, avatarAssetId, session.user.id))) {
      return data({ error: app.setup.photoInvalid }, { status: 400 });
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
    const allowed = new Set<string>(PURPOSE_IDS);
    patch = {
      purposes: form
        .getAll("purpose")
        .map(String)
        .filter((value) => allowed.has(value as never)),
    };
  }

  if (step === "kesif") {
    const allowed = new Set<string>(DISCOVERY_IDS);
    const discovery = String(form.get("discovery") ?? "");
    patch = { discovery: allowed.has(discovery as never) ? discovery : "" };
  }

  if (step === "sablon") {
    const template = intent === "skip" ? "sade" : String(form.get("template") ?? "sade");
    patch = {
      template: TEMPLATE_ORDER.some((item) => item.id === template)
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
      return data({ error: app.setup.linkInvalid }, { status: 400 });
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
  const icons: Record<string, typeof LinkIcon> = {
    link: LinkIcon,
    image: MediaImage,
    calendar: Calendar,
    mail: Mail,
    store: Shop,
    trend: GraphUp,
    search: Search,
    sparkles: Sparks,
    at: AtSign,
    users: Group,
    rocket: Rocket,
    more: MoreHoriz,
  };
  const Icon = icons[name] ?? LinkIcon;
  return <Icon width={21} height={21} strokeWidth={1.8} />;
}

function ProfileStep({
  defaults,
  username,
}: {
  defaults: { name: string; bio: string; avatarUrl: string | null; avatarAssetId: string | null };
  username: string;
}) {
  const app = useCatalog(appCatalog);
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
        throw new Error(result.error || app.setup.photoUploadFailed);
      }
      setAvatarAssetId(result.id);
      setAvatarUrl(result.url);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : app.setup.photoUploadFailed);
    } finally {
      setUploading(false);
    }
  }

  return (
    <Form method="post" className="onboarding-form onboarding-profile-form">
      <input type="hidden" name="avatarAssetId" value={avatarAssetId} />
      <p className="onboarding-account-note">
        <AtSign width={18} height={18} /> {username} hesabından alındı
      </p>
      <button
        className="onboarding-avatar-button"
        type="button"
        onClick={() => fileRef.current?.click()}
      >
        <span className="onboarding-avatar-visual">
          <ProfileAvatar name={name || defaults.name} avatarUrl={avatarUrl} className="size-28" />
          <span className="avatar-edit-badge" aria-hidden><EditPencil width={16} height={16} /></span>
        </span>
        <span>{uploading ? app.setup.photoUploading : app.setup.photoReplace}</span>
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
        aria-label={app.setup.nameLabel}
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
          placeholder={app.setup.bioPlaceholder}
          aria-label={app.setup.bioLabel}
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
  const app = useCatalog(appCatalog);
  const lists = useOnboardingLists();
  const [selected, setSelected] = useState<SocialPlatform[]>(initial);
  return (
    <Form method="post" className="onboarding-form">
      {selected.map((platform) => (
        <input key={platform} type="hidden" name="platform" value={platform} />
      ))}
      <header className="onboarding-heading">
        <h1>{app.setup.platformsTitle}</h1>
        <p>{app.setup.platformsBody}</p>
      </header>
      <div className="platform-grid">
        {lists.platforms.map((platform) => {
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
  const app = useCatalog(appCatalog);
  const lists = useOnboardingLists();
  const [selected, setSelected] = useState(initial);
  return (
    <Form method="post" className="onboarding-form">
      {selected.map((purpose) => (
        <input key={purpose} type="hidden" name="purpose" value={purpose} />
      ))}
      <header className="onboarding-heading">
        <h1>{app.setup.purposeTitle}</h1>
        <p>{app.setup.purposeBody}</p>
      </header>
      <div className="selection-list">
        {lists.purposes.map((purpose) => {
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
              {active ? <Check className="ml-auto" width={19} height={19} /> : null}
            </button>
          );
        })}
      </div>
      <BottomActions />
    </Form>
  );
}

function DiscoveryStep({ initial }: { initial: string }) {
  const app = useCatalog(appCatalog);
  const lists = useOnboardingLists();
  const [selected, setSelected] = useState(initial);
  return (
    <Form method="post" className="onboarding-form">
      <header className="onboarding-heading">
        <h1>{app.setup.discoveryKicker}</h1>
        <p>{app.setup.discoveryTitle}</p>
      </header>
      <div className="selection-list discovery-list">
        {lists.discovery.map((option) => (
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
  const app = useCatalog(appCatalog);
  const lists = useOnboardingLists();
  const [selected, setSelected] = useState(initial || "gece");
  const previewPlatforms = platforms.slice(0, 3);
  return (
    <Form method="post" className="onboarding-form onboarding-wide-form">
      <input type="hidden" name="template" value={selected} />
      <header className="onboarding-heading compact">
        <h1>{app.setup.templateTitle}</h1>
        <p>{app.setup.templateBody}</p>
      </header>
      <div className="template-grid">
        {lists.templates.map((template) => (
          <button
            type="button"
            key={template.id}
            aria-pressed={selected === template.id}
            className={`${template.className} ${selected === template.id ? "is-selected" : ""}`}
            onClick={() => setSelected(template.id)}
          >
            {selected === template.id ? (
              <span className="template-check" aria-hidden>
                <Check width={17} height={17} strokeWidth={3} />
              </span>
            ) : null}
            <ProfileAvatar name={name} avatarUrl={avatarUrl} className="template-avatar" />
            <strong>{name.split(" ")[0]}</strong>
            <small>{app.setup.templatePreviewRole}</small>
            <span className="template-social-list" aria-hidden>
              {(previewPlatforms.length ? previewPlatforms : [null, null, null]).map((platform, index) => {
                const config = platform ? lists.byId(platform) : null;
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
      <BottomActions label={app.setup.templateUse} />
    </Form>
  );
}

function LinksStep({ platforms, links }: { platforms: SocialPlatform[]; links: OnboardingLink[] }) {
  const app = useCatalog(appCatalog);
  const lists = useOnboardingLists();
  const selected = platforms.length ? platforms : (["website"] as SocialPlatform[]);
  const initial = new Map(links.map((link) => [link.platform, link.value]));
  const [extras, setExtras] = useState(["", ""]);
  return (
    <Form method="post" className="onboarding-form links-form">
      <header className="onboarding-heading compact">
        <h1>{app.setup.linksTitle}</h1>
        <p>{app.setup.linksBody}</p>
      </header>
      <section className="link-fields">
        <h2>{app.setup.linksChosen}</h2>
        {selected.map((platform) => {
          const config = lists.byId(platform);
          return (
            <label key={platform}>
              <span className={`platform-mark ${config.tone}`}>
                <SocialIcon platform={config.id} width={18} height={18} strokeWidth={2.2} />
              </span>
              <span className="floating-input">
                <small>{platform === "website" ? "Adres" : app.setup.usernameLabel}</small>
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
        <h2>{app.setup.extraLinks}</h2>
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
  const app = useCatalog(appCatalog);
  const navigate = useNavigate();
  useEffect(() => {
    const timer = window.setTimeout(() => navigate(stepPath("hazir")), 1600);
    return () => window.clearTimeout(timer);
  }, [navigate]);
  return (
    <div className="preparing-card" aria-live="polite">
      <h1><span className="loading-ring" /> {app.setup.buildingContent}</h1>
      <div className="preparing-grid" aria-hidden>
        {Array.from({ length: 9 }, (_, index) => <span key={index} />)}
      </div>
      <p>{app.setup.buildingLinks}</p>
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
  const app = useCatalog(appCatalog);
  const lists = useOnboardingLists();
  return (
    <div className="ready-screen">
      <header className="onboarding-heading compact">
        <h1>{app.setup.readyKicker}</h1>
        <p>{app.setup.readyBody}</p>
      </header>
      <div className="ready-preview">
        <ProfileAvatar name={name} avatarUrl={avatarUrl} className="size-16" />
        <strong>{name}</strong>
        <small>{bio}</small>
        <div>
          {links.slice(0, 2).map((link) => {
            const platform = lists.byId(link.platform);
            return (
              <span key={`${link.platform}-${link.value}`}>
                <span className={`platform-mark ${platform.tone}`}>
                  <SocialIcon platform={platform.id} width={18} height={18} strokeWidth={2.2} />
                </span>
              </span>
            );
          })}
        </div>
        <p>{app.setup.readyTitle}</p>
      </div>
      <Link className="ready-button" to="/edit">{app.setup.readyCta}</Link>
    </div>
  );
}

export default function OnboardingSetup({ loaderData, actionData }: Route.ComponentProps) {
  const app = useCatalog(appCatalog);
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
        <nav className="onboarding-topbar" aria-label={app.setup.stepsLabel}>
          {back ? (
            <Link className="onboarding-back" to={stepPath(back)}>
              <NavArrowLeft width={17} height={17} strokeWidth={2} />
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
