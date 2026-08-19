import { landingAssets } from "./shared";
import type { LandingContent } from "./index";

export const ptBR = {
  seo: {
    title: "Caka — uma página pessoal do seu jeito",
    description:
      "Reúna o que você cria, seus links e seus projetos em uma única página pessoal.",
    imageAlt: "Crie sua página pessoal com o Caka",
  },
  nav: {
    login: { label: "Entrar", href: "/login" },
    cta: { label: "Comece grátis", href: "/onboarding" },
    menu: {
      label: "Menu do site",
      open: "Menu",
      close: "Fechar menu",
      links: [
        { label: "Como funciona", href: "/#urun" },
        { label: "Vitrine", href: "/#vitrin" },
        { label: "Dúvidas", href: "/#sss" },
        { label: "Entrar", href: "/login" },
      ],
      card: {
        title: "Uma página feita de blocos",
        body: "Links, fotos, música, mapas — tudo em uma grade só.",
      },
      meta: [
        "Uma página pessoal do seu jeito",
        "Sem cookies de publicidade ou analytics",
      ],
    },
  },
  hero: {
    kicker: "Um endereço para a sua página pessoal\nGrátis, no ar em minutos",
    title: "Um link na bio\ndo seu jeito.",
    media: {
      alt: "Retratos mostrando páginas do Caka",
      pause: "Pausar a faixa",
      play: "Reproduzir a faixa",
    },
    tower: {
      bio: "Músico · Istambul",
      link: "Novo single no ar",
      status: "Esta semana no estúdio",
      document: "Kit de imprensa",
      location: "Kadıköy, Istambul",
      country: "Turquia",
      youtube: "Diário de estúdio — episódio 3",
      link2: "Datas da turnê",
      text: "Aberto a novos trabalhos — me chame.",
    },
    // Medyanın altına binen hap. Bir bio-link ürününde o hapın en
    // değerli hâli, adın orada talep edilmesidir.
    claim: {
      domain: "caka.app/",
      placeholder: "seunome",
      cta: "Comece grátis",
      action: "/onboarding",
    },
  },
  editorial: {
    body: "Um único link para o seu Instagram, TikTok, YouTube e todos os outros perfis — reunindo tudo o que você compartilha, cria e vende.",
  },
  minutes: {
    title: "Monte sua página no Caka em minutos",
    body: "Reúna suas redes sociais, seus sites, seus projetos e sua loja em um só link. Ajuste cada detalhe do seu jeito ou comece com um tema pronto.",
    cta: { label: "Comece grátis", href: "/onboarding" },
  },
  share: {
    title: "Compartilhe seu Caka\nonde você quiser",
    body: "Coloque seu endereço nos seus perfis, nos seus vídeos e no seu cartão de visita. O cartão que aparece quando seu link é compartilhado você também escolhe.",
    cta: { label: "Comece grátis", href: "/onboarding" },
    badges: ["Um endereço", "Imagem ao compartilhar"],
    pill: "Compartilhar",
    image: landingAssets.shareImage,
  },
  audience: {
    title: "Conheça seu público,\nmantenha o interesse",
    body: "Veja em qual link clicam, de qual país vêm seus visitantes e o que realmente funciona. Atualize sua página com base nisso.",
    cta: { label: "Comece grátis", href: "/onboarding" },
    badges: ["Cliques", "Países"],
    pill: "Analytics",
  },
  showcase: {
    title: "Feito para o uso real",
    body: "Três passos: monte sua página, compartilhe e meça.",
    segments: [
      { id: "kur", label: "Monte" },
      { id: "paylas", label: "Compartilhe" },
      { id: "olc", label: "Meça" },
    ],
    cards: [
      {
        title: "Grade de blocos",
        body: "Arraste seus blocos, mude o tamanho e monte a página no seu próprio layout.",
      },
      {
        title: "Temas prontos",
        body: "Resolva cor e tipografia em uma escolha só e depois mude o que quiser.",
      },
      {
        title: "Um endereço",
        body: "caka.app/seunome — o único link que você põe nos perfis, nos vídeos e no cartão de visita.",
      },
      {
        title: "Imagem ao compartilhar",
        body: "Você escolhe o cartão que aparece quando seu link é compartilhado — modelo e foto são seus.",
      },
      {
        title: "Resumo de cliques",
        body: "Veja qual bloco chama atenção e reorganize sua página em torno dele.",
      },
      {
        title: "Países",
        body: "Veja de qual país vêm seus visitantes e saiba para quem você está falando.",
      },
    ],
    prev: "Cartão anterior",
    next: "Próximo cartão",
    trackLabel: "Cartões da vitrine",
  },
  karakterler: {
    title: "Cada página se parece com quem a fez",
    body: "Um mesmo produto, seis profissões. As telas desses celulares são páginas reais do Caka, não capturas.",
    trackLabel: "Cartões de personagens",
    jobs: {
      yazilimci: "Engenheiro de software",
      youtuber: "YouTuber",
      sporHocasi: "Personal trainer",
      muzisyen: "Músico",
      gazeteci: "Jornalista",
      diyetisyen: "Nutricionista",
    },
  },
  faq: {
    title: "Dúvidas? Respondidas",
    label: "Perguntas frequentes",
    items: [
      {
        question: "O que é o Caka?",
        answer:
          "O Caka é uma página de link na bio que reúne todos os seus perfis, projetos e sua loja em um único endereço. No lugar de uma lista comum de links, você monta seu próprio layout.",
      },
      {
        question: "O que tem no plano gratuito?",
        answer:
          "Cadastro com o Google, seu próprio endereço, edição em grade por blocos, resumo de analytics e upload de imagens fazem parte do plano gratuito.",
      },
      {
        question: "Posso conectar meu próprio domínio?",
        answer:
          "Por enquanto você está no ar no seu endereço dentro do caka.app. Conectar seu próprio domínio vem junto com o plano pago.",
      },
      {
        question: "Posso mudar meu endereço depois?",
        answer:
          "Pode. É em Configurações → Endereço; seu endereço antigo redireciona para o novo por 30 dias e fica bloqueado nesse período. Depois de uma troca, você precisa esperar 30 dias para trocar de novo.",
      },
      {
        question: "Posso exportar meu conteúdo ou excluir minha conta?",
        answer:
          "Por enquanto nenhuma das duas coisas é feita por você mesmo no painel. Para pedir uma cópia dos seus dados ou solicitar a exclusão da sua conta, escreva para hello@caka.app — é o seu direito pelo artigo 11 da lei turca de proteção de dados (KVKK).",
        link: {
          label: "Política de Privacidade",
          href: "/gizlilik",
          legalDocument: "gizlilik" as const,
        },
      },
    ],
  },
  closingCta: {
    title: "Abra hoje o seu\ncanto na internet",
    accent: "Grátis. Sem anúncios. Seu.",
    claim: {
      domain: "caka.app/",
      placeholder: "seunome",
      cta: "Comece grátis",
      action: "/onboarding",
    },
  },
  outro: {
    line: "A página que você abre hoje continua sua amanhã.",
    pills: ["Código aberto", "Em cinco idiomas", "caka.app"],
  },
  footer: {
    tagline: "Caka — uma página pessoal do seu jeito",
    columns: [
      {
        title: "Produto",
        links: [
          { label: "Como funciona", href: "/#urun" },
          { label: "Vitrine", href: "/#vitrin" },
          { label: "Dúvidas", href: "/#sss" },
        ],
      },
      {
        title: "Caka",
        links: [
          { label: "Comece grátis", href: "/onboarding" },
          { label: "Entrar", href: "/login" },
          { label: "Contato", href: "mailto:hello@caka.app" },
        ],
      },
      {
        title: "Jurídico",
        links: [
          { label: "Privacidade", href: "/gizlilik", legalDocument: "gizlilik" as const },
          {
            label: "Termos de Uso",
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
        label: "Sem cookies de publicidade ou analytics",
        href: "/cerez-politikasi",
        legalDocument: "cerez-politikasi" as const,
      },
      {
        label: "Código aberto",
        href: "https://github.com/abdullahcicekli/caka.app",
      },
    ],
    copyright: landingAssets.copyright,
  },
} satisfies LandingContent;
