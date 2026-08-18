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
  },
  hero: {
    title: "Um link na bio\ndo seu jeito.",
    body: "Um único link para o seu Instagram, TikTok, YouTube e todos os outros perfis — reunindo tudo o que você compartilha, cria e vende.",
    claim: {
      domain: "caka.app/",
      placeholder: "seunome",
      cta: "Comece grátis",
      action: "/onboarding",
    },
    marquee: landingAssets.marquee,
  },
  minutes: {
    title: "Monte sua página no Caka\nem minutos",
    body: "Reúna suas redes sociais, seus sites, seus projetos e sua loja em um só link. Ajuste cada detalhe do seu jeito ou comece com um tema pronto.",
    cta: { label: "Comece grátis", href: "/onboarding" },
  },
  share: {
    title: "Compartilhe seu Caka\nonde você quiser",
    body: "Coloque seu endereço nos seus perfis, nos seus vídeos e no seu cartão de visita. Traga também o tráfego offline para sua página com o QR code.",
    cta: { label: "Comece grátis", href: "/onboarding" },
    image: landingAssets.shareImage,
  },
  audience: {
    title: "Conheça seu público,\nmantenha o interesse",
    body: "Veja em qual link clicam, de onde vêm seus visitantes e o que realmente funciona. Atualize sua página com base nisso.",
    cta: { label: "Comece grátis", href: "/onboarding" },
  },
  faq: {
    title: "Dúvidas? Respondidas",
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
    claim: {
      domain: "caka.app/",
      placeholder: "seunome",
      cta: "Comece grátis",
      action: "/onboarding",
    },
  },
  footer: {
    columns: [
      {
        title: "Caka",
        links: [
          { label: "Como funciona", href: "/#urun" },
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
