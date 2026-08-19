import {
  USERNAME_CHANGE_COOLDOWN_DAYS,
  USERNAME_MAX,
  USERNAME_MIN,
  USERNAME_REDIRECT_DAYS,
  formatDate,
} from "@caka/shared";

import type { AyarlarContent } from "./index";

export const es = {
  title: "Ajustes",
  sectionNavLabel: "Secciones de ajustes",
  sectionLabels: {
    adres: "Dirección",
    dil: "Idioma",
    "paylasim-gorseli": "Imagen para compartir",
    hesap: "Cuenta",
  },

  address: {
    title: "Dirección",
    hint: "La dirección en la que está publicada tu página. Si la cambias, la anterior sigue funcionando un tiempo y luego deja de hacerlo.",
    currentLabel: "Tu dirección actual",
    fieldLabel: "Nueva dirección",
    domain: "caka.app/",
    placeholder: "tunuevonombre",
    hintFormat: `${USERNAME_MIN}-${USERNAME_MAX} caracteres; minúsculas, números y guiones.`,
    consequencesTitle: "Ten esto en cuenta antes de cambiarla",
    consequences: [
      `Tu dirección anterior redirige temporalmente a la nueva durante ${USERNAME_REDIRECT_DAYS} días. Cuando ese plazo termina, la redirección se acaba y la dirección anterior deja de funcionar.`,
      `Durante esos mismos ${USERNAME_REDIRECT_DAYS} días tu dirección anterior queda bloqueada; nadie más puede quedársela en ese tiempo.`,
      "Los códigos QR que hayas impreso, tus tarjetas de visita y los enlaces antiguos que hayas puesto en otros sitios dejarán de funcionar cuando acabe el plazo: tendrás que actualizarlos.",
      `Después de un cambio no puedes volver a cambiar tu dirección durante ${USERNAME_CHANGE_COOLDOWN_DAYS} días.`,
    ],
    confirmLabel: "He leído lo anterior y quiero cambiar mi dirección.",
    submit: "Cambiar dirección",
    submitting: "Cambiando…",
    checking: "comprobando…",
    available: "esta dirección está libre",
    unavailable: "Esta dirección está ocupada",
    activeRedirectsTitle: "Tus direcciones anteriores que aún redirigen",
  },

  language: {
    title: "Idioma",
    hint: "El idioma en el que ves Caka. Tu elección se recuerda en este navegador.",
    fieldLabel: "Idioma de la interfaz",
    note: "El contenido de tu propia página no se traduce; solo cambia la interfaz de Caka.",
  },

  share: {
    title: "Imagen para compartir",
    hint: "Esta imagen aparece cuando se comparte el enlace de tu página en WhatsApp, X, LinkedIn y otros sitios.",
    templateTitle: "Plantilla",
    templateGroupLabel: "Selección de plantilla",
    previewAlt: (label: string) => `Vista previa de la imagen para compartir seleccionada — ${label}`,
    photoTitle: "Fuente de la foto",
    photoGroupLabel: "Selección de la fuente de la foto",
    photoHint: "La foto que se usa en las plantillas Retrato y A sangre.",
    photoEmptyHint:
      "Las plantillas Retrato y A sangre usan tu foto de perfil. Si añades un bloque de imagen a tu página y la publicas, también podrás elegirla aquí.",
    photoDefaultLabel: "Mi foto de perfil",
    photoFallbackLabel: (index: number) => `Imagen ${index + 1}`,
  },

  account: {
    title: "Cuenta",
    hint: "Estos datos vienen de la cuenta con la que iniciaste sesión; no se cambian desde aquí.",
    providerLabel: "Método de acceso",
    providerUnknown: "Desconocido",
    emailLabel: "Correo electrónico",
    emailVerified: "verificado",
    dataTitle: "Tus datos",
    dataBody:
      "Pedir una copia de tus datos todavía no se hace por tu cuenta desde el panel. Si escribes a hello@caka.app, tu solicitud según el artículo 11 de la ley turca de protección de datos (KVKK) se tramitará.",
    dataMailLabel: "hello@caka.app",
    dataMailHref: "mailto:hello@caka.app",
    privacyLinkLabel: "Política de Privacidad",
    privacyLinkHref: "/gizlilik",
    privacyLinkPrefix: "Más información:",

    deleteTitle: "Elimina tu cuenta",
    deleteBody:
      "Puedes eliminar tu cuenta tú mismo, aquí. La eliminación es inmediata, no se puede deshacer y el soporte tampoco puede recuperarla.",
    deleteConsequencesTitle: "Antes de eliminar, ten esto en cuenta",
    deleteConsequences: [
      "Tu página deja de estar publicada al instante; tu diseño, tus bloques y todo lo que escribiste se borran.",
      "Todas las imágenes y documentos que subiste se eliminan de forma permanente.",
      "Los contadores de visitas y clics de tu página, tus sesiones y tu vínculo de acceso se eliminan.",
      `Tu dirección queda bloqueada ${USERNAME_REDIRECT_DAYS} días: durante ese tiempo nadie —tú incluido— puede tomarla y la dirección devuelve 404. Así los códigos QR que imprimiste no acaban en la página de un desconocido.`,
      "Puedes registrarte de nuevo con el mismo correo, pero tu página anterior no volverá y tendrás que elegir otra dirección.",
    ],
    deleteFieldLabel: "Escribe tu dirección para confirmar",
    deleteFieldHint: (username: string) => `Escribe ${username} en el campo.`,
    deleteConfirmLabel:
      "Entiendo que mi cuenta y todo mi contenido se eliminarán de forma permanente y que esto no se puede deshacer.",
    deleteSubmit: "Eliminar mi cuenta para siempre",
    deleteSubmitting: "Eliminando…",
    deleteErrors: {
      mismatch: "Lo que escribiste no coincide con tu dirección",
      no_profile: "No se encontró tu perfil",
      origin: "Origen de la solicitud no válido",
      unknown: "No se pudo completar la eliminación, inténtalo de nuevo",
    },
  },

  addressErrors: {
    same: "Esa ya es tu dirección",
    cooldown: `Cambiaste tu dirección en los últimos ${USERNAME_CHANGE_COOLDOWN_DAYS} días; todavía no puedes volver a cambiarla`,
    taken: "Esta dirección está ocupada, prueba con otra",
    locked: "Esta dirección es la dirección anterior de otro usuario y está bloqueada ahora mismo",
    no_profile: "No se ha encontrado tu perfil",
    conflict: "Tu dirección se cambió en otro sitio; actualiza la página",
    origin: "Origen de la solicitud no válido",
    unknown: "Algo ha salido mal, inténtalo de nuevo",
  },

  notices: {
    cooldown: (availableOn: string, remainingDays: number) =>
      `Has cambiado tu dirección hace poco. Podrás volver a cambiarla a partir del ${formatDate(availableOn, "es")} (unos ${remainingDays} días).`,
    redirect: (oldUsername: string, expiresOn: string) =>
      `caka.app/${oldUsername} — redirige aquí y está bloqueada hasta el ${formatDate(expiresOn, "es")}.`,
    success: (previousUsername: string, username: string, expiresOn: string) =>
      `Tu dirección ahora es caka.app/${username}. caka.app/${previousUsername} redirigirá aquí hasta el ${formatDate(expiresOn, "es")}.`,
  },
} satisfies AyarlarContent;
