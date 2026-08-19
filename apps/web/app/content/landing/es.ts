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
        { label: "Escaparate", href: "/#karakterler" },
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
      alt: "Una franja con tarjetas de cuatro páginas de Caka",
      pause: "Detener la tira",
      play: "Reproducir la tira",
    },
    tower: {
      kerem: {
        bio: "Músico · Estambul",
        status: "Esta semana en el estudio",
        document: "Kit de prensa",
        link: "Fechas de conciertos",
      },
      selin: {
        bio: "Cerámica · Bodrum",
        status: "Taller abierto el sábado",
        link: "Nueva colección: Toprak",
        location: "Bodrum, Muğla",
        country: "Turquía",
      },
      elif: {
        bio: "Pódcast · Ankara",
        status: "Nuevo episodio el jueves",
        youtube: "Sade Hayat — detrás del episodio 7",
        link: "Todos los episodios",
      },
      naz: {
        bio: "Locutora · Esmirna",
        status: "Agenda abierta para grabar",
        text: "Escríbeme para trabajos de voz.",
        link: "Historias en audio",
      },
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
        question: "¿Puedo eliminar mi cuenta?",
        answer:
          "Sí, puedes hacerlo tú mismo: entra en Ajustes → Cuenta, escribe tu dirección y confirma. La eliminación es inmediata y no se puede deshacer.",
      },
      {
        question: "¿Qué pasa cuando elimino mi cuenta?",
        answer:
          "Tu página deja de estar publicada al instante; tu diseño, las imágenes y documentos que subiste, las estadísticas de tu página y tus sesiones se borran. Tu dirección queda bloqueada 30 días: nadie puede tomarla en ese tiempo, así los códigos QR que imprimiste no acaban en la página de un desconocido. Después el nombre vuelve a quedar libre.",
      },
      {
        question: "¿Puedo exportar mi contenido?",
        answer:
          "La exportación todavía no está en el panel. Para pedir una copia de tus datos, escribe a hello@caka.app: es tu derecho según el artículo 11 de la ley turca de protección de datos (KVKK).",
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
          { label: "Escaparate", href: "/#karakterler" },
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
  farewell: {
    title: "Tu cuenta ha sido eliminada",
    body: "Tu página ya no está publicada y tus datos se han borrado. Puedes empezar de nuevo cuando quieras.",
  },
} satisfies LandingContent;
