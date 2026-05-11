import Link from "next/link";
import { ArrowRight, Clock3, MessageCircleMore, PencilLine } from "lucide-react";

export function PlacementTestPage() {
  return (
    <div className="page-shell py-14 md:py-20">
      <section className="grid gap-8 lg:grid-cols-[1fr_0.95fr]">
        <div className="rounded-[2rem] border border-border bg-white p-8 shadow-sm md:p-10">
          <h1 className="font-heading text-4xl font-semibold tracking-[-0.03em] text-foreground md:text-6xl">
            Descubra o ponto de partida ideal para sua jornada.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground md:text-lg">
            Nesta primeira versão, a página apresenta o fluxo e prepara a
            expansão para uma avaliação completa, com experiência mais
            personalizada ao longo do tempo.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/checkout"
              className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-7 text-base font-semibold text-primary-foreground transition hover:bg-[#0052cc]"
            >
              Continuar para matrícula
            </Link>
            <Link
              href="/metodologia"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-border px-7 text-base font-semibold text-foreground transition hover:bg-muted"
            >
              Entender a metodologia
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>

        <div className="rounded-[2rem] border border-border bg-[linear-gradient(180deg,#ffffff_0%,#f4f8fd_100%)] p-8 shadow-sm md:p-10">
          <div className="space-y-4">
            {[
              {
                icon: Clock3,
                title: "Em poucos minutos",
                description:
                  "Uma versão posterior poderá medir compreensão, vocabulário e fluidez sem tornar o processo cansativo.",
              },
              {
                icon: MessageCircleMore,
                title: "Mais aderência ao objetivo",
                description:
                  "O resultado ajuda a recomendar turma, trilha e intensidade mais adequadas ao seu contexto.",
              },
              {
                icon: PencilLine,
                title: "Estrutura pronta para evoluir",
                description:
                  "A base já foi organizada para ampliar a experiência com novas etapas, recomendações e resultados mais completos.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-[1.4rem] border border-border bg-white p-5"
              >
                <item.icon className="size-6 text-primary" />
                <h2 className="mt-4 font-heading text-2xl font-semibold tracking-[-0.03em] text-foreground">
                  {item.title}
                </h2>
                <p className="mt-3 text-base leading-7 text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
