"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ChevronLeft,
  Info,
  LockKeyhole,
  Moon,
  Sun,
  Sunrise,
  UserRoundCheck,
} from "lucide-react";
import { useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { enrollmentSchema, type EnrollmentSchema } from "@/features/checkout/schema";
import { checkoutService } from "@/features/checkout/services/checkout-service";
import { scheduleOptions } from "@/features/home/data";
import { httpClient } from "@/shared/lib/http-client";
import type { ApiError, HotsiteOffer, HotsiteStudentClass } from "@/shared/types";

type Step = 1 | 2 | 3 | 4;

type CheckoutExperienceProps = {
  mode: "modal" | "page";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

type LanguageChoice = {
  offerId: string;
  languageId: string;
  offerName: string;
  languageName: string;
  languageIcon: string;
};

type StoredCheckoutSession = {
  languageId?: string;
  offerId?: string;
  studentClassId?: string;
  schedule?: string;
  userId?: number;
  email?: string;
  accessToken?: string;
};

const scheduleIcons = {
  manha: Sunrise,
  tarde: Sun,
  noite: Moon,
};

const ACCESS_TOKEN_STORAGE_KEY = "veli.access-token";
const CHECKOUT_SESSION_STORAGE_KEY = "veli.checkout-session";

const defaultValues: EnrollmentSchema = {
  languageId: "",
  offerId: "",
  studentClassId: "",
  schedule: "",
  authMode: "register",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  cep: "",
  city: "",
  state: "",
  country: "Brasil",
  address: "",
  addressNumber: "",
  province: "",
};

function readStoredSession() {
  if (typeof window === "undefined") {
    return null;
  }

  const rawSession = window.localStorage.getItem(CHECKOUT_SESSION_STORAGE_KEY);

  if (!rawSession) {
    return null;
  }

  try {
    return JSON.parse(rawSession) as StoredCheckoutSession;
  } catch {
    return null;
  }
}

function persistStoredSession(session: StoredCheckoutSession) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    CHECKOUT_SESSION_STORAGE_KEY,
    JSON.stringify(session)
  );
}

function formatTime(time: string) {
  return time.slice(0, 5);
}

function getApiErrorMessage(error: unknown) {
  const defaultMessage = "Não foi possível concluir esta etapa agora.";

  if (!error || typeof error !== "object") {
    return defaultMessage;
  }

  const apiError = error as ApiError;
  const details = apiError.details;

  if (typeof details === "string" && details.trim().length > 0) {
    return details;
  }

  if (details && typeof details === "object") {
    const candidate = details as Record<string, unknown>;

    if (typeof candidate.detail === "string") {
      return candidate.detail;
    }

    for (const value of Object.values(candidate)) {
      if (typeof value === "string" && value.trim().length > 0) {
        return value;
      }

      if (Array.isArray(value) && typeof value[0] === "string") {
        return value[0];
      }
    }
  }

  return apiError.message || defaultMessage;
}

function getOfferLanguages(offer: HotsiteOffer) {
  return Array.isArray(offer.languages) ? offer.languages : [];
}

