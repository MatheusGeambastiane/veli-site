import type { Course, LanguageOption, ScheduleOption } from "@/shared/types";

export const navigationLinks = [
  { href: "/cursos", label: "Cursos" },
  { href: "/metodologia", label: "Metodologia" },
  { href: "/para-empresas", label: "Para Empresas" },
  { href: "/suporte", label: "Suporte" },
];

export const languageOptions: LanguageOption[] = [
  { value: "ingles", label: "Inglês" },
  { value: "frances", label: "Francês" },
];

export const scheduleOptions: ScheduleOption[] = [
  {
    value: "manha",
    label: "Manhã (07h às 12h)",
    description: "Ideal para começar o dia com prática guiada.",
    icon: "sunrise",
  },
  {
    value: "tarde",
    label: "Tarde (13h às 18h)",
    description: "Rotina equilibrada para quem distribui os estudos ao longo do dia.",
    icon: "sun",
  },
  {
    value: "noite",
    label: "Noite (19h às 23h)",
    description: "A opção mais flexível para quem trabalha em horário comercial.",
    icon: "moon",
  },
];

export const featuredCourses: Course[] = [
  {
    id: "business-english",
    title: "Inglês para Negócios",
    description:
      "Vocabulário corporativo para reuniões, apresentações e negociações internacionais.",
    badge: "Carreira",
  },
  {
    id: "french-conversation",
    title: "Francês para Conversação",
    description:
      "Desenvolva escuta, pronúncia e vocabulário funcional para estudar, trabalhar e se comunicar com confiança.",
    badge: "Fluência",
  },
  {
    id: "general-english",
    title: "Inglês Geral",
    description:
      "Trilha completa para todos os níveis com foco em consistência e fluidez.",
    badge: "Fluência",
  },
  {
    id: "toefl-ielts",
    title: "Preparatório TOEFL/IELTS",
    description:
      "Simulados, estratégia e prática intensiva para provas internacionais.",
    badge: "Certificação",
  },
];

export const benefitCards = [
  {
    title: "Aulas ao vivo e gravadas",
    description:
      "Combine encontros em tempo real com conteúdos gravados para estudar no seu ritmo sem perder acompanhamento.",
    icon: "MonitorPlay",
  },
  {
    title: "Flexibilidade total",
    description:
      "Monte a rotina de acordo com sua agenda, com disponibilidade distribuída ao longo da semana.",
    icon: "CalendarClock",
  },
  {
    title: "Certificação reconhecida",
    description:
      "Comprove evolução por etapas, com certificados que apoiam sua trajetória profissional.",
    icon: "Award",
  },
  {
    title: "Material didático exclusivo",
    description:
      "Exercícios, vídeos e áudios pensados para acelerar retenção e aplicação prática.",
    icon: "BookOpenCheck",
  },
  {
    title: "Acompanhamento contínuo",
    description:
      "Feedback claro para saber o que ajustar, praticar e consolidar entre as aulas.",
    icon: "ChartNoAxesColumnIncreasing",
  },
  {
    title: "Foco em conversação",
    description:
      "Menos bloqueio para falar e mais repertório útil desde o primeiro encontro.",
    icon: "MessagesSquare",
  },
];

export const testimonialStories = [
  {
    category: "Carreira",
    title: "João foi promovido após atingir a fluência em 8 meses.",
    image:
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=900&q=80",
  },
  {
    category: "Intercâmbio",
    title: "O plano de Maria para estudar fora saiu do papel com uma rotina sustentável.",
    image:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80",
  },
  {
    category: "Viagens",
    title: "Pedro transformou a experiência de viajar sozinho pela América Latina.",
    image:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=900&q=80",
  },
];
