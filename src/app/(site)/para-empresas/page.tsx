import type { Metadata } from "next";

import { InstitutionalPage } from "@/features/institutional/institutional-page";

export const metadata: Metadata = {
  title: "Para Empresas | Veli",
  description: "Programas de idiomas para equipes e lideranças.",
};

export default function EmpresasPage() {
  return (
    <InstitutionalPage
      title="Capacitação em idiomas para times que operam em contexto global."
      description="Programas corporativos com trilhas por área, relatórios de evolução e operação adaptável ao calendário da empresa."
      sections={[
        {
          title: "Trilhas por função",
          body: "Módulos voltados para vendas, atendimento, tecnologia, liderança e operações internacionais.",
        },
        {
          title: "Gestão e indicadores",
          body: "Acompanhamento de presença, evolução e engajamento com visibilidade para RH e líderes de área.",
        },
        {
          title: "Escala com flexibilidade",
          body: "Implementação em diferentes fusos, com turmas por squads, senioridade ou área de negócio.",
        },
      ]}
      highlight={{
        title: "Cenários cobertos",
        items: [
          "Treinamento de onboarding internacional.",
          "Desenvolvimento de lideranças e porta-vozes.",
          "Aceleração de equipes com contato direto com clientes globais.",
        ],
      }}
    />
  );
}