export function CheckoutExperience({
  mode,
  open = false,
  onOpenChange,
}: CheckoutExperienceProps) {
  const [step, setStep] = useState<Step>(1);
  const [offers, setOffers] = useState<HotsiteOffer[]>([]);
  const [offersLoading, setOffersLoading] = useState(false);
  const [offersError, setOffersError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showScheduleOptions, setShowScheduleOptions] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const form = useForm<EnrollmentSchema>({
    resolver: zodResolver(enrollmentSchema),
    defaultValues,
    mode: "onTouched",
  });

  const selectedLanguageId = useWatch({
    control: form.control,
    name: "languageId",
  });
  const selectedOfferId = useWatch({
    control: form.control,
    name: "offerId",
  });
  const selectedStudentClassId = useWatch({
    control: form.control,
    name: "studentClassId",
  });
  const selectedSchedule = useWatch({
    control: form.control,
    name: "schedule",
  });
  const authMode = useWatch({
    control: form.control,
    name: "authMode",
  });

  const shouldFetchOffers = mode === "page" || open;

  useEffect(() => {
    const storedSession = readStoredSession();
    const storedToken =
      window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY) ??
      storedSession?.accessToken ??
      null;

    if (storedToken) {
      httpClient.setTokenProvider(() => storedToken);
    }

    if (!storedSession) {
      return;
    }

    form.reset({
      ...defaultValues,
      languageId: storedSession.languageId ?? "",
      offerId: storedSession.offerId ?? "",
      studentClassId: storedSession.studentClassId ?? "",
      schedule: storedSession.schedule ?? "",
      email: storedSession.email ?? "",
    });
  }, [form]);

  useEffect(() => {
    if (!shouldFetchOffers || offersLoading || offers.length > 0) {
      return;
    }

    let cancelled = false;

    async function loadOffers() {
      setOffersLoading(true);
      setOffersError(null);

      try {
        const response = await checkoutService.getOffers();

        if (cancelled) {
          return;
        }

        const activeOffers = response.data.results.filter((offer) => offer.is_active);
        setOffers(activeOffers);
      } catch (error) {
        if (!cancelled) {
          setOffersError(getApiErrorMessage(error));
        }
      } finally {
        if (!cancelled) {
          setOffersLoading(false);
        }
      }
    }

    void loadOffers();

    return () => {
      cancelled = true;
    };
  }, [offers.length, offersLoading, shouldFetchOffers]);

  useEffect(() => {
    const session = readStoredSession() ?? {};

    persistStoredSession({
      ...session,
      languageId: selectedLanguageId || undefined,
      offerId: selectedOfferId || undefined,
      studentClassId: selectedStudentClassId || undefined,
      schedule: selectedSchedule || undefined,
      email: form.getValues("email") || session.email,
      accessToken: accessToken ?? session.accessToken,
    });
  }, [
    accessToken,
    form,
    selectedLanguageId,
    selectedOfferId,
    selectedSchedule,
    selectedStudentClassId,
  ]);

  const languageChoices = useMemo<LanguageChoice[]>(
    () =>
      offers.flatMap((offer) =>
        getOfferLanguages(offer).map((language) => ({
          offerId: String(offer.id),
          languageId: String(language.id),
          offerName: offer.name,
          languageName: language.name,
          languageIcon: language.lang_icon,
        }))
      ),
    [offers]
  );

  const selectedLanguageChoice = useMemo(
    () =>
      languageChoices.find(
        (choice) =>
          choice.languageId === selectedLanguageId &&
          choice.offerId === selectedOfferId
      ) ?? null,
    [languageChoices, selectedLanguageId, selectedOfferId]
  );

  const selectedOffer = useMemo(
    () => offers.find((offer) => String(offer.id) === selectedOfferId) ?? null,
    [offers, selectedOfferId]
  );

  const availableClasses = useMemo(
    () =>
      selectedOffer?.student_classes.filter(
        (item) =>
          item.is_active &&
          String(item.course.language.id) === selectedLanguageId
      ) ?? [],
    [selectedLanguageId, selectedOffer]
  );

  const selectedClass = useMemo(
    () =>
      availableClasses.find(
        (item) => String(item.id) === selectedStudentClassId
      ) ?? null,
    [availableClasses, selectedStudentClassId]
  );

  const selectedScheduleOption = useMemo(
    () => scheduleOptions.find((item) => item.value === selectedSchedule) ?? null,
    [selectedSchedule]
  );
  const shouldShowScheduleOptions = showScheduleOptions || Boolean(selectedSchedule);

  const summaryText = useMemo(() => {
    const classSummary = selectedClass
      ? `${selectedClass.course.name} • ${selectedClass.start_date} a ${selectedClass.finish_date} • ${formatTime(selectedClass.time)}`
      : null;

    return {
      language: selectedLanguageChoice?.languageName ?? "Idioma",
      offer: selectedLanguageChoice?.offerName ?? "Plano",
      classOrSchedule:
        classSummary ?? selectedScheduleOption?.label ?? "Turma ou turno",
    };
  }, [selectedClass, selectedLanguageChoice, selectedScheduleOption]);

  const resetFlow = () => {
    setStep(1);
    setSubmitting(false);
    setSubmitError(null);
    setShowScheduleOptions(false);
    form.reset(defaultValues);
  };

  const handleModalOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetFlow();
    }

    onOpenChange?.(nextOpen);
  };

  const handleLanguageSelect = (choice: LanguageChoice) => {
    form.setValue("languageId", choice.languageId, { shouldValidate: true });
    form.setValue("offerId", choice.offerId, { shouldValidate: true });
    form.setValue("studentClassId", "", { shouldValidate: false });
    form.setValue("schedule", "", { shouldValidate: false });
    form.clearErrors(["languageId", "offerId", "studentClassId", "schedule"]);
    setShowScheduleOptions(false);
  };

  const handleClassSelect = (studentClass: HotsiteStudentClass) => {
    form.setValue("studentClassId", String(studentClass.id), {
      shouldValidate: true,
    });
    form.setValue("schedule", "", { shouldValidate: false });
    form.clearErrors(["studentClassId", "schedule"]);
  };

  const handleScheduleSelect = (schedule: string) => {
    form.setValue("schedule", schedule, { shouldValidate: true });
    form.setValue("studentClassId", "", { shouldValidate: false });
    form.clearErrors(["studentClassId", "schedule"]);
  };

  const nextStep = async () => {
    if (step === 1) {
      const valid = await form.trigger(["languageId", "offerId"]);

      if (valid) {
        setStep(2);
      }

      return;
    }

    if (step === 2) {
      const values = form.getValues();

      if (values.studentClassId || values.schedule) {
        form.clearErrors(["studentClassId", "schedule"]);
        setStep(3);
        return;
      }

      form.setError("studentClassId", {
        type: "manual",
        message: "Selecione uma turma ou um turno.",
      });
    }
  };

  const previousStep = () => {
    if (step > 1 && step < 4) {
      setStep((current) => (current - 1) as Step);
    }
  };

  const handleAuthModeChange = (nextMode: "register" | "login") => {
    form.setValue("authMode", nextMode, { shouldValidate: true });
    form.clearErrors();
    setSubmitError(null);
  };

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitting(true);
    setSubmitError(null);

    try {
      const response =
        values.authMode === "register"
          ? await checkoutService.createUser({
              first_name: values.firstName,
              last_name: values.lastName,
              email: values.email,
              password: values.password,
              phone: values.phone,
              cep: values.cep,
              city: values.city,
              state: values.state,
              country: values.country,
              address: values.address,
              address_number: values.addressNumber,
              province: values.province,
            })
          : await checkoutService.authenticateUser({
              email: values.email,
              password: values.password,
            });

      const token = response.data.access_token;
      setAccessToken(token);
      httpClient.setTokenProvider(() => token);

      if (typeof window !== "undefined") {
        window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
      }

      persistStoredSession({
        languageId: values.languageId,
        offerId: values.offerId,
        studentClassId: values.studentClassId || undefined,
        schedule: values.schedule || undefined,
        userId: response.data.id,
        email: values.email,
        accessToken: token,
      });

      setStep(4);
    } catch (error) {
      setSubmitError(getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  });

  const title =
    step === 1
      ? "Escolha o idioma"
      : step === 2
        ? "Escolha sua turma"
        : step === 3
          ? authMode === "login"
            ? "Autentique sua conta"
            : "Crie sua conta"
          : "Pronto para o pagamento";

  const content = (
    <div className={mode === "page" ? "page-shell py-10 md:py-16" : undefined}>
      <div
        className={
          mode === "page"
            ? "mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr]"
            : undefined
        }
      >
        {mode === "page" && (
          <aside className="rounded-[2rem] border border-border bg-white p-8 shadow-sm">
            <h1 className="font-heading text-4xl font-semibold tracking-[-0.03em] text-foreground md:text-5xl">
              Configure sua matrícula com poucos passos.
            </h1>
            <p className="mt-5 text-base leading-7 text-muted-foreground">
              Escolha o idioma, selecione uma turma disponível ou um turno e
              siga para a etapa de pagamento com sua conta pronta.
            </p>
            <div className="mt-8 rounded-[1.6rem] bg-accent p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
                Resumo atual
              </p>
              <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                <p>
                  <strong className="text-foreground">Idioma:</strong>{" "}
                  {summaryText.language}
                </p>
                <p>
                  <strong className="text-foreground">Plano:</strong>{" "}
                  {summaryText.offer}
                </p>
                <p>
                  <strong className="text-foreground">Turma ou turno:</strong>{" "}
                  {summaryText.classOrSchedule}
                </p>
                <p>
                  <strong className="text-foreground">Etapa:</strong> {title}
                </p>
              </div>
            </div>
          </aside>
        )}

        <section
          className={`rounded-[2rem] border border-border bg-white shadow-sm ${mode === "page" ? "p-6 sm:p-8" : "p-0"}`}
        >
          {mode === "page" ? (
            <div className="border-b border-border pb-5">
              <h2 className="font-heading text-3xl font-semibold tracking-[-0.03em] text-foreground">
                {title}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Fluxo preparado para desktop e mobile.
              </p>
            </div>
          ) : null}

          <div className={mode === "page" ? "pt-6" : ""}>
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <Label className="mb-4 block text-base font-semibold text-foreground">
                    1. Qual idioma você quer aprender?
                  </Label>

                  {offersLoading ? (
                    <div className="flex min-h-40 items-center justify-center rounded-[1.4rem] border border-dashed border-border bg-muted/40">
                      <div className="size-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    </div>
                  ) : offersError ? (
                    <div className="rounded-[1.4rem] border border-destructive/20 bg-destructive/5 p-5">
                      <p className="text-sm leading-6 text-destructive">
                        {offersError}
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        className="mt-4"
                        onClick={() => {
                          setOffers([]);
                          setOffersError(null);
                        }}
                      >
                        Tentar novamente
                      </Button>
                    </div>
                  ) : (
                    <>
                      {languageChoices.length > 0 ? (
                        <div className="grid gap-3 sm:grid-cols-2">
                          {languageChoices.map((choice) => {
                            const active =
                              choice.languageId === selectedLanguageId &&
                              choice.offerId === selectedOfferId;

                            return (
                              <button
                                key={`${choice.offerId}-${choice.languageId}`}
                                type="button"
                                onClick={() => handleLanguageSelect(choice)}
                                className={`flex items-center gap-4 rounded-[1.2rem] border px-4 py-4 text-left transition ${
                                  active
                                    ? "border-primary bg-accent"
                                    : "border-border bg-white hover:bg-muted"
                                }`}
                              >
                                <Image
                                  src={choice.languageIcon}
                                  alt={choice.languageName}
                                  width={48}
                                  height={48}
                                  className="size-12 rounded-full border border-border object-cover"
                                />
                                <div>
                                  <p className="font-semibold text-foreground">
                                    {choice.languageName}
                                  </p>
                                  <p className="mt-1 text-sm text-muted-foreground">
                                    {choice.offerName}
                                  </p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="rounded-[1.4rem] border border-dashed border-border bg-muted/40 p-5 text-sm leading-6 text-muted-foreground">
                          A oferta foi carregada, mas não trouxe idiomas válidos
                          em <code>languages</code>.
                        </div>
                      )}
                    </>
                  )}

                  {form.formState.errors.languageId ? (
                    <p className="mt-3 text-sm text-destructive">
                      {form.formState.errors.languageId.message}
                    </p>
                  ) : null}
                </div>

                <Button
                  type="button"
                  className="h-12 w-full rounded-full bg-primary text-base font-semibold hover:bg-[#0052cc]"
                  onClick={nextStep}
                  disabled={offersLoading || languageChoices.length === 0}
                >
                  Continuar
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <Label className="mb-4 block text-base font-semibold text-foreground">
                    2. Escolha uma turma disponível
                  </Label>

                  <div className="grid gap-3">
                    {availableClasses.map((studentClass) => {
                      const active =
                        String(studentClass.id) === selectedStudentClassId;

                      return (
                        <button
                          key={studentClass.id}
                          type="button"
                          onClick={() => handleClassSelect(studentClass)}
                          className={`rounded-[1.2rem] border px-5 py-4 text-left transition ${
                            active
                              ? "border-primary bg-accent"
                              : "border-border bg-white hover:bg-muted"
                          }`}
                        >
                          <p className="font-semibold text-foreground">
                            {studentClass.course.name}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Professora: {studentClass.teacher_full_name}
                          </p>
                          <div className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
                            <p>
                              <strong className="text-foreground">Início:</strong>{" "}
                              {studentClass.start_date}
                            </p>
                            <p>
                              <strong className="text-foreground">Fim:</strong>{" "}
                              {studentClass.finish_date}
                            </p>
                            <p>
                              <strong className="text-foreground">Horário:</strong>{" "}
                              {formatTime(studentClass.time)}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {availableClasses.length === 0 ? (
                    <p className="rounded-[1.2rem] border border-dashed border-border bg-muted/30 p-4 text-sm leading-6 text-muted-foreground">
                      Nenhuma turma ativa foi encontrada para esta opção no momento.
                    </p>
                  ) : null}

                  <button
                    type="button"
                    className="mt-5 text-left text-sm font-semibold text-primary hover:underline"
                    onClick={() => {
                      setShowScheduleOptions((current) => !current);
                      form.setValue("studentClassId", "", { shouldValidate: false });
                    }}
                  >
                    Ainda não sei o meu horário, desejo escolher um turno
                  </button>

                  {shouldShowScheduleOptions ? (
                    <div className="mt-4 grid gap-3">
                      {scheduleOptions.map((option) => {
                        const active = option.value === selectedSchedule;
                        const Icon =
                          scheduleIcons[
                            option.value as keyof typeof scheduleIcons
                          ];

                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => handleScheduleSelect(option.value)}
                            className={`flex items-start gap-4 rounded-[1.2rem] border px-4 py-4 text-left transition ${
                              active
                                ? "border-primary bg-accent"
                                : "border-border bg-white hover:bg-muted"
                            }`}
                          >
                            <div className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-muted-foreground">
                              <Icon className="size-5" />
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">
                                {option.label}
                              </p>
                              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                {option.description}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : null}

                  {form.formState.errors.studentClassId ? (
                    <p className="mt-3 text-sm text-destructive">
                      {form.formState.errors.studentClassId.message}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 rounded-full text-base font-semibold"
                    onClick={previousStep}
                  >
                    <ChevronLeft className="size-4" />
                    Voltar
                  </Button>
                  <Button
                    type="button"
                    className="h-12 flex-1 rounded-full bg-primary text-base font-semibold hover:bg-[#0052cc]"
                    onClick={nextStep}
                  >
                    Continuar
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <form className="space-y-5" onSubmit={onSubmit}>
                <div className="flex gap-3 rounded-[1.2rem] bg-accent p-4 text-primary">
                  <Info className="mt-0.5 size-5 shrink-0" />
                  <p className="text-sm leading-6">
                    Você escolheu <strong>{summaryText.language}</strong> e{" "}
                    <strong>{summaryText.classOrSchedule}</strong>.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Button
                    type="button"
                    variant={authMode === "register" ? "default" : "outline"}
                    className="h-12 rounded-full text-base font-semibold"
                    onClick={() => handleAuthModeChange("register")}
                  >
                    Criar conta
                  </Button>
                  <Button
                    type="button"
                    variant={authMode === "login" ? "default" : "outline"}
                    className="h-12 rounded-full text-base font-semibold"
                    onClick={() => handleAuthModeChange("login")}
                  >
                    Já tenho conta
                  </Button>
                </div>

                {authMode === "register" ? (
                  <>
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">Nome</Label>
                        <Input
                          id="firstName"
                          placeholder="Maria"
                          className="h-12 rounded-2xl"
                          {...form.register("firstName")}
                        />
                        {form.formState.errors.firstName ? (
                          <p className="text-sm text-destructive">
                            {form.formState.errors.firstName.message}
                          </p>
                        ) : null}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="lastName">Sobrenome</Label>
                        <Input
                          id="lastName"
                          placeholder="Silva"
                          className="h-12 rounded-2xl"
                          {...form.register("lastName")}
                        />
                        {form.formState.errors.lastName ? (
                          <p className="text-sm text-destructive">
                            {form.formState.errors.lastName.message}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="email">E-mail</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="maria@exemplo.com"
                          className="h-12 rounded-2xl"
                          {...form.register("email")}
                        />
                        {form.formState.errors.email ? (
                          <p className="text-sm text-destructive">
                            {form.formState.errors.email.message}
                          </p>
                        ) : null}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefone / WhatsApp</Label>
                        <Input
                          id="phone"
                          placeholder="+5511999990000"
                          className="h-12 rounded-2xl"
                          {...form.register("phone")}
                        />
                        {form.formState.errors.phone ? (
                          <p className="text-sm text-destructive">
                            {form.formState.errors.phone.message}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Crie uma senha</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        className="h-12 rounded-2xl"
                        {...form.register("password")}
                      />
                      <p className="text-sm text-muted-foreground">
                        Mínimo de 8 caracteres.
                      </p>
                      {form.formState.errors.password ? (
                        <p className="text-sm text-destructive">
                          {form.formState.errors.password.message}
                        </p>
                      ) : null}
                    </div>

                    <div className="grid gap-5 sm:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="cep">CEP</Label>
                        <Input
                          id="cep"
                          placeholder="01001000"
                          className="h-12 rounded-2xl"
                          {...form.register("cep")}
                        />
                        {form.formState.errors.cep ? (
                          <p className="text-sm text-destructive">
                            {form.formState.errors.cep.message}
                          </p>
                        ) : null}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="city">Cidade</Label>
                        <Input
                          id="city"
                          placeholder="Sao Paulo"
                          className="h-12 rounded-2xl"
                          {...form.register("city")}
                        />
                        {form.formState.errors.city ? (
                          <p className="text-sm text-destructive">
                            {form.formState.errors.city.message}
                          </p>
                        ) : null}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="state">Estado</Label>
                        <Input
                          id="state"
                          placeholder="SP"
                          className="h-12 rounded-2xl"
                          {...form.register("state")}
                        />
                        {form.formState.errors.state ? (
                          <p className="text-sm text-destructive">
                            {form.formState.errors.state.message}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="country">País</Label>
                        <Input
                          id="country"
                          placeholder="Brasil"
                          className="h-12 rounded-2xl"
                          {...form.register("country")}
                        />
                        {form.formState.errors.country ? (
                          <p className="text-sm text-destructive">
                            {form.formState.errors.country.message}
                          </p>
                        ) : null}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="province">Bairro</Label>
                        <Input
                          id="province"
                          placeholder="Centro"
                          className="h-12 rounded-2xl"
                          {...form.register("province")}
                        />
                        {form.formState.errors.province ? (
                          <p className="text-sm text-destructive">
                            {form.formState.errors.province.message}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-[1fr_180px]">
                      <div className="space-y-2">
                        <Label htmlFor="address">Endereço</Label>
                        <Input
                          id="address"
                          placeholder="Rua das Flores"
                          className="h-12 rounded-2xl"
                          {...form.register("address")}
                        />
                        {form.formState.errors.address ? (
                          <p className="text-sm text-destructive">
                            {form.formState.errors.address.message}
                          </p>
                        ) : null}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="addressNumber">Número</Label>
                        <Input
                          id="addressNumber"
                          placeholder="123"
                          className="h-12 rounded-2xl"
                          {...form.register("addressNumber")}
                        />
                        {form.formState.errors.addressNumber ? (
                          <p className="text-sm text-destructive">
                            {form.formState.errors.addressNumber.message}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-5">
                    <div className="rounded-[1.2rem] border border-border bg-muted/40 p-4 text-sm leading-6 text-muted-foreground">
                      Use suas credenciais existentes para autenticar e seguir
                      direto para o pagamento.
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="maria@exemplo.com"
                        className="h-12 rounded-2xl"
                        {...form.register("email")}
                      />
                      {form.formState.errors.email ? (
                        <p className="text-sm text-destructive">
                          {form.formState.errors.email.message}
                        </p>
                      ) : null}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Senha</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        className="h-12 rounded-2xl"
                        {...form.register("password")}
                      />
                      {form.formState.errors.password ? (
                        <p className="text-sm text-destructive">
                          {form.formState.errors.password.message}
                        </p>
                      ) : null}
                    </div>
                  </div>
                )}

                {submitError ? (
                  <div className="rounded-[1.2rem] border border-destructive/20 bg-destructive/5 p-4 text-sm leading-6 text-destructive">
                    {submitError}
                  </div>
                ) : null}

                <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 rounded-full text-base font-semibold"
                    onClick={previousStep}
                  >
                    <ChevronLeft className="size-4" />
                    Voltar
                  </Button>
                  <Button
                    type="submit"
                    className="h-12 flex-1 rounded-full bg-[#147b29] text-base font-semibold hover:bg-[#106221]"
                    disabled={submitting}
                  >
                    Prosseguir para o pagamento
                    <LockKeyhole className="size-4" />
                  </Button>
                </div>
              </form>
            )}

            {step === 4 && (
              <div className="flex min-h-[360px] flex-col items-center justify-center px-4 py-8 text-center">
                <div className="flex size-16 items-center justify-center rounded-full bg-[#147b29]/10 text-[#147b29]">
                  <UserRoundCheck className="size-8" />
                </div>
                <h3 className="mt-6 font-heading text-3xl font-semibold tracking-[-0.03em] text-foreground">
                  Conta pronta para a próxima etapa
                </h3>
                <p className="mt-3 max-w-md text-base leading-7 text-muted-foreground">
                  Sua conta foi validada com sucesso e o token de acesso já foi
                  armazenado para autenticar a etapa de pagamento.
                </p>
                {accessToken ? (
                  <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">
                    O checkout já tem autorização disponível para seguir com as
                    próximas chamadas protegidas.
                  </p>
                ) : null}
                {mode === "page" ? (
                  <Link
                    href="/"
                    className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                  >
                    Voltar para a home
                  </Link>
                ) : null}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );

  if (mode === "page") {
    return content;
  }

  return (
    <Dialog open={open} onOpenChange={handleModalOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-2xl rounded-[1.8rem] border border-border bg-white p-0 sm:max-w-2xl"
      >
        <DialogHeader className="border-b border-border px-6 py-5 sm:px-8">
          <DialogTitle className="font-heading text-2xl font-semibold tracking-[-0.03em] text-foreground">
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="max-h-[80vh] overflow-y-auto px-6 py-6 sm:px-8 sm:py-8">
          {content}
        </div>
      </DialogContent>
    </Dialog>
  );
}
