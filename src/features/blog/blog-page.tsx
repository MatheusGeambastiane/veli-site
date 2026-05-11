import Link from "next/link";
import { ArrowRight } from "lucide-react";

const posts = [
  {
    category: "Rotina",
    title: "Como estudar idiomas com consistência mesmo em semanas cheias.",
    excerpt:
      "Uma rotina pequena, mas recorrente, tende a gerar mais fluidez do que picos de estudo esporádicos.",
  },
  {
    category: "Carreira",
    title: "Vocabulário que destrava reuniões, entrevistas e apresentações internacionais.",
    excerpt:
      "O ganho de segurança vem menos de decorar listas e mais de praticar repertório em contexto real.",
  },
  {
    category: "Método",
    title: "Por que a conversação precoce encurta o caminho até a confiança.",
    excerpt:
      "Falar cedo, com correção e apoio, reduz bloqueios e cria memória prática mais rápido.",
  },
];

export function BlogPage() {
  return (
    <div className="page-shell py-14 md:py-20">
      <section className="rounded-[2rem] border border-border bg-white p-8 shadow-sm md:p-10">
        <h1 className="font-heading text-4xl font-semibold tracking-[-0.03em] text-foreground md:text-6xl">
          Artigos para estudar melhor, evoluir mais rápido e aplicar idiomas no mundo real.
        </h1>
        <p className="mt-6 max-w-3xl text-base leading-8 text-muted-foreground md:text-lg">
          Esta base inicial do blog organiza conteúdos por rotina de estudo,
          carreira e metodologia, pronta para crescer com novos conteúdos e
          formatos ao longo do tempo.
        </p>
      </section>

      <section className="mt-8 grid gap-6 md:grid-cols-3">
        {posts.map((post) => (
          <article
            key={post.title}
            className="rounded-[1.6rem] border border-border bg-white p-7 shadow-sm"
          >
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              {post.category}
            </span>
            <h2 className="mt-4 font-heading text-2xl font-semibold tracking-[-0.03em] text-foreground">
              {post.title}
            </h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              {post.excerpt}
            </p>
            <Link
              href="/checkout"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
            >
              Conhecer a Veli
              <ArrowRight className="size-4" />
            </Link>
          </article>
        ))}
      </section>
    </div>
  );
}
