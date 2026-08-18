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
  },
  hero: {
    title: "Un enlace bio\nhecho a tu medida.",
    body: "Un solo enlace para tu Instagram, TikTok, YouTube y el resto de tus perfiles: reúne todo lo que compartes, creas y vendes.",
    claim: {
      domain: "caka.app/",
      placeholder: "tunombre",
      cta: "Empieza gratis",
      action: "/onboarding",
    },
    marquee: landingAssets.marquee,
  },
  minutes: {
    title: "Crea tu página de Caka\nen minutos",
    body: "Reúne tus redes sociales, tus sitios, tus proyectos y tu tienda en un único enlace. Ajusta cada detalle o empieza con un tema listo para usar.",
    cta: { label: "Empieza gratis", href: "/onboarding" },
  },
  share: {
    title: "Comparte tu Caka\ndonde quieras",
    body: "Pon tu dirección en tus perfiles, tus vídeos y tu tarjeta de visita. Lleva también el tráfico offline a tu página con tu código QR.",
    cta: { label: "Empieza gratis", href: "/onboarding" },
    image: landingAssets.shareImage,
  },
  audience: {
    title: "Conoce a tu público,\nmantén su interés",
    body: "Descubre en qué enlace hacen clic, de dónde llegan tus visitantes y qué funciona de verdad. Actualiza tu página en consecuencia.",
    cta: { label: "Empieza gratis", href: "/onboarding" },
  },
  faq: {
    title: "¿Preguntas? Respondidas",
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
    claim: {
      domain: "caka.app/",
      placeholder: "tunombre",
      cta: "Empieza gratis",
      action: "/onboarding",
    },
  },
  footer: {
    columns: [
      {
        title: "Caka",
        links: [
          { label: "Cómo funciona", href: "/#urun" },
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
