"use client";

import Link from "next/link";
import journey from "@/shared/styles/veli-journey.module.css";
import { veliFontClassName } from "@/shared/ui/veli-fonts";
import Image from "next/image";
import { AsYouType, parsePhoneNumberFromString } from "libphonenumber-js/min";
import { phoneCountries, type PhoneCountry } from "./phone-countries";
import { Select } from "@base-ui/react/select";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Languages,
  Loader2,
  Mail,
  Phone,
  Plane,
  RotateCcw,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QuestionAudio } from "./question-audio";
import { placementTestService } from "@/features/placement-test/placement-test-service";
import type {
  PlacementLanguage,
  PlacementProgress,
  PlacementQuestion,
  PlacementResult,
} from "@/features/placement-test/types";
import {
  getAnalyticsSessionId,
  getAnalyticsUtmSource,
  trackAnalyticsEvent,
} from "@/shared/analytics/analytics";

type Phase = "welcome" | "language" | "contact" | "question" | "result";
const savedLeadKey = "veli.placement-test.lead.v1";
const defaultQuestionTotal = 14;


const levelContent: Record<string, { title: string; description: string; next: string }> = {
  A1: {
    title: "Primeiros passos",
    description: "Você já reconhece expressões familiares e consegue lidar com interações bem simples.",
    next: "Construa vocabulário essencial e confiança para situações cotidianas.",
  },
  A2: {
    title: "Básico em movimento",
    description: "Você compreende frases frequentes e se comunica em tarefas diretas do dia a dia.",
    next: "Ganhe repertório para sustentar conversas e narrar experiências.",
  },
  B1: {
    title: "Independência",
    description: "Você entende os pontos principais de temas familiares e consegue se virar em diferentes situações.",
    next: "Trabalhe fluidez, precisão e argumentos mais completos.",
  },
  B2: {
    title: "Comunicação confiante",
    description: "Você interage com boa espontaneidade e compreende textos e conversas mais complexos.",
    next: "Refine nuances, vocabulário profissional e naturalidade.",
  },
  C1: {
    title: "Domínio avançado",
    description: "Você usa o idioma com flexibilidade em contextos sociais, acadêmicos e profissionais.",
    next: "Aprimore estilo, sutileza e precisão em situações exigentes.",
  },
  C2: {
    title: "Proficiência plena",
    description: "Você compreende praticamente tudo e se expressa com grande precisão e naturalidade.",
    next: "Mantenha a exposição e lapide repertórios especializados.",
  },
};

function PhoneCountrySelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const phoneCountry = phoneCountries.find((country) => country.code === value) ?? phoneCountries[0];
  return (
                      <Select.Root value={value} onValueChange={(next) => { if (next && next !== value) onChange(next); }}>
                        <Select.Trigger aria-label={`País do telefone: ${phoneCountry.name}, +${phoneCountry.dialCode}`} className="flex h-13 w-full items-center gap-2 rounded-xl border border-input bg-background px-3 text-sm font-medium outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20">
                          <Image src={`/flags/${phoneCountry.code.toLowerCase()}.svg`} alt="" width={24} height={18} className="shrink-0 rounded-sm" />
                          <Select.Value>+{phoneCountry.dialCode}</Select.Value>
                          <Select.Icon className="ml-auto text-xs text-muted-foreground">▾</Select.Icon>
                        </Select.Trigger>
                        <Select.Portal>
                          <Select.Positioner sideOffset={6} align="start" alignItemWithTrigger={false} className="z-50">
                            <Select.Popup className={`${journey.theme} ${veliFontClassName} w-72 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-input bg-background p-1 shadow-lg`}>
                              <Select.List className="max-h-72 overflow-y-auto overscroll-contain">
                                {phoneCountries.map((country) => (
                                  <Select.Item key={country.code} value={country.code} className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm outline-none data-highlighted:bg-primary/10 data-highlighted:text-primary">
                                    <Image src={`/flags/${country.code.toLowerCase()}.svg`} alt="" width={24} height={18} className="shrink-0 rounded-sm" />
                                    <Select.ItemText className="flex flex-1 items-center justify-between gap-3"><span>{country.name}</span><span className="tabular-nums text-muted-foreground">+{country.dialCode}</span></Select.ItemText>
                                    <Select.ItemIndicator><Check className="size-4 text-primary" /></Select.ItemIndicator>
                                  </Select.Item>
                                ))}
                              </Select.List>
                            </Select.Popup>
                          </Select.Positioner>
                        </Select.Portal>
                      </Select.Root>
  );
}

