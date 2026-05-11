import type { Metadata } from "next";

import { InstitutionalPage } from "@/features/institutional/institutional-page";

export const metadata: Metadata = {
  title: "Metodologia | Veli",
  description: "Entenda como a metodologia da Veli acelera o aprendizado.",
};

export default function MetodologiaPage() {
  return (
    <InstitutionalPage
      title="Conversação desde o primeiro encontro, com estrutura para sustentar evolução."
      description="A Veli combina prática orientada, rotina flexível e material exclusivo para reduzir bloqueios e manter consistência."
      sections={[
        {
          title: "Aprendizado ativo",
          body: "Menos exposição passiva e mais participação em cenários reais de fala, escuta, leitura e escrita.",
        },
        {
          title: "Feedback contínuo",
          body: "Após cada aula, o aluno recebe direcionamento sobre pronúncia, repertório, fluidez e próximos passos.",
        },
        {
          title: "Rotina conectada",
          body: "Aulas ao vivo, conteúdos gravados, exercícios e revisões ficam sincronizados entre desktop e mobile para manter o ritmo entre os encontros.",
        },
      ]}
      highlight={{
        title: "Pilares metodológicos",
        items: [
          "Turmas pequenas para maximizar tempo de fala.",
          "Professores especialistas por objetivo.",
          "Trilhas com progressão clara por competências.",
        ],
      }}
    />
  );
}
