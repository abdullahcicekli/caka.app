import { landingAssets } from "./shared";
import type { LandingContent } from "./index";

export const es = {
  seo: {
    title: "Caka — una página personal a tu medida",
    description:
      "Reúne lo que creas, tus enlaces y tus proyectos en una sola página personal.",
    imageAlt: "Crea tu página personal con Caka",
  },
  nav: {
    login: { label: "Iniciar sesión", href: "/login" },
    cta: { label: "Empieza gratis", href: "/onboarding" },
    menu: {
      label: "Menú del sitio",
      open: "Menú",
      close: "Cerrar menú",
      links: [
        { label: "Cómo funciona", href: "/#urun" },
        { label: "Escaparate", href: "/#vitrin" },
        { label: "Preguntas", href: "/#sss" },
        { label: "Iniciar sesión", href: "/login" },
      ],
      card: {
        title: "Una página hecha de bloques",
        body: "Enlaces, fotos, música, mapas: todo en una sola cuadrícula.",
      },
      meta: [
        "Una página personal a tu medida",
        "Sin cookies de publicidad ni de analítica",
      ],
    },
  },
  hero: {
    kicker: "Una dirección para tu página personal\nGratis, publicada en minutos",
    title: "Un enlace bio\nhecho a tu medida.",
    media: {
      alt: "Retratos que muestran páginas de Caka",
      pause: "Detener la tira",
      play: "Reproducir la tira",
    },
    tower: {
      bio: "Músico · Estambul",
      link: "Nuevo single ya disponible",
      status: "Esta semana en el estudio",
      document: "Kit de prensa",
      location: "Kadıköy, Estambul",
      country: "Turquía",
      youtube: "Diario de estudio — episodio 3",
      link2: "Fechas de gira",
      text: "Abierto a nuevos proyectos: escríbeme.",
    },
    // Medyanın altına binen hap. Bir bio-link ürününde o hapın en
    // değerli hâli, adın orada talep edilmesidir.
    claim: {
      domain: "caka.app/",
      placeholder: "tunombre",
      cta: "Empieza gratis",
      action: "/onboarding",
    },
  },
  editorial: {
    body: "Un solo enlace para tu Instagram, TikTok, YouTube y el resto de tus perfiles: reúne todo lo que compartes, creas y vendes.",
  },
  minutes: {
    title: "Crea tu página de Caka en minutos",
    body: "Reúne tus redes sociales, tus sitios, tus proyectos y tu tienda en un único enlace. Ajusta cada detalle o empieza con un tema listo para usar.",
    cta: { label: "Empieza gratis", href: "/onboarding" },
  },
  share: {
    title: "Comparte tu Caka\ndonde quieras",
    body: "Pon tu dirección en tus perfiles, tus vídeos y tu tarjeta de visita. La tarjeta que se ve al compartir tu enlace también la eliges tú.",
    cta: { label: "Empieza gratis", href: "/onboarding" },
    badges: ["Una dirección", "Imagen al compartir"],
    pill: "Compartir",
    image: landingAssets.shareImage,
  },
  audience: {
    title: "Conoce a tu público,\nmantén su interés",
    body: "Descubre en qué enlace hacen clic, de qué país llegan tus visitantes y qué funciona de verdad. Actualiza tu página en consecuencia.",
    cta: { label: "Empieza gratis", href: "/onboarding" },
    badges: ["Clics", "Países"],
    pill: "Analíticas",
  },
  showcase: {
    title: "Diseñado para el uso real",
    body: "Tres pasos: monta tu página, compártela y mídela.",
    segments: [
      { id: "kur", label: "Monta" },
      { id: "paylas", label: "Comparte" },
      { id: "olc", label: "Mide" },
    ],
    cards: [
      {
        title: "Cuadrícula de bloques",
        body: "Arrastra tus bloques, cambia su tamaño y monta la página con tu propia composición.",
      },
      {
        title: "Temas listos",
        body: "Resuelve color y tipografía con una sola elección y cambia después lo que quieras.",
      },
      {
        title: "Una dirección",
        body: "caka.app/tunombre: el único enlace que pones en tus perfiles, vídeos y tarjeta de visita.",
      },
      {
        title: "Imagen al compartir",
        body: "Tú eliges la tarjeta que se ve al compartir tu enlace: la plantilla y la foto son tuyas.",
      },
      {
        title: "Resumen de clics",
        body: "Mira qué bloque despierta interés y reorganiza tu página alrededor de él.",
      },
      {
        title: "Países",
        body: "Mira de qué país llegan tus visitantes y sabe a qué público le estás hablando.",
      },
    ],
    prev: "Tarjeta anterior",
    next: "Tarjeta siguiente",
    trackLabel: "Tarjetas del escaparate",
  },
  karakterler: {
    title: "Cada página se parece a quien la hizo",
    body: "Un mismo producto, seis profesiones. Las pantallas de esos teléfonos son páginas reales de Caka, no capturas.",
    trackLabel: "Tarjetas de personajes",
    jobs: {
      yazilimci: "Ingeniero de software",
      youtuber: "YouTuber",
      sporHocasi: "Entrenador personal",
      muzisyen: "Músico",
      gazeteci: "Periodista",
      diyetisyen: "Dietista",
    },
  },
  faq: {
    title: "¿Preguntas? Respondidas",
    label: "Preguntas frecuentes",
    items: [
      {
        question: "¿Qué es Caka?",
        answer:
          "Caka es una página link-in-bio que reúne todos tus perfiles, proyectos y tu tienda en una sola dirección. En lugar de una lista de enlaces, montas tu propia composición.",
      },
      {
        question: "¿Qué incluye el plan gratuito?",
        answer:
          "El registro con Google, tu propia dirección, la edición por bloques en cuadrícula, el resumen de analíticas y la subida de imágenes están en el plan gratuito.",
      },
      {
        question: "¿Puedo conectar mi propio dominio?",
        answer:
          "Por ahora estás publicado en tu dirección dentro de caka.app. Conectar tu propio dominio llegará junto con el plan de pago.",
      },
      {
        question: "¿Puedo cambiar mi dirección más adelante?",
        answer:
          "Sí. Puedes cambiarla en Ajustes → Dirección; tu dirección anterior redirige a la nueva durante 30 días y queda bloqueada ese tiempo. Después de un cambio tienes que esperar 30 días para volver a cambiarla.",
      },
      {
        question: "¿Puedo exportar mi contenido o eliminar mi cuenta?",
        answer:
          "Por ahora ninguna de las dos cosas se hace por tu cuenta desde el panel. Para pedir una copia de tus datos o solicitar la eliminación de tu cuenta, escribe a hello@caka.app: es tu derecho según el artículo 11 de la ley turca de protección de datos (KVKK).",
        link: {
          label: "Política de Privacidad",
          href: "/gizlilik",
          legalDocument: "gizlilik" as const,
        },
      },
    ],
  },
  closingCta: {
    title: "Abre hoy tu propio\nrincón en internet",
    accent: "Gratis. Sin anuncios. Tuyo.",
    claim: {
      domain: "caka.app/",
      placeholder: "tunombre",
      cta: "Empieza gratis",
      action: "/onboarding",
    },
  },
  outro: {
    line: "La página que abres hoy mañana sigue siendo tuya.",
    pills: ["Código abierto", "En cinco idiomas", "caka.app"],
  },
  footer: {
    tagline: "Caka — una página personal a tu medida",
    columns: [
      {
        title: "Producto",
        links: [
          { label: "Cómo funciona", href: "/#urun" },
          { label: "Escaparate", href: "/#vitrin" },
          { label: "Preguntas", href: "/#sss" },
        ],
      },
      {
        title: "Caka",
        links: [
          { label: "Empieza gratis", href: "/onboarding" },
          { label: "Iniciar sesión", href: "/login" },
          { label: "Contacto", href: "mailto:hello@caka.app" },
        ],
      },
      {
        title: "Legal",
        links: [
          { label: "Privacidad", href: "/gizlilik", legalDocument: "gizlilik" as const },
          {
            label: "Términos de Uso",
            href: "/kullanim-kosullari",
            legalDocument: "kullanim-kosullari" as const,
          },
          {
            label: "Política de Cookies",
            href: "/cerez-politikasi",
            legalDocument: "cerez-politikasi" as const,
          },
        ],
      },
    ],
    social: landingAssets.social,
    trust: [
      {
        label: "Sin cookies de publicidad ni de analítica",
        href: "/cerez-politikasi",
        legalDocument: "cerez-politikasi" as const,
      },
      {
        label: "Código abierto",
        href: "https://github.com/abdullahcicekli/caka.app",
      },
    ],
    copyright: landingAssets.copyright,
  },
} satisfies LandingContent;
