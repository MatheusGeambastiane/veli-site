"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Copy,
  CreditCard,
  ExternalLink,
  Loader2,
  Moon,
  ReceiptText,
  ShieldCheck,
  Sun,
  Sunrise,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { checkoutService } from "@/features/checkout/services/checkout-service";
import type {
  ApiError,
  HotsiteAuthenticatedUser,
  HotsiteBillingOption,
  HotsiteCheckoutLanguage,
  HotsiteCheckoutOffer,
  HotsiteOffer,
  HotsiteOrderPayload,
  HotsiteOrderResponse,
  HotsitePaymentStatusResponse,
} from "@/shared/types";

type CheckoutStep = "language" | "offer" | "selection" | "account" | "payment";
type ClassChoiceMode = "class" | "period";
type AuthMode = "login" | "register";
type PeriodValue = "morning" | "afternoon" | "night";
type PaymentBillingType = "one_time" | "recurring";

type CheckoutExperienceProps = {
  mode: "modal" | "page";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

type LoginForm = {
  email: string;
  password: string;
};

type RegisterForm = {
  firstName: string;
  lastName: string;
  cpf: string;
  phone: string;
  email: string;
  password: string;
  zipCode: string;
  address: string;
  addressNumber: string;
  province: string;
  city: string;
  state: string;
  country: string;
};

const checkoutSessionKey = "veli.checkout.selection";

const dayLabels: Record<string, string> = {
  Mon: "Seg",
  Tue: "Ter",
  Wed: "Qua",
  Thu: "Qui",
  Fri: "Sex",
  Sat: "Sab",
  Sun: "Dom",
};

const stateOptions = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
];

const periodOptions: Array<{
  value: PeriodValue;
  label: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    value: "morning",
    label: "Manhã",
    description: "Preferência de horário",
    icon: Sunrise,
  },
  {
    value: "afternoon",
    label: "Tarde",
    description: "Preferência de horário",
    icon: Sun,
  },
  {
    value: "night",
    label: "Noite",
    description: "Preferência de horário",
    icon: Moon,
  },
];

const checkoutSteps: Array<{ value: CheckoutStep; label: string }> = [
  { value: "language", label: "Idioma" },
  { value: "offer", label: "Oferta" },
  { value: "selection", label: "Turma" },
  { value: "account", label: "Conta" },
  { value: "payment", label: "PIX" },
];

function getApiErrorMessage(error: unknown) {
  const defaultMessage = "Não foi possível carregar os dados agora.";

  if (error instanceof Error) {
    return error.message;
  }

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

function formatPrice(price: string | number | undefined | null) {
  if (price === undefined || price === null || price === "") {
    return "A confirmar";
  }

  const numericPrice = Number(price);

  if (!Number.isFinite(numericPrice)) {
    return `R$ ${price}`;
  }

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numericPrice);
}

function formatTime(time: string) {
  return time ? time.slice(0, 5) : "A confirmar";
}

function formatDays(days: string[]) {
  if (!Array.isArray(days) || days.length === 0) {
    return "Dias a confirmar";
  }

  return days.map((day) => dayLabels[day] ?? day).join(", ");
}

function formatExpirationDate(value: string | null) {
  if (!value) {
    return "A confirmar";
  }

  const dateMatch = value.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::\d{2})?)?/
  );

  if (dateMatch) {
    const [, year, month, day, hour, minute] = dateMatch;
    const formattedDate = `${day}/${month}/${year}`;

    if (hour && minute) {
      return `${formattedDate} às ${hour}:${minute}`;
    }

    return formattedDate;
  }

  const brDateMatch = value.match(
    /^(\d{2})\/(\d{2})\/(\d{4})(?:[ T](\d{2}):(\d{2})(?::\d{2})?)?/
  );

  if (brDateMatch) {
    const [, day, month, year, hour, minute] = brDateMatch;
    const formattedDate = `${day}/${month}/${year}`;

    if (hour && minute) {
      return `${formattedDate} às ${hour}:${minute}`;
    }

    return formattedDate;
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsedDate);
}

function getCourseName(offer?: HotsiteOffer | HotsiteCheckoutOffer | null) {
  if (!offer) {
    return "Oferta selecionada";
  }

  if ("course" in offer) {
    return offer.course.name;
  }

  return offer.name;
}

function getOfferImage(offer: HotsiteCheckoutOffer) {
  return offer.course.language.lang_icon;
}

function getBillingLabel(option: HotsiteBillingOption) {
  if (option.code === "UPFRONT_PIX") {
    return "PIX à vista";
  }

  if (option.code === "MONTHLY_PIX") {
    return "PIX mensal";
  }

  if (option.code === "UPFRONT_CREDIT_CARD") {
    return "Cartão à vista";
  }

  if (option.code === "MONTHLY_CREDIT_CARD") {
    return "Cartão mensal";
  }

  return option.code.replaceAll("_", " ");
}

function getBillingDescription(option: HotsiteBillingOption) {
  if (option.billing_method === "credit_card") {
    return "Em breve";
  }

  return option.type === "recurring" ? "Cobrança mensal" : "Pagamento único";
}

function isCreditCardOption(option?: HotsiteBillingOption | null) {
  return option?.billing_method === "credit_card";
}

function getAuthToken(user: HotsiteAuthenticatedUser) {
  return user.access ?? user.token ?? user.access_token ?? "";
}

function getPaymentValue(order: HotsiteOrderResponse | null) {
  if (!order) {
    return undefined;
  }

  return order.raw?.value ?? undefined;
}

function getPaymentDescription(order: HotsiteOrderResponse | null) {
  return (
    order?.raw?.pix_qr_code?.description ??
    order?.raw?.description ??
    "Pagamento Veli"
  );
}

