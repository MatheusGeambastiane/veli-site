import type { Metadata } from "next";

import { InstitutionalPage } from "@/features/institutional/institutional-page";

export const metadata: Metadata = {
  title: "Cursos | Veli",
  description: "Conheça os cursos online da Veli para diferentes objetivos.",
};

export default function CursosPage() {
  return (
    <InstitutionalPage
      title="Cursos pensados para carreira, viagens e fluência real."
      description="A Veli organiza trilhas por objetivo e por nível, com aulas ao vivo e gravadas, materiais interativos e acompanhamento contínuo."
      sections={[
        {
          title: "Idiomas disponíveis",
          body: "Inglês e francês com jornadas que combinam aulas ao vivo e gravadas, reforço assíncrono e prática de conversação.",
        },
        {
          title: "Formatos de turma",
          body: "Turmas reduzidas, aulas particulares e grupos corporativos com horários flexíveis e calendário adaptável.",
        },
        {
          title: "Resultados mensuráveis",
          body: "Cada trilha possui marcos de progresso, avaliações periódicas e certificados por nível para uso profissional.",
        },
      ]}
      highlight={{
        title: "Mais procurados",
        items: [
          "Inglês para negócios com foco em reuniões e apresentações.",
          "Francês para conversação com foco em fluidez e segurança.",
          "Preparatório TOEFL e IELTS com simulados guiados.",
        ],
      }}
    />
  );
}
