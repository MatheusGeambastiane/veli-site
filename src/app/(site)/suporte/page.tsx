import type { Metadata } from "next";

import { InstitutionalPage } from "@/features/institutional/institutional-page";

export const metadata: Metadata = {
  title: "Suporte | Veli",
  description: "Central de ajuda e canais de suporte da Veli.",
};

export default function SuportePage() {
  return (
    <InstitutionalPage
      title="Respostas rápidas para matrícula, agendamento, pagamentos e uso da plataforma."
      description="A Veli organiza o suporte para que o aluno resolva dúvidas operacionais sem atrito e mantenha o foco nas aulas."
      sections={[
        {
          title: "Atendimento humano",
          body: "Consultores acompanham dúvidas de contratação, remarcações e orientações sobre o plano mais adequado.",
        },
        {
          title: "Base de conhecimento",
          body: "FAQ com explicações sobre metodologia, certificados, cobrança, frequência e acesso à plataforma.",
        },
        {
          title: "Suporte ao aluno",
          body: "Canais prontos para tratar questões de login, agenda, professor, turma e ajustes na rotina.",
        },
      ]}
      highlight={{
        title: "Canais disponíveis",
        items: [
          "WhatsApp e e-mail para pré-venda e onboarding.",
          "Fluxo de suporte para alunos ativos.",
          "Orientação sobre pagamentos e reagendamentos.",
        ],
      }}
    />
  );
}
