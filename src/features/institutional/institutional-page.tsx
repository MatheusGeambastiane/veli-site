import Link from "next/link";
import { ArrowRight } from "lucide-react";

type InstitutionalPageProps = {
  title: string;
  description: string;
  sections: Array<{
    title: string;
    body: string;
  }>;
  highlight: {
    title: string;
    items: string[];
  };
};

export function InstitutionalPage({
  title,
  description,
  sections,
  highlight,
}: InstitutionalPageProps) {
  return (
    <div className="page-shell py-14 md:py-20">
      <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-[2rem] border border-border bg-white p-8 shadow-sm md:p-10">
          <h1 className="font-heading text-4xl font-semibold tracking-[-0.03em] text-foreground md:text-6xl">
            {title}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground md:text-lg">
            {description}
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/checkout"
              className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-7 text-base font-semibold text-primary-foreground transition hover:bg-[#0052cc]"
            >
              Iniciar matrícula
            </Link>
            <Link
              href="/teste-de-nivel"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-border px-7 text-base font-semibold text-foreground transition hover:bg-muted"
            >
              Fazer teste de nível
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>

        <section className="rounded-[2rem] border border-border bg-[linear-gradient(180deg,#ffffff_0%,#f4f8fd_100%)] p-8 shadow-sm md:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
            {highlight.title}
          </p>
          <div className="mt-6 space-y-4">
            {highlight.items.map((item) => (
              <div
                key={item}
                className="rounded-[1.4rem] border border-border bg-white px-5 py-4 text-base leading-7 text-muted-foreground"
              >
                {item}
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-8 grid gap-6 md:grid-cols-3">
        {sections.map((section) => (
          <article
            key={section.title}
            className="rounded-[1.6rem] border border-border bg-white p-7 shadow-sm"
          >
            <h2 className="font-heading text-2xl font-semibold tracking-[-0.03em] text-foreground">
              {section.title}
            </h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              {section.body}
            </p>
          </article>
        ))}
      </section>
    </div>
  );
}
