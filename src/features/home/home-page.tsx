import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  BookOpenCheck,
  BriefcaseBusiness,
  CalendarClock,
  ChartNoAxesColumnIncreasing,
  CheckCircle2,
  Headphones,
  Info,
  Languages,
  MessagesSquare,
  Mic,
  MonitorPlay,
  Play,
  Video,
} from "lucide-react";

import {
  benefitCards,
  featuredCourses,
  testimonialStories,
} from "@/features/home/data";

const benefitIcons = {
  Award,
  BookOpenCheck,
  CalendarClock,
  ChartNoAxesColumnIncreasing,
  MessagesSquare,
  MonitorPlay,
};

export function HomePage() {
  return (
    <>
      <section className="hero-shell relative overflow-hidden pb-8 pt-14 md:pb-12 md:pt-24">
        <div className="absolute inset-x-0 top-12 -z-10 mx-auto h-72 max-w-5xl rounded-full bg-primary/10 blur-3xl" />
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <h1 className="section-title mx-auto max-w-4xl text-5xl md:text-6xl">
              Domine um novo idioma sem sair de casa com a Veli.
            </h1>
            <p className="section-subtitle mx-auto mt-6 max-w-2xl">
              Aprenda inglês e francês com professores nativos, horários
              flexíveis e metodologia focada em conversação desde o primeiro dia.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/checkout"
                className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-7 text-base font-semibold text-primary-foreground transition hover:bg-[#0052cc]"
              >
                Matricular-se agora
              </Link>
              <Link
                href="/teste-de-nivel"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-border bg-white px-7 text-base font-semibold text-foreground transition hover:bg-muted"
              >
                Fazer teste de nível
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
          <div className="relative mx-auto mt-14 w-full max-w-4xl md:mt-16">
            <div className="relative overflow-hidden rounded-[2rem] border border-border bg-[linear-gradient(140deg,#ecf5ff_0%,#ffffff_55%,#eef5fb_100%)] p-5 shadow-[0_40px_120px_-60px_rgba(0,100,224,0.45)] md:p-8">
              <div className="absolute -right-10 top-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
              <div className="grid gap-4 md:grid-cols-[0.85fr_1fr]">
                <div className="space-y-4">
                  <div className="rounded-[1.4rem] border border-border bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex size-12 items-center justify-center rounded-full bg-primary text-white">
                        <Languages className="size-6" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                          Turma em andamento
                        </p>
                        <p className="font-heading text-xl font-semibold">
                          Inglês Intermediário
                        </p>
                      </div>
                    </div>
                    <div className="mt-5 space-y-3">
                      <div className="h-3 rounded-full bg-muted" />
                      <div className="h-3 w-4/5 rounded-full bg-muted" />
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-sm text-muted-foreground">
                          Prof. Sarah
                        </span>
                        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                          Ao vivo
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-[1.4rem] border border-border bg-white p-5 shadow-sm">
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <BriefcaseBusiness className="size-5" />
                      </div>
                      <div>
                        <p className="font-semibold">Business Presentation</p>
                        <p className="text-sm text-muted-foreground">
                          Módulo 4 concluído
                        </p>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div className="h-2 w-3/4 rounded-full bg-primary" />
                    </div>
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-[1.6rem] border border-border bg-[#0f1824] shadow-xl">
                  <Image
                    src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80"
                    alt="Alunos em aula online"
                    fill
                    sizes="(max-width: 768px) 100vw, 40vw"
                    className="h-full w-full object-cover opacity-85"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f1824] via-[#0f1824]/10 to-transparent" />
                  <div className="absolute inset-x-5 bottom-5 rounded-[1.4rem] border border-white/15 bg-white/88 p-4 backdrop-blur-md">
                    <div className="flex items-center gap-4">
                      <div className="flex size-14 items-center justify-center rounded-full bg-primary text-white">
                        <Video className="size-6" />
                      </div>
                      <div>
                        <p className="font-heading text-2xl font-semibold">
                          Aula ao vivo iniciando
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Conversação com foco em situações reais.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="page-shell py-16 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="section-title text-balance text-4xl md:text-5xl">
            Descubra por que a Veli acelera o seu aprendizado.
          </h2>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {benefitCards.map((card) => {
            const Icon = benefitIcons[card.icon as keyof typeof benefitIcons];
            return (
              <article
                key={card.title}
                className="group rounded-[1.6rem] border border-border bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_30px_90px_-60px_rgba(17,17,18,0.8)]"
              >
                <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-secondary text-foreground">
                  <Icon className="size-7" />
                </div>
                <h3 className="font-heading text-2xl font-semibold tracking-[-0.03em]">
                  {card.title}
                </h3>
                <p className="mt-3 text-base leading-7 text-muted-foreground">
                  {card.description}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="bg-muted py-16 md:py-24">
        <div className="page-shell grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-14">
          <div>
            <h2 className="section-title max-w-xl text-4xl md:text-5xl">
              Conheça os cursos ideais para o seu objetivo.
            </h2>
            <div className="mt-8 rounded-[1.8rem] border border-border bg-white p-6 shadow-sm">
              {featuredCourses.map((course, index) => (
                <div
                  key={course.id}
                  className={`py-5 ${index !== featuredCourses.length - 1 ? "border-b border-border" : ""}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="mb-2 inline-flex rounded-full bg-primary/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                        {course.badge}
                      </span>
                      <h3 className="font-heading text-2xl font-semibold">
                        {course.title}
                      </h3>
                    </div>
                    <ArrowRight className="mt-2 size-5 text-primary" />
                  </div>
                  <p className="mt-3 max-w-xl text-base leading-7 text-muted-foreground">
                    {course.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[2rem] border border-border bg-white shadow-sm">
            <Image
              src="https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=1400&q=80"
              alt="Aluna em curso de inglês para negócios"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#111112]/55 via-transparent to-transparent" />
            <div className="absolute bottom-5 left-5 right-5 rounded-[1.5rem] border border-white/20 bg-white/90 p-4 shadow-lg backdrop-blur-md sm:p-5">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <BriefcaseBusiness className="size-5" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">Business Presentation</p>
                  <p className="text-sm text-muted-foreground">
                    Módulo 4 concluído com feedback individual.
                  </p>
                </div>
                <CheckCircle2 className="size-6 text-[#147b29]" />
              </div>
              <Link
                href="/cursos"
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
              >
                Ver catálogo completo
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="page-shell py-16 md:py-24">
        <div className="max-w-3xl">
          <h2 className="section-title text-4xl md:text-5xl">
            Inspire-se lendo como nossos alunos alcançaram seus objetivos com a Veli.
          </h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {testimonialStories.map((story) => (
            <article key={story.title} className="group">
              <div className="relative aspect-[3/4] overflow-hidden rounded-[1.7rem]">
                <Image
                  src={story.image}
                  alt={story.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100">
                  <div className="flex size-16 items-center justify-center rounded-full bg-white/25 text-white backdrop-blur-md">
                    <Play className="ml-1 size-7 fill-white" />
                  </div>
                </div>
                <div className="absolute inset-x-6 bottom-6">
                  <span className="mb-3 inline-flex rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white backdrop-blur">
                    {story.category}
                  </span>
                  <h3 className="text-2xl font-semibold tracking-[-0.03em] text-white">
                    {story.title}
                  </h3>
                </div>
              </div>
              <p className="mt-5 text-lg font-semibold text-foreground group-hover:underline">
                Assista à história completa
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="page-shell py-16 md:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_0.9fr] lg:gap-16">
          <div>
            <h2 className="section-title max-w-xl text-4xl md:text-5xl">
              Aprenda de forma rápida e eficiente com nosso app.
            </h2>
            <p className="section-subtitle mt-6 max-w-2xl">
              Nossa plataforma permite praticar gramática, vocabulário e escuta
              de onde estiver, com progresso sincronizado entre celular e computador.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/checkout"
                className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-7 text-base font-semibold text-primary-foreground transition hover:bg-[#0052cc]"
              >
                Matricular-se agora
              </Link>
              <Link
                href="/teste-de-nivel"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-border bg-white px-7 text-base font-semibold text-foreground transition hover:bg-muted"
              >
                Fazer teste de nível
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>

          <div className="relative mx-auto flex w-full justify-center">
            <div className="absolute -bottom-8 h-52 w-52 rounded-full bg-primary/10 blur-3xl" />
            <div className="relative w-[300px] overflow-hidden rounded-[3rem] border-[8px] border-[#111112] bg-white shadow-[0_50px_120px_-60px_rgba(17,17,18,0.7)]">
              <div className="bg-muted px-6 pb-8 pt-12">
                <div className="rounded-[1.5rem] bg-accent p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                    Módulo 2
                  </p>
                  <p className="mt-2 font-heading text-3xl font-semibold">
                    Rotina diária
                  </p>
                </div>
                <div className="mt-6 flex gap-4">
                  <div className="flex size-12 items-center justify-center rounded-full bg-white shadow-sm">
                    <Mic className="size-5" />
                  </div>
                  <div className="flex size-12 items-center justify-center rounded-full bg-primary text-white shadow-sm">
                    <Headphones className="size-5" />
                  </div>
                </div>
                <div className="mt-6 space-y-3">
                  {[
                    { done: true, width: "w-1/2" },
                    { done: false, width: "w-2/3" },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="flex h-16 items-center gap-4 rounded-2xl bg-white px-4 shadow-sm"
                    >
                      <div
                        className={`flex size-8 items-center justify-center rounded-full ${item.done ? "bg-green-100 text-[#147b29]" : "bg-muted text-muted-foreground"}`}
                      >
                        {item.done ? <CheckCircle2 className="size-4" /> : <Info className="size-4" />}
                      </div>
                      <div className={`h-2 rounded-full bg-muted ${item.width}`} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-muted py-16 md:py-24">
        <div className="page-shell">
          <div className="grid overflow-hidden rounded-[2rem] border border-border bg-white shadow-sm lg:grid-cols-2">
            <div className="relative min-h-[320px]">
              <Image
                src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=80"
                alt="Consultora de suporte da Veli"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
            <div className="p-8 sm:p-12 lg:p-16">
              <h2 className="section-title text-4xl md:text-5xl">
                Ficou com alguma dúvida? Nós estamos aqui para ajudar.
              </h2>
              <p className="section-subtitle mt-6">
                Acesse nossa central de ajuda para conferir respostas às perguntas
                frequentes sobre metodologia, pagamentos, agendamento de aulas e muito mais.
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/suporte"
                  className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-7 text-base font-semibold text-primary-foreground transition hover:bg-[#0052cc]"
                >
                  Falar com um consultor
                </Link>
                <Link
                  href="/blog"
                  className="inline-flex h-12 items-center justify-center rounded-full border border-border px-7 text-base font-semibold text-foreground transition hover:bg-muted"
                >
                  Ler conteúdos
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="page-shell py-16 text-center md:py-24">
        <h2 className="section-title mx-auto max-w-3xl text-4xl md:text-5xl">
          Sua jornada bilíngue pode começar hoje, no ritmo certo para você.
        </h2>
        <p className="section-subtitle mx-auto mt-5 max-w-2xl">
          Escolha o idioma, informe a melhor faixa de horário e avance para o
          início da sua matrícula online.
        </p>
        <Link
          href="/checkout"
          className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-primary px-8 text-base font-semibold text-primary-foreground transition hover:bg-[#0052cc]"
        >
          Matricular-se agora
        </Link>
      </section>
    </>
  );
}