function getPaymentExpiration(
  order: HotsiteOrderResponse | null,
  status: HotsitePaymentStatusResponse | null
) {
  return (
    order?.raw?.pix_qr_code?.expirationDate ??
    order?.raw?.dueDate ??
    status?.latest_charge?.due_date ??
    null
  );
}

function getQrCode(order: HotsiteOrderResponse | null) {
  return (
    order?.pix_qr_code_base64 ??
    order?.pix_qr_code ??
    order?.raw?.pix_qr_code?.encodedImage ??
    null
  );
}

function getCopyPaste(order: HotsiteOrderResponse | null) {
  return (
    order?.pix_copy_paste ?? order?.raw?.pix_qr_code?.payload ?? ""
  );
}

function isExpiredStatus(status: HotsitePaymentStatusResponse | null) {
  if (!status) {
    return false;
  }

  return [status.payment_status, status.checkout_status, status.order_status].some(
    (value) => value?.toLowerCase().includes("expired")
  );
}

function isPaidStatus(status: HotsitePaymentStatusResponse | null) {
  if (!status) {
    return false;
  }

  return (
    status.is_paid ||
    [status.payment_status, status.checkout_status, status.order_status].some(
      (value) => ["paid", "active", "confirmed"].includes(value?.toLowerCase())
    )
  );
}

function CheckoutLoading() {
  return (
    <div className="flex min-h-48 items-center justify-center rounded-[1.4rem] border border-dashed border-border bg-muted/40">
      <Loader2 className="size-10 animate-spin text-primary" />
    </div>
  );
}

function CheckoutError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="rounded-[1.4rem] border border-destructive/20 bg-destructive/5 p-5">
      <p className="text-sm leading-6 text-destructive">{message}</p>
      <Button
        type="button"
        variant="outline"
        className="mt-4 h-10 rounded-full px-5"
        onClick={onRetry}
      >
        Tentar novamente
      </Button>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