function formatPhone(value: string, country: PhoneCountry) {
  return new AsYouType(country.code).input(value.slice(0, 40));
}

function internationalPhone(value: string, country: PhoneCountry) {
  return parsePhoneNumberFromString(value, country.code)?.number ?? "";
}

function getErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "details" in error) {
    const details = (error as { details?: unknown }).details;
    if (details && typeof details === "object") {
      const first = Object.values(details as Record<string, unknown>)[0];
      if (typeof first === "string") return first;
      if (Array.isArray(first) && typeof first[0] === "string") return first[0];
    }
  }
  return "Não foi possível continuar agora. Tente novamente.";
}

export function PlacementTestPage() {
  const [phase, setPhase] = useState<Phase>("welcome");
  const [languages, setLanguages] = useState<PlacementLanguage[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<PlacementLanguage | null>(null);
  const [audioPlayedFor, setAudioPlayedFor] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneCountryCode, setPhoneCountryCode] = useState("BR");
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [question, setQuestion] = useState<PlacementQuestion | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [progress, setProgress] = useState<PlacementProgress>({ answered: 0, total: defaultQuestionTotal });
  const [result, setResult] = useState<PlacementResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const questionStartedAt = useRef<number | null>(null);
  const completedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    async function initialize() {
      try {
        const availableLanguages = await placementTestService.languages();
        if (cancelled) return;
        setLanguages(availableLanguages);
        const savedLead = window.localStorage.getItem(savedLeadKey);
        if (savedLead) {
          try {
            const resumed = await placementTestService.resume(savedLead);
            if (cancelled) return;
            setLeadId(savedLead);
            if (resumed.completed && resumed.result) {
              completedRef.current = true;
              setResult(resumed.result);
              setPhase("result");
            } else if (resumed.question && resumed.progress) {
              setQuestion(resumed.question);
              setProgress(resumed.progress);
              questionStartedAt.current = Date.now();
              setPhase("question");
            }
          } catch {
            window.localStorage.removeItem(savedLeadKey);
          }
        }
      } catch {
        if (!cancelled) {
          setError("Não conseguimos carregar o teste agora. Atualize a página para tentar novamente.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void initialize();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const handleAbandon = () => {
      if (leadId && !completedRef.current) {
        trackAnalyticsEvent(
          {
            event_type: "placement_test_abandoned",
            metadata: { lead_id: leadId, answered: progress.answered, phase },
          },
          true,
        );
      }
    };
    window.addEventListener("pagehide", handleAbandon);
    return () => window.removeEventListener("pagehide", handleAbandon);
  }, [leadId, phase, progress.answered]);

  const progressPercent =
    phase === "question"
      ? Math.max(8, (progress.answered / progress.total) * 100)
      : phase === "result"
        ? 100
        : phase === "contact"
          ? 6
          : phase === "language"
            ? 3
            : 0;
  const phoneCountry = phoneCountries.find((country) => country.code === phoneCountryCode) ?? phoneCountries[0];
  const parsedPhone = parsePhoneNumberFromString(phone, phoneCountry.code);
  const canSubmitContact =
    name.trim().length >= 2 &&
    parsedPhone?.isPossible() === true &&
    parsedPhone.countryCallingCode === phoneCountry.dialCode &&
    marketingConsent;
  const selectedLanguageName = selectedLanguage?.name ?? "seu idioma";
  const resultCopy = result ? levelContent[result.level] : null;
  const skillLabel = useMemo(
    () =>
      ({ grammar: "Estrutura", vocabulary: "Vocabulário", reading: "Compreensão", listening: "Compreensão auditiva" })[
        question?.skill ?? "grammar"
      ],
    [question?.skill],
  );

  function startTest() {
    setPhase("language");
    trackAnalyticsEvent({ event_type: "placement_test_started" });
  }

  async function submitContact(event: FormEvent) {
    event.preventDefault();
    if (!selectedLanguage || !canSubmitContact) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await placementTestService.start({
        name: name.trim(),
        email: email.trim(),
        phone: internationalPhone(phone, phoneCountry),
        language_id: selectedLanguage.id,
        analytics_session_id: getAnalyticsSessionId(),
        utm_source: getAnalyticsUtmSource(),
        referrer: document.referrer,
        marketing_consent: marketingConsent,
      });
      setLeadId(response.lead_id);
      window.localStorage.setItem(savedLeadKey, response.lead_id);
      setQuestion(response.question);
      setProgress(response.progress);
      setSelectedOption(null);
      questionStartedAt.current = Date.now();
      setPhase("question");
      trackAnalyticsEvent({
        event_type: "placement_lead_captured",
        metadata: {
          lead_id: response.lead_id,
          language_id: selectedLanguage.id,
          language: selectedLanguage.name,
          phone_country: phoneCountry.code,
        },
      });
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  }

  async function submitAnswer() {
    if (!leadId || !question || !selectedOption || (question.skill === "listening" && audioPlayedFor !== question.id)) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await placementTestService.answer(leadId, {
        question_id: question.id,
        option_id: selectedOption,
        response_ms: questionStartedAt.current ? Date.now() - questionStartedAt.current : 0,
      });
      trackAnalyticsEvent({
        event_type: "placement_question_answered",
        metadata: {
          lead_id: leadId,
          question_id: question.id,
          answer_number: response.progress.answered,
        },
      });
      setProgress(response.progress);
      setSelectedOption(null);
      if (response.completed && response.result) {
        completedRef.current = true;
        window.localStorage.removeItem(savedLeadKey);
        setResult(response.result);
        setPhase("result");
        trackAnalyticsEvent({
          event_type: "placement_test_completed",
          metadata: {
            lead_id: leadId,
            level: response.result.level,
            language: selectedLanguageName,
          },
        });
      } else if (response.question) {
        setQuestion(response.question);
        questionStartedAt.current = Date.now();
      }
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  }

  function resetTest() {
    window.localStorage.removeItem(savedLeadKey);
    completedRef.current = false;
    setLeadId(null);
    setQuestion(null);
    setResult(null);
    setSelectedOption(null);
    setProgress({ answered: 0, total: defaultQuestionTotal });
    setPhase("language");
  }

  if (loading) {
    return (
      <div role="status" className="flex min-h-[72vh] items-center justify-center gap-3">
        <span className="text-sm text-muted-foreground">Preparando seu teste…</span>
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className={`${journey.placement} relative min-h-[calc(100dvh-5rem)] text-foreground`} data-phase={phase}>
      <div className={journey.progress} role="progressbar" aria-label="Progresso do teste" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progressPercent)}>
        <span style={{ width: `${progressPercent}%` }}><Plane size={20} aria-hidden="true" /></span>
      </div>

      <div className="relative mx-auto flex min-h-[calc(100dvh-12rem)] w-full max-w-6xl flex-col px-4 py-7 sm:px-6 sm:py-10">
        <section className="my-auto w-full py-6">
          {error && (phase === "welcome" || phase === "language") ? (
            <div role="alert" className="mb-6 rounded-xl border border-destructive/20 bg-white p-4 text-sm text-destructive">
              <p>{error}</p>
              <Button variant="outline" className="mt-3 h-11" onClick={() => window.location.reload()}>Tentar novamente</Button>
            </div>
          ) : null}
          {phase === "welcome" ? (
            <div className={`${journey.testWelcome} grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16`}>
              <div className={journey.testWelcomeCopy}>
                <span className="inline-flex rounded-full border border-primary/15 bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary">Inglês e francês</span>
                <h1 className="mt-6 font-heading text-5xl font-semibold leading-[1.06] tracking-[-0.04em] sm:text-6xl">Seu próximo passo começa pelo <span className={journey.script}>seu nível.</span></h1>
                <p className="mt-6 max-w-md text-base leading-7 text-muted-foreground sm:text-lg">Descubra onde você está e encontre a turma certa para avançar.</p>
                <Button onClick={startTest} className="mt-8 h-13 rounded-full px-8 text-base shadow-lg shadow-primary/15">Descobrir meu nível <ArrowRight className="size-4" /></Button>
                <p className="mt-5 text-xs font-medium text-muted-foreground">14 perguntas · Resultado ao final</p>
              </div>

              <div className={`${journey.quizPreview} relative mx-auto w-full max-w-lg px-2 py-5 sm:px-5`} role="img" aria-label="Ilustração de um quiz de inglês, com uma pergunta e três alternativas; would learn está selecionada.">
                <div aria-hidden="true" className="absolute inset-0 rotate-3 rounded-[2.5rem] border border-primary/10 bg-accent" />
                <div aria-hidden="true" className="relative overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-[0_24px_60px_-24px_rgba(0,100,224,0.22)]">
                  <div className="flex items-center justify-between border-b border-border/70 px-5 py-4 sm:px-7">
                    <span className="flex items-center gap-2 text-xs font-semibold text-primary"><Languages className="size-4" /> Inglês</span>
                    <span className="rounded-full bg-primary/5 px-2.5 py-1 text-xs font-medium text-muted-foreground">Quiz</span>
                  </div>
                  <div className="p-5 sm:p-7">
                    <div className="mb-7 flex gap-1.5">{[0, 1, 2, 3, 4, 5].map((step) => <span key={step} className={`h-1 flex-1 rounded-full ${step < 3 ? "bg-primary" : "bg-primary/10"}`} />)}</div>
                    <p className="font-heading text-2xl font-semibold leading-snug tracking-tight sm:text-3xl">If I had more time,<br />I ___ another language.</p>
                    <div className="mt-6 space-y-2.5">
                      {["learn", "would learn", "will learn"].map((answer, index) => (
                        <div key={answer} className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 text-sm ${index === 1 ? "border-primary bg-primary/5 text-primary" : "border-border bg-background/50 text-muted-foreground"}`}>
                          <span className={`flex size-7 shrink-0 items-center justify-center rounded-md text-xs font-semibold ${index === 1 ? "bg-primary text-primary-foreground" : "border border-border bg-card"}`}>{String.fromCharCode(65 + index)}</span>
                          <span className="font-medium">{answer}</span>
                          {index === 1 ? <Check className="ml-auto size-4" /> : null}
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 flex items-center justify-end gap-2 text-xs font-semibold text-primary">Continuar <ArrowRight className="size-4" /></div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {phase === "language" ? (
            <div className={`${journey.testPanel} mx-auto max-w-2xl`}>
              <button onClick={() => setPhase("welcome")} className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Voltar</button>
              <h1 className="font-heading text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">Escolha o idioma.</h1>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {languages.map((language) => (
                  <button key={language.id} onClick={() => { setSelectedLanguage(language); setPhase("contact"); }} className={`${journey.languageChoice} group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`}>
                    <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary/10 text-primary">
                      {language.icon ? (
                        <Image src={language.icon} alt="" width={48} height={48} unoptimized className="size-12 object-contain" />
                      ) : (
                        <Languages className="size-6" aria-hidden="true" />
                      )}
                    </span>
                    <span className="font-heading text-2xl font-semibold">{language.name}</span>
                    <ChevronRight className="ml-auto size-5 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                  </button>
                ))}
              </div>
              {!languages.length ? <p className="mt-6 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">Nenhum idioma disponível agora.</p> : null}
            </div>
          ) : null}

          {phase === "contact" ? (
            <div className="mx-auto max-w-xl">
              <button onClick={() => setPhase("language")} className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Voltar</button>
              <div className="rounded-3xl border border-border bg-card p-6 shadow-[0_24px_70px_-48px_rgba(0,100,224,0.55)] sm:p-8">
                <h1 className="font-heading text-4xl font-semibold tracking-[-0.03em]">Salve seu resultado.</h1>
                <form onSubmit={(event) => { void submitContact(event); }} className="mt-7 space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="placement-name">Nome</Label>
                    <div className="relative"><UserRound className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" /><Input id="placement-name" name="name" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Seu nome" className="h-13 rounded-xl bg-background pl-12 text-base" autoFocus /></div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="placement-email">E-mail (opcional)</Label>
                    <div className="relative"><Mail aria-hidden="true" className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" /><Input id="placement-email" name="email" type="email" inputMode="email" autoComplete="email" maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="voce@exemplo.com" className="h-13 rounded-xl bg-background pl-12 text-base" /></div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="placement-phone">WhatsApp</Label>
                    <div className={`${journey.phoneFields} grid grid-cols-[8.75rem_minmax(0,1fr)] gap-2 sm:grid-cols-[10rem_minmax(0,1fr)]`}>
                      <PhoneCountrySelect value={phoneCountryCode} onChange={(value) => { setPhoneCountryCode(value); setPhone(""); }} />
                      <div className="relative"><Phone className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" /><Input id="placement-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel-national" value={phone} onChange={(event) => setPhone(formatPhone(event.target.value, phoneCountry))} placeholder={phoneCountry.code === "BR" ? "(00) 00000-0000" : "Número"} className="h-13 rounded-xl bg-background pl-12 text-base" /></div>
                    </div>
                  </div>
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-muted/70 p-4 text-xs leading-5 text-muted-foreground"><input type="checkbox" name="marketing_consent" checked={marketingConsent} onChange={(event) => setMarketingConsent(event.target.checked)} className="mt-0.5 size-4 accent-primary" /><span>Aceito o uso dos meus dados para receber o resultado e informações sobre cursos.</span></label>
                  {error ? <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}
                  <Button type="submit" disabled={!canSubmitContact || submitting} className="h-12 w-full rounded-full text-base">{submitting ? <Loader2 className="size-5 animate-spin" /> : <>Iniciar teste <ArrowRight className="size-4" /></>}</Button>
                </form>
              </div>
            </div>
          ) : null}

          {phase === "question" && question ? (
            <div className={`${journey.testPanel} mx-auto max-w-3xl`}>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-primary">{skillLabel}</span>
              {question.context ? <div className="mt-5 rounded-2xl border border-primary/15 bg-primary/5 p-5 text-base leading-7 text-foreground/80">{question.context}</div> : null}
              <h1 className="mt-6 font-heading text-3xl font-semibold leading-tight tracking-[-0.025em] sm:text-4xl">{question.prompt}</h1>
              {question.audio_url ? <QuestionAudio key={question.id} question={question} onPlayed={() => setAudioPlayedFor(question.id)} /> : null}
              <div className="mt-7 grid gap-3">
                {question.options.map((option) => {
                  const active = selectedOption === option.id;
                  return <button key={option.id} onClick={() => setSelectedOption(option.id)} disabled={submitting} className={`flex min-h-15 items-center gap-4 rounded-2xl border p-4 text-left text-base font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${active ? "border-primary bg-primary/5 text-primary shadow-sm" : "border-border bg-card hover:border-primary/35 hover:bg-accent/40"}`}><span className={`flex size-9 shrink-0 items-center justify-center rounded-lg border text-sm font-bold ${active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground"}`}>{active ? <Check className="size-4" /> : option.label}</span><span>{option.text}</span></button>;
                })}
              </div>
              {error ? <p role="alert" className="mt-4 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}
              <Button onClick={submitAnswer} disabled={!selectedOption || submitting || (question.skill === "listening" && audioPlayedFor !== question.id)} className="mt-6 h-12 rounded-full px-7 text-base">{submitting ? <Loader2 className="size-5 animate-spin" /> : <>Continuar <ArrowRight className="size-4" /></>}</Button>
            </div>
          ) : null}

          {phase === "result" && result && resultCopy ? (
            <div className={`${journey.result} mx-auto max-w-2xl rounded-3xl border border-border bg-card p-7 text-center shadow-[0_28px_80px_-52px_rgba(0,100,224,0.55)] sm:p-10`}>
              <p className="text-sm font-semibold text-primary">Seu nível</p>
              <p className="mt-2 font-heading text-8xl font-semibold tracking-[-0.06em] text-primary">{result.level}</p>
              <h1 className="mt-2 font-heading text-3xl font-semibold">{resultCopy.title}</h1>
              <p className="mx-auto mt-4 max-w-lg leading-7 text-muted-foreground">{resultCopy.description}</p>
              <div className="mx-auto mt-6 max-w-lg rounded-2xl bg-primary/5 p-4 text-sm font-medium text-accent-foreground">{resultCopy.next}</div>
              <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                <Link href={{ pathname: "/checkout", query: { language: result.language_id ?? selectedLanguage?.id, level: result.level } }} className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-7 text-base font-semibold text-primary-foreground transition hover:bg-[#0052cc]">Ver turmas <ArrowRight className="size-4" /></Link>
                <Button onClick={resetTest} variant="outline" className="h-12 rounded-full px-6"><RotateCcw className="size-4" /> Refazer</Button>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
