import { MAX_POSTS_PER_PROFILE, POST_BODY_MAX_BYTES } from "@caka/shared";

import type { YaziEditorContent } from "./index";

const MAX_KB = POST_BODY_MAX_BYTES / 1024;

export const es = {
  nav: "Publicaciones",

  list: {
    title: "Publicaciones",
    intro: `Textos largos publicados bajo tu perfil en su propia dirección. Puedes tener hasta ${MAX_POSTS_PER_PROFILE} publicaciones; los borradores también cuentan.`,
    empty: "Aún no tienes publicaciones. Empieza la primera aquí abajo.",
    newPost: "Nueva publicación",
    limitReason: `Alcanzaste el límite de ${MAX_POSTS_PER_PROFILE} publicaciones. Elimina una antes de empezar otra.`,
    statusDraft: "Borrador",
    statusPublished: "Publicada",
  },

  editor: {
    metaTitle: "Editor de publicaciones",
    backToList: "Volver a publicaciones",
    titlePlaceholder: "Título",
    bodyPlaceholder: "Empieza a escribir…",
    slugLabel: "Dirección",
    slugHint: "La dirección puede cambiarse hasta que la publicación se publique por primera vez.",
    slugAutoHint: "La dirección se crea automáticamente a partir del título. Puedes editarla si quieres.",
    slugEdit: "Editar",
    slugDone: "Listo",
    slugLockedReason:
      "La dirección de una publicación ya publicada no puede cambiarse, para que los enlaces compartidos no se rompan.",
    slugStatus: {
      checking: "Comprobando dirección…",
      available: "Esta dirección está disponible.",
      taken: "Esta dirección ya la usa otra de tus publicaciones.",
      too_short: "La dirección debe tener al menos 3 caracteres.",
      too_long: "La dirección puede tener como máximo 80 caracteres.",
      invalid_chars: "La dirección solo puede contener minúsculas, dígitos y guiones.",
      reserved: "Esta dirección está reservada; elige otra.",
    },
    save: {
      pending: "El borrador se guarda automáticamente al añadir un título.",
      saving: "Guardando…",
      saved: "Guardado",
      error: "No se pudo guardar — revisa tu conexión. Tus cambios siguen en esta pestaña.",
      conflict:
        "Esta publicación se actualizó en otra pestaña. Tus últimos cambios aquí no se guardaron — copia tu texto antes de recargar.",
      unauthenticated:
        "Parece que tu sesión se cerró. Inicia sesión en una pestaña nueva; tus cambios siguen en esta pestaña.",
      tooLarge: `La publicación supera el límite de ${MAX_KB} KB y no se está guardando. Acorta el contenido para guardar.`,
    },
    sizeIndicator: (kb: string): string => `${kb} / ${MAX_KB} KB`,
    publish: "Publicar",
    unpublish: "Pasar a borrador",
    remove: "Eliminar",
    removeDialog: {
      title: "¿Eliminar publicación?",
      body: "Esta publicación se eliminará de forma permanente. Esta acción no se puede deshacer.",
      cancel: "Cancelar",
      confirm: "Eliminar permanentemente",
    },
    viewPost: "Abrir publicación",
    actionFailed: "No se pudo completar la acción; inténtalo de nuevo.",
    validationTitle: "Añade un título antes de publicar.",
    validationSlug: "Elige una dirección válida y disponible antes de publicar.",
    publishedToast: {
      title: "Tu publicación está publicada",
      body: "Puedes añadir a tu página una tarjeta que liste tus publicaciones automáticamente.",
      addToPage: "Añadir a mi página",
      dismiss: "Ahora no",
    },
    toolbar: {
      h2: "Encabezado",
      h3: "Subencabezado",
      codeBlock: "Bloque de código",
      image: "Añadir imagen",
    },
    imageUploadFailed: "No se pudo subir la imagen",
  },
} satisfies YaziEditorContent;