export function CheckoutExperience({
  mode,
  open = false,
  onOpenChange,
}: CheckoutExperienceProps) {
  const [step, setStep] = useState<CheckoutStep>("language");
  const [languages, setLanguages] = useState<HotsiteCheckoutLanguage[]>([]);
  const [offers, setOffers] = useState<HotsiteCheckoutOffer[]>([]);
  const [selectedLanguage, setSelectedLanguage] =
    useState<HotsiteCheckoutLanguage | null>(null);
  const [selectedOfferSummary, setSelectedOfferSummary] =
    useState<HotsiteCheckoutOffer | null>(null);
  const [offerDetail, setOfferDetail] = useState<HotsiteOffer | null>(null);
  const [classChoiceMode, setClassChoiceMode] =
    useState<ClassChoiceMode>("class");
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodValue | null>(null);
  const [selectedBillingCode, setSelectedBillingCode] = useState<string | null>(
    null
  );
  const [paymentBillingType, setPaymentBillingType] =
    useState<PaymentBillingType>("one_time");
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [loginForm, setLoginForm] = useState<LoginForm>({
    email: "",
    password: "",
  });
  const [registerForm, setRegisterForm] = useState<RegisterForm>({
    firstName: "",
    lastName: "",
    cpf: "",
    phone: "",
    email: "",
    password: "",
    zipCode: "",
    address: "",
    addressNumber: "",
    province: "",
    city: "",
    state: "SP",
    country: "Brasil",
  });
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [orderPayload, setOrderPayload] = useState<HotsiteOrderPayload | null>(
    null
  );
  const [orderResponse, setOrderResponse] =
    useState<HotsiteOrderResponse | null>(null);
  const [paymentStatus, setPaymentStatus] =
    useState<HotsitePaymentStatusResponse | null>(null);
  const [languagesLoading, setLanguagesLoading] = useState(false);
  const [offersLoading, setOffersLoading] = useState(false);
  const [offerDetailLoading, setOfferDetailLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [languagesError, setLanguagesError] = useState<string | null>(null);
  const [offersError, setOffersError] = useState<string | null>(null);
  const [offerDetailError, setOfferDetailError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [languagesReloadKey, setLanguagesReloadKey] = useState(0);
  const [offersReloadKey, setOffersReloadKey] = useState(0);
  const [offerDetailReloadKey, setOfferDetailReloadKey] = useState(0);

  const shouldLoadLanguages = mode === "page" || open;
  const selectedBilling = useMemo(
    () =>
      offerDetail?.billing_options.find(
        (option) => option.code === selectedBillingCode
      ) ?? null,
    [offerDetail, selectedBillingCode]
  );
  const activeBillingOptions = useMemo(
    () => offerDetail?.billing_options.filter((option) => option.is_active) ?? [],
    [offerDetail]
  );
  const upfrontOptions = activeBillingOptions.filter(
    (option) => option.type === "one_time"
  );
  const monthlyOptions = activeBillingOptions.filter(
    (option) => option.type === "recurring"
  );
  const hasMultipleBillingTypes =
    upfrontOptions.length > 0 && monthlyOptions.length > 0;
  const visibleBillingOptions = hasMultipleBillingTypes
    ? paymentBillingType === "recurring"
      ? monthlyOptions
      : upfrontOptions
    : upfrontOptions.length > 0
      ? upfrontOptions
      : monthlyOptions;
  const visibleBillingType = visibleBillingOptions[0]?.type ?? paymentBillingType;
  const selectedClass = useMemo(
    () =>
      offerDetail?.student_classes.find(
        (studentClass) => studentClass.id === selectedClassId
      ) ?? null,
    [offerDetail, selectedClassId]
  );
  const canContinueToAccount =
    Boolean(selectedBilling) &&
    !isCreditCardOption(selectedBilling) &&
    (classChoiceMode === "class" ? Boolean(selectedClassId) : Boolean(selectedPeriod));
  const title = useMemo(() => {
    if (step === "language") {
      return "Escolha o idioma";
    }

    if (step === "offer") {
      return "Escolha a oferta";
    }

    if (step === "selection") {
      return "Turma e pagamento";
    }

    if (step === "account") {
      return "Entrar ou criar conta";
    }

    return "Pagamento PIX";
  }, [step]);
  const currentStepIndex = checkoutSteps.findIndex(
    (checkoutStep) => checkoutStep.value === step
  );

  useEffect(() => {
    if (!shouldLoadLanguages) {
      return;
    }

    let cancelled = false;

    async function loadLanguages() {
      setLanguagesLoading(true);
      setLanguagesError(null);

      try {
        const response = await checkoutService.getLanguages();

        if (!cancelled) {
          setLanguages(response.data.results);
        }
      } catch (error) {
        if (!cancelled) {
          setLanguagesError(getApiErrorMessage(error));
        }
      } finally {
        if (!cancelled) {
          setLanguagesLoading(false);
        }
      }
    }

    void loadLanguages();

    return () => {
      cancelled = true;
    };
  }, [languagesReloadKey, shouldLoadLanguages]);

  useEffect(() => {
    if (!selectedLanguage || step !== "offer") {
      return;
    }

    let cancelled = false;
    const languageId = selectedLanguage.id;

    async function loadOffers() {
      setOffersLoading(true);
      setOffersError(null);

      try {
        const response = await checkoutService.getOffersByLanguage(languageId);

        if (!cancelled) {
          setOffers(response.data.results);
        }
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
  }, [offersReloadKey, selectedLanguage, step]);

  useEffect(() => {
    if (!selectedOfferSummary || step !== "selection") {
      return;
    }

    let cancelled = false;
    const offerId = selectedOfferSummary.id;

    async function loadOfferDetail() {
      setOfferDetailLoading(true);
      setOfferDetailError(null);

      try {
        const response = await checkoutService.getOffer(offerId);

        if (!cancelled) {
          const activeOptions = response.data.billing_options.filter(
            (option) => option.is_active
          );
          const defaultBillingType = activeOptions.some(
            (option) => option.type === "one_time"
          )
            ? "one_time"
            : "recurring";
          const defaultBillingOption =
            activeOptions.find(
              (option) =>
                option.type === defaultBillingType &&
                option.billing_method === "pix"
            ) ??
            activeOptions.find((option) => option.type === defaultBillingType) ??
            activeOptions[0] ??
            null;

          setOfferDetail(response.data);
          setSelectedClassId(response.data.student_classes[0]?.id ?? null);
          setPaymentBillingType(defaultBillingType);
          setSelectedBillingCode(defaultBillingOption?.code ?? null);
        }
      } catch (error) {
        if (!cancelled) {
          setOfferDetailError(getApiErrorMessage(error));
        }
      } finally {
        if (!cancelled) {
          setOfferDetailLoading(false);
        }
      }
    }

    void loadOfferDetail();

    return () => {
      cancelled = true;
    };
  }, [offerDetailReloadKey, selectedOfferSummary, step]);

  useEffect(() => {
    if (step !== "payment" || !orderResponse?.order_id || isPaidStatus(paymentStatus)) {
      return;
    }

    let cancelled = false;
    const orderId = orderResponse.order_id;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    async function pollPaymentStatus() {
      try {
        const response = await checkoutService.getPaymentStatus(
          orderId,
          authToken ?? undefined
        );

        if (cancelled) {
          return;
        }

        setPaymentStatus(response.data);

        if (!isPaidStatus(response.data) && !isExpiredStatus(response.data)) {
          timeoutId = setTimeout(pollPaymentStatus, 5000);
        }
      } catch (error) {
        if (!cancelled) {
          setPaymentError(getApiErrorMessage(error));
          timeoutId = setTimeout(pollPaymentStatus, 5000);
        }
      }
    }

    timeoutId = setTimeout(pollPaymentStatus, 5000);

    return () => {
      cancelled = true;

      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [authToken, orderResponse?.order_id, paymentStatus, step]);

  const resetFlow = () => {
    setStep("language");
    setOffers([]);
    setSelectedLanguage(null);
    setSelectedOfferSummary(null);
    setOfferDetail(null);
    setSelectedClassId(null);
    setSelectedPeriod(null);
    setSelectedBillingCode(null);
    setPaymentBillingType("one_time");
    setClassChoiceMode("class");
    setAuthToken(null);
    setOrderPayload(null);
    setOrderResponse(null);
    setPaymentStatus(null);
    setFormError(null);
    setPaymentError(null);
    setOffersError(null);
    setOfferDetailError(null);
  };

  const handleModalOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetFlow();
    }

    onOpenChange?.(nextOpen);
  };

  const handleLanguageSelect = (language: HotsiteCheckoutLanguage) => {
    setSelectedLanguage(language);
    setSelectedOfferSummary(null);
    setOfferDetail(null);
    setOffers([]);
    setOffersError(null);
    setStep("offer");
  };

  const handleOfferSelect = (offer: HotsiteCheckoutOffer) => {
    setSelectedOfferSummary(offer);
    setOfferDetail(null);
    setSelectedClassId(null);
    setSelectedPeriod(null);
    setSelectedBillingCode(null);
    setPaymentBillingType("one_time");
    setClassChoiceMode("class");
    setStep("selection");
  };

  const buildOrderPayload = () => {
    if (!offerDetail || !selectedBilling) {
      return null;
    }

    const payload: HotsiteOrderPayload = {
      offer_id: offerDetail.id,
      billing_option_code: selectedBilling.code,
      installments: 1,
    };

    if (classChoiceMode === "class" && selectedClassId) {
      payload.student_class_id = selectedClassId;
    }

    if (classChoiceMode === "period" && selectedPeriod) {
      payload.preference_period = [selectedPeriod];
    }

    return payload;
  };

  const handleContinueToAccount = () => {
    const payload = buildOrderPayload();

    if (!payload || !canContinueToAccount) {
      setFormError("Selecione turma ou turno e uma forma de pagamento PIX.");
      return;
    }

    setFormError(null);
    setOrderPayload(payload);
    sessionStorage.setItem(checkoutSessionKey, JSON.stringify(payload));
    setStep("account");
  };

  const createOrderAfterAuth = async (token: string) => {
    const storedPayload =
      orderPayload ??
      (JSON.parse(
        sessionStorage.getItem(checkoutSessionKey) ?? "null"
      ) as HotsiteOrderPayload | null);

    if (!storedPayload) {
      throw new Error("Seleção do pedido não encontrada. Volte e escolha a oferta.");
    }

    const order = await checkoutService.createOrder(storedPayload, token);
    setOrderResponse(order.data);
    setPaymentStatus(null);
    setPaymentError(null);
    setStep("payment");
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthLoading(true);
    setFormError(null);

    try {
      const response = await checkoutService.authenticateUser(loginForm);
      const token = getAuthToken(response.data);

      if (!token) {
        throw new Error("Token de acesso não retornado no login.");
      }

      setAuthToken(token);
      await createOrderAfterAuth(token);
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthLoading(true);
    setFormError(null);

    try {
      const response = await checkoutService.createUser({
        first_name: registerForm.firstName,
        last_name: registerForm.lastName,
        cpf: registerForm.cpf.replace(/\D/g, ""),
        email: registerForm.email,
        password: registerForm.password,
        phone: registerForm.phone,
        zip_code: registerForm.zipCode.replace(/\D/g, ""),
        city: registerForm.city,
        state: registerForm.state,
        country: registerForm.country,
        address: registerForm.address,
        address_number: registerForm.addressNumber,
        province: registerForm.province,
      });
      const token = getAuthToken(response.data);

      if (!token) {
        throw new Error("Token de acesso não retornado no cadastro.");
      }

      setAuthToken(token);
      await createOrderAfterAuth(token);
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleCepBlur = async () => {
    const cep = registerForm.zipCode.replace(/\D/g, "");

    if (cep.length !== 8) {
      return;
    }

    setCepLoading(true);

    try {
      const data = await checkoutService.lookupCep(cep);
      setRegisterForm((current) => ({
        ...current,
        address: data.logradouro || current.address,
        province: data.bairro || current.province,
        city: data.localidade || current.city,
        state: data.uf || current.state,
      }));
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    } finally {
      setCepLoading(false);
    }
  };

  const handleCopyPix = async () => {
    const copyPaste = getCopyPaste(orderResponse);

    if (!copyPaste) {
      return;
    }

    await navigator.clipboard.writeText(copyPaste);
    setCopyFeedback(true);
    window.setTimeout(() => setCopyFeedback(false), 1800);
  };

  const renderSelectionSummary = () => (
    <aside className="space-y-4 rounded-[1.4rem] border border-border bg-white p-5 shadow-sm">
      <div className="rounded-[1.1rem] bg-[#101b24] p-5 text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
          Resumo do pedido
        </p>
        <p className="mt-3 font-heading text-3xl font-semibold">
          {formatPrice(selectedBilling?.price ?? offerDetail?.price)}
        </p>
        <p className="mt-2 text-sm text-white/70">{getCourseName(offerDetail)}</p>
      </div>

      <div className="rounded-[1rem] border border-border bg-muted/30 p-4">
        <p className="text-sm text-muted-foreground">
          {classChoiceMode === "class" ? "Turma escolhida" : "Turno escolhido"}
        </p>
        <p className="mt-1 font-semibold text-foreground">
          {classChoiceMode === "class"
            ? selectedClass
              ? `${selectedClass.course.name} - ${formatTime(selectedClass.time)}`
              : "Selecione uma turma"
            : periodOptions.find((period) => period.value === selectedPeriod)
                ?.label ?? "Selecione um turno"}
        </p>
      </div>

      <div className="rounded-[1rem] border border-border bg-muted/30 p-4">
        <p className="text-sm text-muted-foreground">Forma de pagamento</p>
        <p className="mt-1 font-semibold text-foreground">
          {selectedBilling ? getBillingLabel(selectedBilling) : "Selecione uma opção"}
        </p>
      </div>

      <Button
        type="button"
        className="h-12 w-full rounded-xl"
        disabled={!canContinueToAccount}
        onClick={handleContinueToAccount}
      >
        <CreditCard className="size-4" />
        Seguir para pagamento
        <ArrowRight className="size-4" />
      </Button>

      <p className="text-xs leading-5 text-muted-foreground">
        O botão será habilitado após escolher turma ou turno e uma forma de
        pagamento PIX.
      </p>

      {formError ? (
        <p className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
          {formError}
        </p>
      ) : null}
    </aside>
  );

  const handleBillingTypeSelect = (billingType: PaymentBillingType) => {
    const nextOptions =
      billingType === "recurring" ? monthlyOptions : upfrontOptions;
    const nextSelectedOption =
      nextOptions.find((option) => option.billing_method === "pix") ??
      nextOptions[0] ??
      null;

    setPaymentBillingType(billingType);
    setSelectedBillingCode(nextSelectedOption?.code ?? null);
  };

  const renderBillingOptions = (options: HotsiteBillingOption[], titleText: string) =>
    options.length > 0 ? (
      <div className="space-y-3">
        <h3 className="font-heading text-xl font-semibold tracking-[-0.02em]">
          {titleText}
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {options.map((option) => {
            const blocked = isCreditCardOption(option);
            const selected = selectedBillingCode === option.code;

            return (
              <button
                key={option.id}
                type="button"
                disabled={blocked}
                onClick={() => setSelectedBillingCode(option.code)}
                className={`rounded-[1.1rem] border p-4 text-left transition ${
                  selected
                    ? "border-primary bg-accent shadow-sm"
                    : "border-border bg-white hover:border-primary/50"
                } ${blocked ? "cursor-not-allowed opacity-60" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">
                      {getBillingLabel(option)}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {getBillingDescription(option)}
                    </p>
                  </div>
                  {selected ? (
                    <CheckCircle2 className="size-5 text-primary" />
                  ) : null}
                </div>
                <p className="mt-4 font-heading text-2xl font-semibold text-foreground">
                  {formatPrice(option.price)}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    ) : null;

  const content = (
    <div className={mode === "page" ? "page-shell py-10 md:py-16" : undefined}>
      <section
        className={
          mode === "page"
            ? "mx-auto max-w-6xl rounded-[2rem] border border-border bg-white p-6 shadow-sm sm:p-8"
            : "bg-white"
        }
      >
        <div className="border-b border-border pb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
                Checkout Veli
              </p>
              <h1 className="mt-2 font-heading text-3xl font-semibold tracking-[-0.03em] text-foreground md:text-4xl">
                {title}
              </h1>
            </div>
            <div className="w-full max-w-xl">
              <div className="grid grid-cols-5 items-start gap-1 rounded-[1.25rem] border border-border bg-muted/30 p-2 sm:gap-2">
                {checkoutSteps.map((checkoutStep, index) => {
                  const isActive = checkoutStep.value === step;
                  const isComplete = index < currentStepIndex;

                  return (
                    <div key={checkoutStep.value} className="relative min-w-0">
                      {index < checkoutSteps.length - 1 ? (
                        <span
                          className={`absolute left-[calc(50%+1rem)] right-[calc(-50%+1rem)] top-4 h-px ${
                            isComplete ? "bg-primary" : "bg-border"
                          }`}
                        />
                      ) : null}
                      <div className="relative z-10 flex flex-col items-center gap-2">
                        <span
                          className={`flex size-8 items-center justify-center rounded-full border text-xs font-bold transition ${
                            isActive
                              ? "border-primary bg-primary text-primary-foreground shadow-sm"
                              : isComplete
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border bg-white text-muted-foreground"
                          }`}
                        >
                          {isComplete ? (
                            <CheckCircle2 className="size-4" />
                          ) : (
                            index + 1
                          )}
                        </span>
                        <span
                          className={`truncate text-[0.68rem] font-semibold sm:text-xs ${
                            isActive
                              ? "text-foreground"
                              : isComplete
                                ? "text-primary"
                                : "text-muted-foreground"
                          }`}
                        >
                          {checkoutStep.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6">
          {step === "language" ? (
            <div className="space-y-6">
              <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                Selecione o idioma desejado para buscarmos as ofertas
                disponíveis.
              </p>

              {languagesLoading ? <CheckoutLoading /> : null}

              {!languagesLoading && languagesError ? (
                <CheckoutError
                  message={languagesError}
                  onRetry={() => setLanguagesReloadKey((current) => current + 1)}
                />
              ) : null}

              {!languagesLoading && !languagesError ? (
                languages.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {languages.map((language) => (
                      <button
                        key={language.id}
                        type="button"
                        onClick={() => handleLanguageSelect(language)}
                        className="group flex min-h-28 items-center gap-4 rounded-[1.3rem] border border-border bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-primary hover:bg-accent hover:shadow-sm"
                      >
                        <Image
                          src={language.image}
                          alt={language.name}
                          width={64}
                          height={64}
                          className="size-16 rounded-full border border-border object-cover"
                        />
                        <div>
                          <p className="font-heading text-2xl font-semibold tracking-[-0.03em] text-foreground">
                            {language.name}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Ver ofertas disponíveis
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[1.4rem] border border-dashed border-border bg-muted/40 p-5 text-sm leading-6 text-muted-foreground">
                    Nenhum idioma foi retornado em <code>results</code>.
                  </div>
                )
              ) : null}
            </div>
          ) : null}

          {step === "offer" && selectedLanguage ? (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <Image
                    src={selectedLanguage.image}
                    alt={selectedLanguage.name}
                    width={44}
                    height={44}
                    className="size-11 rounded-full border border-border object-cover"
                  />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Idioma selecionado
                    </p>
                    <p className="font-semibold text-foreground">
                      {selectedLanguage.name}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 rounded-full px-5"
                  onClick={() => {
                    setStep("language");
                    setOffers([]);
                    setSelectedOfferSummary(null);
                  }}
                >
                  <ArrowLeft className="size-4" />
                  Trocar idioma
                </Button>
              </div>

              {offersLoading ? <CheckoutLoading /> : null}

              {!offersLoading && offersError ? (
                <CheckoutError
                  message={offersError}
                  onRetry={() => setOffersReloadKey((current) => current + 1)}
                />
              ) : null}

              {!offersLoading && !offersError ? (
                offers.length > 0 ? (
                  <div className="grid gap-4">
                    {offers.map((offer) => (
                      <button
                        key={offer.id}
                        type="button"
                        onClick={() => handleOfferSelect(offer)}
                        className="rounded-[1.4rem] border border-border bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-primary hover:bg-accent hover:shadow-sm"
                      >
                        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                          <div className="flex gap-4">
                            <Image
                              src={getOfferImage(offer)}
                              alt={offer.course.language.name}
                              width={56}
                              height={56}
                              className="size-14 rounded-full border border-border object-cover"
                            />
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h2 className="font-heading text-2xl font-semibold tracking-[-0.03em] text-foreground">
                                  {offer.course.name}
                                </h2>
                                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                                  {offer.course.level.level}
                                </span>
                              </div>
                              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                                {offer.course.description}
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0 rounded-[1.1rem] bg-muted px-4 py-3 md:text-right">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                              Valor
                            </p>
                            <p className="mt-1 font-heading text-2xl font-semibold text-foreground">
                              {formatPrice(offer.price)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-5 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
                          <div className="flex items-center gap-2">
                            <CalendarDays className="size-4 text-primary" />
                            <span>{formatDays(offer.days_of_week)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock3 className="size-4 text-primary" />
                            <span>{formatTime(offer.time)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="size-4 text-primary" />
                            <span>
                              {offer.access_duration_days ?? "A confirmar"} dias
                              de acesso
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[1.4rem] border border-dashed border-border bg-muted/40 p-5 text-sm leading-6 text-muted-foreground">
                    Nenhuma oferta foi retornada para {selectedLanguage.name}.
                  </div>
                )
              ) : null}
            </div>
          ) : null}

          {step === "selection" && selectedOfferSummary ? (
            <div className="space-y-6">
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-full px-5"
                onClick={() => setStep("offer")}
              >
                <ArrowLeft className="size-4" />
                Voltar para ofertas
              </Button>

              {offerDetailLoading ? <CheckoutLoading /> : null}

              {!offerDetailLoading && offerDetailError ? (
                <CheckoutError
                  message={offerDetailError}
                  onRetry={() =>
                    setOfferDetailReloadKey((current) => current + 1)
                  }
                />
              ) : null}

              {!offerDetailLoading && !offerDetailError && offerDetail ? (
                <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
                  <div className="space-y-8 rounded-[1.4rem] border border-border bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <h2 className="font-heading text-2xl font-semibold tracking-[-0.03em] text-foreground">
                        {classChoiceMode === "class"
                          ? "Escolha a turma"
                          : "Escolha o turno"}
                      </h2>
                      <button
                        type="button"
                        className="text-left text-sm font-semibold text-primary underline-offset-4 hover:underline sm:text-right"
                        onClick={() => {
                          setClassChoiceMode(
                            classChoiceMode === "class" ? "period" : "class"
                          );
                          setSelectedClassId(
                            classChoiceMode === "class"
                              ? null
                              : offerDetail.student_classes[0]?.id ?? null
                          );
                          setSelectedPeriod(null);
                        }}
                      >
                        {classChoiceMode === "class"
                          ? "Não quero esses horários"
                          : "Quero escolher uma turma"}
                      </button>
                    </div>

                    {classChoiceMode === "class" ? (
                      <div className="grid gap-3">
                        {offerDetail.student_classes.length > 0 ? (
                          offerDetail.student_classes.map((studentClass) => (
                            <button
                              key={studentClass.id}
                              type="button"
                              onClick={() => setSelectedClassId(studentClass.id)}
                              className={`rounded-[1.1rem] border p-4 text-left transition ${
                                selectedClassId === studentClass.id
                                  ? "border-primary bg-accent shadow-sm"
                                  : "border-border bg-white hover:border-primary/50"
                              }`}
                            >
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                  <p className="font-semibold text-foreground">
                                    {studentClass.course.name}
                                  </p>
                                  <p className="mt-2 text-sm text-muted-foreground">
                                    {studentClass.start_date} até{" "}
                                    {studentClass.finish_date}
                                  </p>
                                  <p className="mt-1 text-sm text-muted-foreground">
                                    Professor: {studentClass.teacher_full_name}
                                  </p>
                                </div>
                                <div className="text-sm text-muted-foreground sm:text-right">
                                  <p>{formatTime(studentClass.time)}</p>
                                  <p>{formatDays(studentClass.days_of_week)}</p>
                                </div>
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="rounded-[1.1rem] border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                            Nenhuma turma disponível. Selecione um turno de
                            preferência.
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="grid gap-3 sm:grid-cols-3">
                        {periodOptions.map((period) => {
                          const Icon = period.icon;

                          return (
                            <button
                              key={period.value}
                              type="button"
                              onClick={() => setSelectedPeriod(period.value)}
                              className={`rounded-[1.1rem] border p-4 text-left transition ${
                                selectedPeriod === period.value
                                  ? "border-primary bg-accent shadow-sm"
                                  : "border-border bg-white hover:border-primary/50"
                              }`}
                            >
                              <Icon className="size-5 text-primary" />
                              <p className="mt-3 font-semibold text-foreground">
                                {period.label}
                              </p>
                              <p className="mt-1 text-sm text-muted-foreground">
                                {period.description}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    <div className="space-y-5">
                      {hasMultipleBillingTypes ? (
                        <div className="inline-flex rounded-full border border-border bg-muted/40 p-1">
                          <button
                            type="button"
                            onClick={() => handleBillingTypeSelect("recurring")}
                            className={`h-10 rounded-full px-5 text-sm font-semibold transition ${
                              paymentBillingType === "recurring"
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            Mensal
                          </button>
                          <button
                            type="button"
                            onClick={() => handleBillingTypeSelect("one_time")}
                            className={`h-10 rounded-full px-5 text-sm font-semibold transition ${
                              paymentBillingType === "one_time"
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            Único
                          </button>
                        </div>
                      ) : null}

                      {renderBillingOptions(
                        visibleBillingOptions,
                        visibleBillingType === "recurring"
                          ? "Pagamento mensal"
                          : "Pagamento único"
                      )}
                    </div>
                  </div>

                  {renderSelectionSummary()}
                </div>
              ) : null}
            </div>
          ) : null}

          {step === "account" ? (
            <div className="mx-auto max-w-3xl space-y-6">
              <div className="flex flex-col gap-3 rounded-[1.3rem] border border-border bg-muted/30 p-4 sm:flex-row">
                <Button
                  type="button"
                  variant={authMode === "login" ? "default" : "outline"}
                  className="h-11 flex-1 rounded-xl"
                  onClick={() => {
                    setAuthMode("login");
                    setFormError(null);
                  }}
                >
                  <UserRound className="size-4" />
                  Fazer login
                </Button>
                <Button
                  type="button"
                  variant={authMode === "register" ? "default" : "outline"}
                  className="h-11 flex-1 rounded-xl"
                  onClick={() => {
                    setAuthMode("register");
                    setFormError(null);
                  }}
                >
                  <ShieldCheck className="size-4" />
                  Criar uma conta
                </Button>
              </div>

              {formError ? (
                <p className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                  {formError}
                </p>
              ) : null}

              {authMode === "login" ? (
                <form
                  onSubmit={handleLogin}
                  className="space-y-5 rounded-[1.4rem] border border-border bg-white p-5 shadow-sm"
                >
                  <Field label="E-mail">
                    <Input
                      type="email"
                      required
                      value={loginForm.email}
                      onChange={(event) =>
                        setLoginForm((current) => ({
                          ...current,
                          email: event.target.value,
                        }))
                      }
                      className="h-11"
                    />
                  </Field>
                  <Field label="Senha">
                    <Input
                      type="password"
                      required
                      value={loginForm.password}
                      onChange={(event) =>
                        setLoginForm((current) => ({
                          ...current,
                          password: event.target.value,
                        }))
                      }
                      className="h-11"
                    />
                  </Field>
                  <Button
                    type="submit"
                    className="h-12 w-full rounded-xl"
                    disabled={authLoading}
                  >
                    {authLoading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : null}
                    Entrar e criar pedido
                  </Button>
                </form>
              ) : (
                <form
                  onSubmit={handleRegister}
                  className="space-y-5 rounded-[1.4rem] border border-border bg-white p-5 shadow-sm"
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Nome">
                      <Input
                        required
                        value={registerForm.firstName}
                        onChange={(event) =>
                          setRegisterForm((current) => ({
                            ...current,
                            firstName: event.target.value,
                          }))
                        }
                        className="h-11"
                      />
                    </Field>
                    <Field label="Sobrenome">
                      <Input
                        required
                        value={registerForm.lastName}
                        onChange={(event) =>
                          setRegisterForm((current) => ({
                            ...current,
                            lastName: event.target.value,
                          }))
                        }
                        className="h-11"
                      />
                    </Field>
                    <Field label="CPF">
                      <Input
                        required
                        value={registerForm.cpf}
                        onChange={(event) =>
                          setRegisterForm((current) => ({
                            ...current,
                            cpf: event.target.value,
                          }))
                        }
                        className="h-11"
                      />
                    </Field>
                    <Field label="Telefone">
                      <Input
                        required
                        value={registerForm.phone}
                        onChange={(event) =>
                          setRegisterForm((current) => ({
                            ...current,
                            phone: event.target.value,
                          }))
                        }
                        className="h-11"
                      />
                    </Field>
                    <Field label="E-mail">
                      <Input
                        type="email"
                        required
                        value={registerForm.email}
                        onChange={(event) =>
                          setRegisterForm((current) => ({
                            ...current,
                            email: event.target.value,
                          }))
                        }
                        className="h-11"
                      />
                    </Field>
                    <Field label="Senha">
                      <Input
                        type="password"
                        required
                        value={registerForm.password}
                        onChange={(event) =>
                          setRegisterForm((current) => ({
                            ...current,
                            password: event.target.value,
                          }))
                        }
                        className="h-11"
                      />
                    </Field>
                    <Field label="CEP">
                      <div className="relative">
                        <Input
                          required
                          value={registerForm.zipCode}
                          onBlur={handleCepBlur}
                          onChange={(event) =>
                            setRegisterForm((current) => ({
                              ...current,
                              zipCode: event.target.value,
                            }))
                          }
                          className="h-11 pr-10"
                        />
                        {cepLoading ? (
                          <Loader2 className="absolute right-3 top-3 size-5 animate-spin text-primary" />
                        ) : null}
                      </div>
                    </Field>
                    <Field label="Rua">
                      <Input
                        required
                        value={registerForm.address}
                        onChange={(event) =>
                          setRegisterForm((current) => ({
                            ...current,
                            address: event.target.value,
                          }))
                        }
                        className="h-11"
                      />
                    </Field>
                    <Field label="Número">
                      <Input
                        required
                        value={registerForm.addressNumber}
                        onChange={(event) =>
                          setRegisterForm((current) => ({
                            ...current,
                            addressNumber: event.target.value,
                          }))
                        }
                        className="h-11"
                      />
                    </Field>
                    <Field label="Bairro">
                      <Input
                        required
                        value={registerForm.province}
                        onChange={(event) =>
                          setRegisterForm((current) => ({
                            ...current,
                            province: event.target.value,
                          }))
                        }
                        className="h-11"
                      />
                    </Field>
                    <Field label="Cidade">
                      <Input
                        required
                        value={registerForm.city}
                        onChange={(event) =>
                          setRegisterForm((current) => ({
                            ...current,
                            city: event.target.value,
                          }))
                        }
                        className="h-11"
                      />
                    </Field>
                    <Field label="Estado">
                      <select
                        required
                        value={registerForm.state}
                        onChange={(event) =>
                          setRegisterForm((current) => ({
                            ...current,
                            state: event.target.value,
                          }))
                        }
                        className="h-11 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      >
                        {stateOptions.map((state) => (
                          <option key={state} value={state}>
                            {state}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="País">
                      <Input
                        required
                        value={registerForm.country}
                        onChange={(event) =>
                          setRegisterForm((current) => ({
                            ...current,
                            country: event.target.value,
                          }))
                        }
                        className="h-11"
                      />
                    </Field>
                  </div>
                  <Button
                    type="submit"
                    className="h-12 w-full rounded-xl"
                    disabled={authLoading}
                  >
                    {authLoading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : null}
                    Criar conta e pedido
                  </Button>
                </form>
              )}
            </div>
          ) : null}

          {step === "payment" && orderResponse ? (
            <div className="mx-auto max-w-4xl space-y-6">
              {isPaidStatus(paymentStatus) ? (
                <div className="rounded-[1.5rem] border border-[#147b29]/20 bg-[#147b29]/5 p-6 text-center">
                  <CheckCircle2 className="mx-auto size-14 text-[#147b29]" />
                  <h2 className="mt-4 font-heading text-3xl font-semibold tracking-[-0.03em] text-foreground">
                    Pagamento feito com sucesso
                  </h2>
                  <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
                    As instruções de login serão encaminhadas no email e
                    entraremos em contato.
                  </p>
                  {paymentStatus?.latest_charge?.payment_receipt_url ? (
                    <a
                      href={paymentStatus.latest_charge.payment_receipt_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border bg-white px-5 text-sm font-semibold text-foreground transition hover:bg-muted"
                    >
                      <ReceiptText className="size-4" />
                      Ver recibo
                    </a>
                  ) : null}
                </div>
              ) : isExpiredStatus(paymentStatus) ? (
                <div className="rounded-[1.5rem] border border-destructive/20 bg-destructive/5 p-6 text-center">
                  <h2 className="font-heading text-3xl font-semibold tracking-[-0.03em] text-foreground">
                    Pagamento expirado
                  </h2>
                  <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
                    O QR code expirou. Reinicie a seleção para gerar um novo
                    pedido.
                  </p>
                  <Button
                    type="button"
                    className="mt-5 h-11 rounded-full px-5"
                    onClick={resetFlow}
                  >
                    Reiniciar checkout
                  </Button>
                </div>
              ) : (
                <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
                  <div className="rounded-[1.4rem] border border-border bg-white p-5 text-center shadow-sm">
                    {getQrCode(orderResponse) ? (
                      <Image
                        src={`data:image/png;base64,${getQrCode(orderResponse)}`}
                        alt="QR code PIX"
                        width={260}
                        height={260}
                        unoptimized
                        className="mx-auto aspect-square w-full max-w-[260px] rounded-xl border border-border bg-white p-3"
                      />
                    ) : (
                      <div className="flex aspect-square w-full items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 text-sm text-muted-foreground">
                        QR code não retornado.
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 rounded-[1.4rem] border border-border bg-white p-5 shadow-sm">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                        Pagamento PIX
                      </p>
                      <h2 className="mt-2 font-heading text-3xl font-semibold tracking-[-0.03em] text-foreground">
                        {formatPrice(
                          paymentStatus?.latest_charge?.amount_gross ??
                            getPaymentValue(orderResponse)
                        )}
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {getPaymentDescription(orderResponse)}
                      </p>
                    </div>

                    <div className="rounded-xl border border-border bg-muted/30 p-4">
                      <p className="text-sm text-muted-foreground">Expiração</p>
                      <p className="mt-1 font-semibold text-foreground">
                        {formatExpirationDate(
                          getPaymentExpiration(orderResponse, paymentStatus)
                        )}
                      </p>
                    </div>

                    <div className="rounded-xl border border-border bg-muted/30 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-foreground">
                          Pix copia e cola
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="rounded-lg"
                          onClick={handleCopyPix}
                          disabled={!getCopyPaste(orderResponse)}
                        >
                          <Copy className="size-4" />
                        </Button>
                      </div>
                      <p className="mt-3 max-h-24 overflow-y-auto break-all text-xs leading-5 text-muted-foreground">
                        {getCopyPaste(orderResponse) || "Código não retornado."}
                      </p>
                      {copyFeedback ? (
                        <p className="mt-2 text-xs font-semibold text-primary">
                          Código copiado.
                        </p>
                      ) : null}
                    </div>

                    {orderResponse.contract?.contract_file_url ? (
                      <a
                        href={orderResponse.contract.contract_file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm font-semibold text-primary transition hover:bg-primary/10"
                      >
                        Ao continuar, você aceita o contrato da matrícula.
                        <ExternalLink className="size-4" />
                      </a>
                    ) : null}

                    {paymentError ? (
                      <p className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                        {paymentError}
                      </p>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );

  if (mode === "page") {
    return content;
  }

  return (
    <Dialog open={open} onOpenChange={handleModalOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-5xl rounded-[1.8rem] border border-border bg-white p-0 sm:max-w-5xl"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="max-h-[85vh] overflow-y-auto p-6 sm:p-8">{content}</div>
      </DialogContent>
    </Dialog>
  );
}
