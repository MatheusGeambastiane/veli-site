"use client";

import Image from "next/image";
import {
  FormEvent,
  MouseEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Copy,
  CreditCard,
  Eye,
  EyeOff,
  Loader2,
  Moon,
  ReceiptText,
  Tag,
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
import { CreditCardPaymentForm } from "@/features/checkout/credit-card-payment-form";
import { GoogleSignInButton } from "@/features/checkout/google-sign-in-button";
import { ProfileCompletionForm } from "@/features/checkout/profile-completion-form";
import { checkoutService } from "@/features/checkout/services/checkout-service";
import { notifyAuthSessionChanged } from "@/shared/lib/auth-session";
import {
  checkoutCartActionEvent,
  clearCheckoutCart,
  consumeCheckoutCartIntent,
  readCheckoutCart,
  saveCheckoutCart,
  type CheckoutCartAction,
  type CheckoutCartItem,
} from "@/shared/lib/checkout-cart";
import type {
  ApiError,
  CouponPreview,
  HotsiteAuthenticatedUser,
  HotsiteBillingOption,
  HotsiteCheckoutLanguage,
  HotsiteCheckoutOffer,
  HotsiteOffer,
  HotsiteOrderPayload,
  HotsiteOrderResponse,
  HotsitePaymentStatusResponse,
  HotsiteStartCardPaymentPayload,
  UpdateHotsiteUserPayload,
} from "@/shared/types";
import { trackAnalyticsEvent } from "@/shared/analytics/analytics";

type CheckoutStep = "language" | "offer" | "selection" | "account" | "payment";
type ClassChoiceMode = "class" | "period";
type AuthMode = "login" | "register";
type AuthOrigin = "checkout" | "cart";
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
  confirmPassword: string;
  zipCode: string;
  address: string;
  addressNumber: string;
  province: string;
  city: string;
  state: string;
  country: string;
};

const checkoutSessionKey = "veli.checkout.selection";
const emailDomains = ["gmail.com", "outlook.com", "hotmail.com", "icloud.com"];

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

const checkoutJourney = [
  { label: "Seu curso", description: "Idioma e plano" },
  { label: "Seu horário", description: "Turma e valor" },
  { label: "Finalizar", description: "Identificação" },
];

function getJourneyStep(step: CheckoutStep) {
  if (step === "language" || step === "offer") return 0;
  if (step === "selection") return 1;
  return 2;
}

function formatCpf(value: string) {
  return value
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function formatPhone(value: string) {
  return value
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d)(\d{4})$/, "$1-$2");
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(value.trim());
}

function getPasswordStrength(value: string) {
  const score = [
    value.length >= 8,
    /[a-z]/.test(value),
    /[A-Z]/.test(value),
    /\d/.test(value),
    /[^A-Za-z0-9]/.test(value),
  ].filter(Boolean).length;

  if (score <= 1) {
    return { level: 1, label: "Fraca", color: "bg-destructive" };
  }

  if (score === 2) {
    return { level: 2, label: "Razoável", color: "bg-orange-500" };
  }

  if (score === 3) {
    return { level: 3, label: "Boa", color: "bg-amber-400" };
  }

  return { level: 4, label: "Forte", color: "bg-emerald-600" };
}

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
    return option.type === "recurring"
      ? "Cobrança mensal no cartão"
      : "Pagamento no cartão";
  }

  return option.type === "recurring" ? "Cobrança mensal" : "Pagamento único";
}

function isCreditCardOption(option?: HotsiteBillingOption | null) {
  return Boolean(
    option &&
      (option.billing_method === "credit_card" ||
        ["MONTHLY_CREDIT_CARD", "UPFRONT_CREDIT_CARD"].includes(option.code))
  );
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

function isFailedStatus(status: HotsitePaymentStatusResponse | null) {
  if (!status) {
    return false;
  }

  return [status.payment_status, status.checkout_status, status.order_status].some(
    (value) =>
      ["failed", "rejected", "denied", "cancelled", "canceled"].includes(
        value?.toLowerCase()
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
  const placementSelection = useRef<{ languageId: number; level: string; applied: boolean } | null>(null);
  const [placementNotice, setPlacementNotice] = useState<string | null>(null);
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
  const [authOrigin, setAuthOrigin] = useState<AuthOrigin>("checkout");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registerEmailTouched, setRegisterEmailTouched] = useState(false);
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);
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
    confirmPassword: "",
    zipCode: "",
    address: "",
    addressNumber: "",
    province: "",
    city: "",
    state: "SP",
    country: "Brasil",
  });
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [hasAuthenticatedSession, setHasAuthenticatedSession] = useState(false);
  const [googleProfileUser, setGoogleProfileUser] =
    useState<HotsiteAuthenticatedUser | null>(null);
  const [orderPayload, setOrderPayload] = useState<HotsiteOrderPayload | null>(
    null
  );
  const [orderResponse, setOrderResponse] =
    useState<HotsiteOrderResponse | null>(null);
  const [paymentStatus, setPaymentStatus] =
    useState<HotsitePaymentStatusResponse | null>(null);
  const [cardPaymentSubmitted, setCardPaymentSubmitted] = useState(false);
  const [languagesLoading, setLanguagesLoading] = useState(false);
  const [offersLoading, setOffersLoading] = useState(false);
  const [offerDetailLoading, setOfferDetailLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [cardPaymentLoading, setCardPaymentLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [pixContractAccepted, setPixContractAccepted] = useState(false);
  const [languagesError, setLanguagesError] = useState<string | null>(null);
  const [offersError, setOffersError] = useState<string | null>(null);
  const [offerDetailError, setOfferDetailError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [couponPreview, setCouponPreview] = useState<CouponPreview | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [showCoupon, setShowCoupon] = useState(false);
  const [registerStage, setRegisterStage] = useState<"identity" | "address">(
    "identity"
  );
  const [languagesReloadKey, setLanguagesReloadKey] = useState(0);
  const [offersReloadKey, setOffersReloadKey] = useState(0);
  const [offerDetailReloadKey, setOfferDetailReloadKey] = useState(0);

  const shouldLoadLanguages = mode === "page" || open;
  const registerEmailInvalid =
    registerEmailTouched && !isValidEmail(registerForm.email);
  const passwordStrength = useMemo(
    () => getPasswordStrength(registerForm.password),
    [registerForm.password]
  );
  const passwordsDoNotMatch =
    confirmPasswordTouched &&
    registerForm.password !== registerForm.confirmPassword;
  const registerEmailSuggestions = useMemo(() => {
    const email = registerForm.email.trim();
    const emailParts = email.split("@");
    const localPart = emailParts[0];

    if (!localPart || emailParts.length > 2) {
      return [];
    }

    const domainFragment = emailParts[1]?.toLowerCase() ?? "";

    return emailDomains
      .filter((domain) => domain.startsWith(domainFragment))
      .map((domain) => `${localPart}@${domain}`)
      .filter((suggestion) => suggestion.toLowerCase() !== email.toLowerCase());
  }, [registerForm.email]);
  const selectedBilling = useMemo(
    () =>
      offerDetail?.billing_options.find(
        (option) => option.code === selectedBillingCode
      ) ?? null,
    [offerDetail, selectedBillingCode]
  );
  const activeCouponPreview =
    couponPreview?.billing_option_code === selectedBillingCode
      ? couponPreview
      : null;
  const isSelectedCreditCard = isCreditCardOption(selectedBilling);
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
    (classChoiceMode === "class" ? Boolean(selectedClassId) : Boolean(selectedPeriod));
  const title = useMemo(() => {
    if (step === "language") {
      return "Vamos montar sua matrícula";
    }

    if (step === "offer") {
      return "Escolha seu curso";
    }

    if (step === "selection") {
      return "Qual horário funciona melhor?";
    }

    if (step === "account") {
      return googleProfileUser ? "Só mais alguns dados" : "Finalize sua matrícula";
    }

    if (isPaidStatus(paymentStatus)) {
      return "Matrícula confirmada";
    }

    return isSelectedCreditCard ? "Pague com segurança" : "Conclua com PIX";
  }, [googleProfileUser, isSelectedCreditCard, paymentStatus, step]);
  const currentJourneyStep = getJourneyStep(step);

  useEffect(() => {
    if (mode === "page" || open) {
      trackAnalyticsEvent({
        event_type: "checkout_step_viewed",
        metadata: {
          step,
          offer_id: selectedOfferSummary?.id,
          offer_name: selectedOfferSummary ? getCourseName(selectedOfferSummary) : undefined,
        },
      });
    }
  }, [mode, open, selectedOfferSummary, step]);

  useEffect(() => {
    if (isPaidStatus(paymentStatus)) {
      trackAnalyticsEvent({
        event_type: "checkout_completed",
        metadata: {
          order_id: orderResponse?.order_id,
          offer_id: selectedOfferSummary?.id,
          offer_name: selectedOfferSummary ? getCourseName(selectedOfferSummary) : undefined,
        },
      });
    }
  }, [orderResponse?.order_id, paymentStatus, selectedOfferSummary]);

  useEffect(() => {
    let cancelled = false;

    async function restoreCart() {
      await Promise.resolve();
      if (mode === "page") {
        const params = new URLSearchParams(window.location.search);
        const languageId = Number(params.get("language"));
        const level = params.get("level")?.toUpperCase() ?? "";
        if (Number.isSafeInteger(languageId) && languageId > 0 && /^[ABC][12]$/.test(level)) {
          placementSelection.current = { languageId, level, applied: false };
          return;
        }
      }
      const storedItem = readCheckoutCart();

      let intent: "continue" | "login" | null = null;

      try {
        intent = consumeCheckoutCartIntent();
      } catch {
        intent = null;
      }

      if (!intent && window.location.hash === "#login") {
        intent = "login";
      }

      if (window.location.hash === "#login") {
        window.history.replaceState(
          null,
          "",
          `${window.location.pathname}${window.location.search}`
        );
      }

      if (!cancelled && storedItem) {
        setSelectedLanguage(storedItem.language);
        setSelectedOfferSummary(storedItem.offer);
        setAuthOrigin(intent === "login" ? "cart" : "checkout");
        setStep(intent === "login" ? "account" : "selection");
      }
    }

    const applyCartAction = (action: CheckoutCartAction) => {
      const storedItem = readCheckoutCart();

      if (action === "removed") {
        setSelectedLanguage(null);
        setSelectedOfferSummary(null);
        setOfferDetail(null);
        setOrderPayload(null);
        setStep("language");
        return;
      }

      if (!storedItem) {
        return;
      }

      setSelectedLanguage(storedItem.language);
      setSelectedOfferSummary(storedItem.offer);
      setOfferDetail(null);
      setOfferDetailError(null);
      setAuthOrigin(action === "login" ? "cart" : "checkout");
      setAuthMode("login");
      setFormError(null);
      setStep(action === "login" ? "account" : "selection");
    };

    const handleCartAction = (event: Event) => {
      try {
        consumeCheckoutCartIntent();
      } catch {
        // O evento em memória já contém a intenção necessária.
      }
      applyCartAction((event as CustomEvent<CheckoutCartAction>).detail);
    };

    void restoreCart();
    window.addEventListener(checkoutCartActionEvent, handleCartAction);

    return () => {
      cancelled = true;
      window.removeEventListener(checkoutCartActionEvent, handleCartAction);
    };
  }, [mode]);

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      try {
        const session = await checkoutService.getSessionStatus();

        if (!cancelled) {
          setHasAuthenticatedSession(session.authenticated);
        }
      } catch {
        if (!cancelled) {
          setHasAuthenticatedSession(false);
        }
      }
    }

    void loadSession();

    return () => {
      cancelled = true;
    };
  }, []);

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
          const placement = placementSelection.current;
          if (placement && !placement.applied) {
            const language = response.data.results.find((item) => item.id === placement.languageId);
            if (language) {
              setSelectedLanguage(language);
              setStep("offer");
            } else {
              placement.applied = true;
              setPlacementNotice("Não há turmas disponíveis para o idioma do seu teste no momento.");
            }
          }
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
        const placement = placementSelection.current;
        const shouldApply = placement && !placement.applied && placement.languageId === languageId;
        const response = await checkoutService.getOffersByLanguage(languageId, shouldApply ? placement.level : undefined);

        if (!cancelled) {
          setOffers(response.data.results);
          if (shouldApply) {
            placement.applied = true;
            const offer = response.data.results.find((item) =>
              item.course.language.id === languageId && item.course.level.level.trim().toUpperCase() === placement.level
            );
            if (offer) {
              try {
                saveCheckoutCart({ version: 1, language: selectedLanguage!, offer, savedAt: new Date().toISOString() });
              } catch {
                setFormError("A turma foi selecionada, mas não pôde ser salva neste navegador.");
              }
              setSelectedOfferSummary(offer);
              setClassChoiceMode("class");
              setStep("selection");
              trackAnalyticsEvent({ event_type: "offer_viewed", metadata: { offer_id: offer.id, origin: "placement_test", level: placement.level } });
            } else {
              setPlacementNotice(`Não há turmas disponíveis para o nível ${placement.level} no momento.`);
            }
          }
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
          const matchingClass = response.data.student_classes.find((item) =>
            selectedOfferSummary?.student_class_id
              ? item.id === selectedOfferSummary.student_class_id
              : item.course.id === selectedOfferSummary?.course.id
          );
          setSelectedClassId(matchingClass?.id ?? null);
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
    if (
      step !== "payment" ||
      !orderResponse?.order_id ||
      isPaidStatus(paymentStatus) ||
      (isSelectedCreditCard && !cardPaymentSubmitted)
    ) {
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

        if (
          !isPaidStatus(response.data) &&
          !isExpiredStatus(response.data) &&
          !isFailedStatus(response.data)
        ) {
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
  }, [
    authToken,
    cardPaymentSubmitted,
    isSelectedCreditCard,
    orderResponse?.order_id,
    paymentStatus,
    step,
  ]);

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
    setAuthOrigin("checkout");
    setShowLoginPassword(false);
    setShowRegisterPassword(false);
    setShowConfirmPassword(false);
    setShowCoupon(false);
    setRegisterStage("identity");
    setRegisterEmailTouched(false);
    setConfirmPasswordTouched(false);
    setAuthToken(null);
    setGoogleProfileUser(null);
    setOrderPayload(null);
    setOrderResponse(null);
    setPaymentStatus(null);
    setCardPaymentSubmitted(false);
    setCardPaymentLoading(false);
    setPixContractAccepted(false);
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
    placementSelection.current = null;
    setPlacementNotice(null);
    setSelectedLanguage(language);
    setSelectedOfferSummary(null);
    setOfferDetail(null);
    setOffers([]);
    setOffersError(null);
    setStep("offer");
  };

  const saveOfferToCart = (offer: HotsiteCheckoutOffer) => {
    if (!selectedLanguage) {
      return;
    }

    const item: CheckoutCartItem = {
      version: 1,
      language: selectedLanguage,
      offer,
      savedAt: new Date().toISOString(),
    };

    setFormError(null);

    try {
      saveCheckoutCart(item);
    } catch {
      setFormError(
        "A oferta foi adicionada, mas não pôde ser salva neste navegador."
      );
    }
  };

  const handleOfferSelect = (offer: HotsiteCheckoutOffer) => {
    trackAnalyticsEvent({
      event_type: "offer_viewed",
      metadata: { offer_id: offer.id, offer_name: getCourseName(offer) },
    });
    saveOfferToCart(offer);
    setSelectedOfferSummary(offer);
    setOfferDetail(null);
    setSelectedClassId(null);
    setSelectedPeriod(null);
    setSelectedBillingCode(null);
    setPaymentBillingType("one_time");
    setClassChoiceMode("class");
    setCardPaymentSubmitted(false);
    setStep("selection");
  };

  const buildOrderPayload = () => {
    if (!offerDetail || !selectedBilling) {
      return null;
    }

    const creditCardOption = isCreditCardOption(selectedBilling);
    const payload: HotsiteOrderPayload = {
      offer_id: offerDetail.id,
      billing_option_code: selectedBilling.code,
      ...(activeCouponPreview?.coupon_code
        ? { coupon_code: activeCouponPreview.coupon_code }
        : {}),
    };

    if (classChoiceMode === "class" && selectedClassId) {
      payload.student_class_id = selectedClassId;

      if (creditCardOption) {
        payload.preference_period = [];
      }
    }

    if (classChoiceMode === "period" && selectedPeriod) {
      payload.preference_period = [selectedPeriod];
    }

    if (!creditCardOption) {
      payload.installments = 1;
    }

    return payload;
  };

  const handleApplyCoupon = async () => {
    if (!offerDetail || !selectedBilling || !couponCode.trim()) {
      setCouponError("Informe um cupom e selecione a forma de pagamento.");
      return;
    }
    setCouponLoading(true);
    setCouponError(null);
    try {
      const response = await checkoutService.validateCoupon(offerDetail.id, {
        coupon_code: couponCode.trim().toUpperCase(),
        billing_option_code: selectedBilling.code,
      });
      setCouponPreview(response.data);
      setCouponCode(response.data.coupon_code);
    } catch (error) {
      setCouponPreview(null);
      setCouponError(getApiErrorMessage(error));
    } finally {
      setCouponLoading(false);
    }
  };

  const handleContinueToAccount = () => {
    const payload = buildOrderPayload();

    if (!payload || !canContinueToAccount) {
      setFormError("Selecione turma ou turno e uma forma de pagamento.");
      return;
    }

    setFormError(null);
    setAuthOrigin("checkout");
    setOrderPayload(payload);
    sessionStorage.setItem(checkoutSessionKey, JSON.stringify(payload));

    if (hasAuthenticatedSession) {
      setAuthLoading(true);
      void createOrderAfterAuth()
        .catch((error) => setFormError(getApiErrorMessage(error)))
        .finally(() => setAuthLoading(false));
      return;
    }

    setStep("account");
  };

  const createOrderAfterAuth = async (token?: string) => {
    const storedPayload =
      orderPayload ??
      (JSON.parse(
        sessionStorage.getItem(checkoutSessionKey) ?? "null"
      ) as HotsiteOrderPayload | null);

    if (!storedPayload) {
      throw new Error("Seleção do pedido não encontrada. Volte e escolha a oferta.");
    }

    const order = await checkoutService.createOrder(storedPayload, token);
    try {
      clearCheckoutCart();
      window.sessionStorage.removeItem(checkoutSessionKey);
    } catch {
      // O pedido já foi criado; falhas de armazenamento não interrompem o fluxo.
    }
    setOrderResponse(order.data);
    setPaymentStatus(null);
    setPaymentError(null);
    setCardPaymentSubmitted(false);
    setPixContractAccepted(false);
    setStep("payment");
  };

  const handleStartCardPayment = async (
    payload: HotsiteStartCardPaymentPayload
  ) => {
    if ((!authToken && !hasAuthenticatedSession) || !orderResponse?.order_id) {
      setPaymentError(
        "Não foi possível identificar a autenticação ou o pedido."
      );
      return;
    }

    setCardPaymentLoading(true);
    setPaymentError(null);

    try {
      await checkoutService.startCardPayment(
        orderResponse.order_id,
        payload,
        authToken ?? undefined
      );
      setCardPaymentSubmitted(true);

      try {
        const response = await checkoutService.getPaymentStatus(
          orderResponse.order_id,
          authToken ?? undefined
        );
        setPaymentStatus(response.data);
      } catch {
        // O polling continuará consultando o status após o pagamento ser enviado.
      }
    } catch (error) {
      setPaymentError(getApiErrorMessage(error));
    } finally {
      setCardPaymentLoading(false);
    }
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthLoading(true);
    setFormError(null);

    try {
      await checkoutService.authenticateUser(loginForm);
      setAuthToken(null);
      setHasAuthenticatedSession(true);
      notifyAuthSessionChanged();

      if (authOrigin === "cart") {
        setAuthOrigin("checkout");
        setStep("selection");
        return;
      }

      await createOrderAfterAuth();
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleContinueRegistration = (event: MouseEvent<HTMLButtonElement>) => {
    if (!event.currentTarget.form?.reportValidity()) {
      return;
    }

    setRegisterEmailTouched(true);
    setConfirmPasswordTouched(true);
    setFormError(null);

    if (
      !registerForm.firstName.trim() ||
      !registerForm.lastName.trim() ||
      registerForm.cpf.replace(/\D/g, "").length !== 11 ||
      registerForm.phone.replace(/\D/g, "").length < 10
    ) {
      setFormError("Preencha seus dados pessoais para continuar.");
      return;
    }

    if (!isValidEmail(registerForm.email)) {
      setFormError("Informe um e-mail válido.");
      return;
    }

    if (registerForm.password.length < 8) {
      setFormError("Crie uma senha com pelo menos 8 caracteres.");
      return;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      setFormError("As senhas não coincidem.");
      return;
    }

    setRegisterStage("address");
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  };

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setRegisterEmailTouched(true);
    setConfirmPasswordTouched(true);

    if (!isValidEmail(registerForm.email)) {
      setFormError("Informe um e-mail válido.");
      return;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      setFormError("As senhas não coincidem.");
      return;
    }

    setAuthLoading(true);

    try {
      await checkoutService.createUser({
        first_name: registerForm.firstName,
        last_name: registerForm.lastName,
        cpf: registerForm.cpf.replace(/\D/g, ""),
        email: registerForm.email,
        password: registerForm.password,
        phone: registerForm.phone.replace(/\D/g, ""),
        zip_code: registerForm.zipCode.replace(/\D/g, ""),
        city: registerForm.city,
        state: registerForm.state,
        country: registerForm.country,
        address: registerForm.address,
        address_number: registerForm.addressNumber,
        province: registerForm.province,
      });
      setAuthToken(null);
      setHasAuthenticatedSession(true);
      notifyAuthSessionChanged();

      if (authOrigin === "cart") {
        setAuthOrigin("checkout");
        setStep("selection");
        return;
      }

      await createOrderAfterAuth();
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleCredential = async (credential: string) => {
    if (authLoading) {
      return;
    }

    setAuthLoading(true);
    setFormError(null);

    try {
      const response = await checkoutService.authenticateWithGoogle({
        credential,
      });

      setAuthToken(null);
      setHasAuthenticatedSession(true);
      notifyAuthSessionChanged();

      if (response.data.profile_completed !== true) {
        setGoogleProfileUser(response.data);
        return;
      }

      if (authOrigin === "cart") {
        setAuthOrigin("checkout");
        setStep("selection");
        return;
      }

      await createOrderAfterAuth();
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleCompleteGoogleProfile = async (
    payload: UpdateHotsiteUserPayload
  ) => {
    setAuthLoading(true);
    setFormError(null);

    try {
      await checkoutService.updateCurrentUser(payload);
      notifyAuthSessionChanged();

      if (authOrigin === "cart") {
        setGoogleProfileUser(null);
        setAuthOrigin("checkout");
        setStep("selection");
        return;
      }

      await createOrderAfterAuth();
      setGoogleProfileUser(null);
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
    <aside className="space-y-5 rounded-2xl border border-[#dce4ee] bg-white p-5 shadow-[0_18px_50px_rgba(23,43,77,0.08)] lg:sticky lg:top-6 lg:self-start">
      <div className="border-b border-border pb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Sua matrícula
        </p>
        <p className="mt-2 text-sm font-semibold text-foreground">
          {getCourseName(offerDetail)}
        </p>
        {activeCouponPreview ? (
          <p className="mt-4 text-sm text-muted-foreground line-through">
            {formatPrice(activeCouponPreview.amount_original)}
          </p>
        ) : null}
        <p className={`${activeCouponPreview ? "mt-0.5" : "mt-4"} text-3xl font-semibold tracking-[-0.04em] text-foreground`}>
          {formatPrice(
            activeCouponPreview?.amount_total ??
              selectedBilling?.price ??
              offerDetail?.price
          )}
        </p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {selectedBilling
            ? getBillingDescription(selectedBilling)
            : "Escolha como prefere pagar"}
        </p>
        {activeCouponPreview ? (
          <p className="mt-2 text-xs font-semibold text-emerald-700">
            Cupom {activeCouponPreview.coupon_code} aplicado · economia de{" "}
            {formatPrice(activeCouponPreview.discount_amount)}
          </p>
        ) : null}
      </div>

      <div className="space-y-4 text-sm">
        <div>
          <p className="text-muted-foreground">
          {classChoiceMode === "class" ? "Turma escolhida" : "Turno escolhido"}
          </p>
          <p className="mt-1 font-semibold text-foreground">
            {classChoiceMode === "class"
              ? selectedClass
                ? `${formatDays(selectedClass.days_of_week)} · ${formatTime(selectedClass.time)}`
                : "Selecione uma turma"
              : periodOptions.find((period) => period.value === selectedPeriod)
                  ?.label ?? "Selecione um turno"}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Forma de pagamento</p>
          <p className="mt-1 font-semibold text-foreground">
            {selectedBilling
              ? getBillingLabel(selectedBilling)
              : "Selecione uma opção"}
          </p>
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 text-left text-sm font-semibold text-foreground"
          aria-expanded={showCoupon}
          onClick={() => setShowCoupon((current) => !current)}
        >
          <span className="flex items-center gap-2">
            <Tag className="size-4 text-primary" />
            Tenho um cupom
          </span>
          <ChevronDown
            className={`size-4 text-muted-foreground transition ${showCoupon ? "rotate-180" : ""}`}
          />
        </button>
        {showCoupon ? (
          <div className="mt-3 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex gap-2">
              <Input
                id="checkout-coupon"
                aria-label="Código do cupom"
                value={couponCode}
                onChange={(event) => {
                  setCouponCode(event.target.value.toUpperCase());
                  setCouponPreview(null);
                  setCouponError(null);
                }}
                placeholder="CÓDIGO"
                className="font-mono uppercase"
              />
              <Button
                type="button"
                variant="outline"
                disabled={couponLoading || !selectedBilling}
                onClick={handleApplyCoupon}
              >
                {couponLoading ? <Loader2 className="size-4 animate-spin" /> : "Aplicar"}
              </Button>
            </div>
            {couponError ? (
              <p className="mt-2 text-xs text-destructive">{couponError}</p>
            ) : null}
          </div>
        ) : null}
      </div>

      <Button
        type="button"
        className="h-12 w-full rounded-xl shadow-[0_10px_24px_rgba(0,100,224,0.2)]"
        disabled={!canContinueToAccount || authLoading}
        onClick={handleContinueToAccount}
      >
        {authLoading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <CreditCard className="size-4" />
        )}
        {hasAuthenticatedSession ? "Criar pedido" : "Continuar"}
        <ArrowRight className="size-4" />
      </Button>

      <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-primary" />
        Seus dados e seu pagamento são protegidos durante todo o processo.
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
        <h3 className="text-lg font-semibold tracking-[-0.02em]">
          {titleText}
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {options.map((option) => {
            const selected = selectedBillingCode === option.code;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setSelectedBillingCode(option.code)}
                className={`rounded-xl border p-4 text-left transition ${
                  selected
                    ? "border-primary bg-accent shadow-sm"
                    : "border-border bg-white hover:border-primary/50"
                }`}
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
                <p className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-foreground">
                  {formatPrice(option.price)}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    ) : null;

  const content = (
    <div
      className={
        mode === "page"
          ? "mx-auto w-full max-w-[1240px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-14"
          : undefined
      }
    >
      <section
        className={
          mode === "page"
            ? "mx-auto max-w-6xl"
            : "bg-white"
        }
      >
        <div className="mb-8 grid gap-7 lg:grid-cols-[1fr_560px] lg:items-end">
          <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                Matrícula Veli
              </p>
              <h1 className="mt-3 max-w-2xl font-heading text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl lg:text-[2.65rem] lg:leading-[1.08]">
                {title}
              </h1>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Etapa {currentJourneyStep + 1} de {checkoutJourney.length}
              </p>
          </div>

          <div>
            <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-[#e3eaf3] sm:hidden">
              <span
                className="block h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
                style={{
                  width: `${((currentJourneyStep + 1) / checkoutJourney.length) * 100}%`,
                }}
              />
            </div>
            <div className="hidden grid-cols-3 gap-3 sm:grid" role="list" aria-label="Progresso da matrícula">
                {checkoutJourney.map((journeyStep, index) => {
                  const isActive = index === currentJourneyStep;
                  const isComplete = index < currentJourneyStep;

                  return (
                    <div
                      key={journeyStep.label}
                      role="listitem"
                      className={`flex items-center gap-3 rounded-xl border px-3 py-3 transition-colors ${
                        isActive
                          ? "border-primary/30 bg-primary/[0.055]"
                          : "border-transparent"
                      }`}
                    >
                        <span
                          className={`flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition ${
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
                        <span className="min-w-0">
                          <span className={`block truncate text-xs font-semibold ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                            {journeyStep.label}
                          </span>
                          <span className="mt-0.5 block truncate text-[0.68rem] text-muted-foreground">
                            {journeyStep.description}
                          </span>
                        </span>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#dce4ee] bg-white p-5 shadow-[0_24px_70px_rgba(24,45,78,0.08)] sm:p-7 lg:p-8">
          {placementNotice ? <p role="status" className="mb-5 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">{placementNotice}</p> : null}
          {step === "language" ? (
            <div className="space-y-6">
              <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                Qual idioma você quer aprender? Depois mostramos os cursos e
                horários disponíveis para você.
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
                        className="group flex min-h-24 items-center gap-4 rounded-2xl border border-border bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-primary/60 hover:bg-primary/[0.035] hover:shadow-sm active:translate-y-0"
                      >
                        <Image
                          src={language.image}
                          alt={language.name}
                          width={64}
                          height={64}
                          className="size-16 rounded-full border border-border object-cover"
                        />
                        <div>
                          <p className="text-lg font-semibold tracking-[-0.02em] text-foreground">
                            {language.name}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Ver cursos disponíveis
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-5 text-sm leading-6 text-muted-foreground">
                    Não encontramos idiomas disponíveis agora. Tente novamente
                    em alguns instantes ou fale com nosso suporte.
                  </div>
                )
              ) : null}
            </div>
          ) : null}

          {step === "offer" && selectedLanguage ? (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 self-start rounded-full px-5"
                  onClick={() => {
                    setStep("language");
                    setOffers([]);
                    setSelectedOfferSummary(null);
                  }}
                >
                  <ArrowLeft className="size-4" />
                  Trocar idioma
                </Button>
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
                        className="rounded-2xl border border-border bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-primary/60 hover:bg-primary/[0.025] hover:shadow-sm active:translate-y-0"
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
                              A partir de
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
                    Não encontramos cursos de {selectedLanguage.name} disponíveis
                    agora. Tente novamente em alguns instantes.
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
                <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
                  <div className="space-y-9">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <h2 className="text-xl font-semibold tracking-[-0.025em] text-foreground">
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
                              className={`rounded-xl border p-4 text-left transition ${
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
                              className={`rounded-xl border p-4 text-left transition ${
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
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-full px-5"
                onClick={() => {
                  setFormError(null);
                  setStep("selection");
                }}
              >
                <ArrowLeft className="size-4" />
                Voltar para seleção{" "}
                {classChoiceMode === "class" ? "da turma" : "do turno"}
              </Button>

              {googleProfileUser ? (
                <ProfileCompletionForm
                  key={googleProfileUser.id ?? googleProfileUser.email}
                  user={googleProfileUser}
                  submitting={authLoading}
                  error={formError}
                  submitLabel={
                    authOrigin === "cart"
                      ? "Salvar perfil e continuar"
                      : undefined
                  }
                  onSubmit={handleCompleteGoogleProfile}
                />
              ) : (
                <>
              <div className="flex flex-col gap-3 rounded-[1.3rem] border border-border bg-muted/30 p-4 sm:flex-row">
                <Button
                  type="button"
                  variant={authMode === "login" ? "default" : "outline"}
                  className="h-11 flex-1 rounded-xl"
                  disabled={authLoading}
                  onClick={() => {
                    setAuthMode("login");
                    setRegisterStage("identity");
                    setShowLoginPassword(false);
                    setFormError(null);
                  }}
                >
                  <UserRound className="size-4" />
                  Já tenho conta
                </Button>
                <Button
                  type="button"
                  variant={authMode === "register" ? "default" : "outline"}
                  className="h-11 flex-1 rounded-xl"
                  disabled={authLoading}
                  onClick={() => {
                    setAuthMode("register");
                    setRegisterStage("identity");
                    setShowLoginPassword(false);
                    setFormError(null);
                  }}
                >
                  <ShieldCheck className="size-4" />
                  Sou novo por aqui
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
                      autoComplete="username"
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
                    <div className="relative">
                      <Input
                        type={showLoginPassword ? "text" : "password"}
                        required
                        autoComplete="current-password"
                        value={loginForm.password}
                        onChange={(event) =>
                          setLoginForm((current) => ({
                            ...current,
                            password: event.target.value,
                          }))
                        }
                        className="h-11 pr-11"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1.5 top-1.5 text-muted-foreground"
                        aria-label={
                          showLoginPassword
                            ? "Ocultar senha"
                            : "Mostrar senha"
                        }
                        aria-pressed={showLoginPassword}
                        onClick={() =>
                          setShowLoginPassword((current) => !current)
                        }
                      >
                        {showLoginPassword ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </Button>
                    </div>
                  </Field>
                  <Button
                    type="submit"
                    className="h-12 w-full rounded-xl"
                    disabled={authLoading}
                  >
                    {authLoading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : null}
                    {authOrigin === "cart"
                      ? "Entrar e continuar"
                      : "Entrar e criar pedido"}
                  </Button>
                  <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    <span className="h-px flex-1 bg-border" />
                    ou
                    <span className="h-px flex-1 bg-border" />
                  </div>
                  <div className="rounded-xl bg-white">
                    <GoogleSignInButton
                      disabled={authLoading}
                      onCredential={handleGoogleCredential}
                      onError={setFormError}
                    />
                  </div>
                </form>
              ) : (
                <form
                  onSubmit={handleRegister}
                  className="space-y-6 rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6"
                >
                  <div className="flex items-start justify-between gap-4 border-b border-border pb-5">
                    <div>
                      <p className="text-lg font-semibold text-foreground">
                        {registerStage === "identity"
                          ? "Primeiro, seus dados"
                          : "Agora, seu endereço"}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {registerStage === "identity"
                          ? "Usaremos essas informações para identificar sua matrícula."
                          : "O CEP preenche a maior parte do endereço automaticamente."}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-primary/8 px-3 py-1 text-xs font-semibold text-primary">
                      {registerStage === "identity" ? "1 de 2" : "2 de 2"}
                    </span>
                  </div>

                  {registerStage === "identity" ? (
                    <>
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
                        inputMode="numeric"
                        autoComplete="off"
                        maxLength={14}
                        pattern="\d{3}\.\d{3}\.\d{3}-\d{2}"
                        title="Digite os 11 números do CPF"
                        placeholder="000.000.000-00"
                        value={registerForm.cpf}
                        onChange={(event) =>
                          setRegisterForm((current) => ({
                            ...current,
                            cpf: formatCpf(event.target.value),
                          }))
                        }
                        className="h-11"
                      />
                    </Field>
                    <Field label="Telefone">
                      <Input
                        required
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        maxLength={15}
                        pattern="\(\d{2}\) \d{4,5}-\d{4}"
                        title="Digite o telefone com DDD"
                        placeholder="(00) 00000-0000"
                        value={registerForm.phone}
                        onChange={(event) =>
                          setRegisterForm((current) => ({
                            ...current,
                            phone: formatPhone(event.target.value),
                          }))
                        }
                        className="h-11"
                      />
                    </Field>
                    <div className="sm:col-span-2">
                      <Field label="E-mail">
                        <div className="space-y-2">
                          <Input
                            type="email"
                            required
                            autoComplete="email"
                            inputMode="email"
                            maxLength={254}
                            pattern="^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$"
                            title="Digite um e-mail completo, incluindo @ e domínio"
                            placeholder="nome@exemplo.com"
                            value={registerForm.email}
                            aria-invalid={registerEmailInvalid}
                            aria-describedby={
                              registerEmailInvalid
                                ? "register-email-error"
                                : undefined
                            }
                            onBlur={() => setRegisterEmailTouched(true)}
                            onInvalid={() => setRegisterEmailTouched(true)}
                            onChange={(event) =>
                              setRegisterForm((current) => ({
                                ...current,
                                email: event.target.value,
                              }))
                            }
                            className="h-11"
                          />
                          {registerEmailInvalid ? (
                            <p
                              id="register-email-error"
                              className="text-sm font-medium text-destructive"
                              role="alert"
                            >
                              E-mail inválido. Use o formato{" "}
                              nome@provedor.com.
                            </p>
                          ) : null}
                          {registerEmailSuggestions.length > 0 ? (
                            <div
                              className="flex flex-wrap gap-2"
                              aria-label="Sugestões de e-mail"
                            >
                              {registerEmailSuggestions.map((suggestion) => (
                                <Button
                                  key={suggestion}
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="max-w-full rounded-full px-3 text-xs"
                                  onClick={() => {
                                    setRegisterForm((current) => ({
                                      ...current,
                                      email: suggestion,
                                    }));
                                    setRegisterEmailTouched(true);
                                  }}
                                >
                                  <span className="truncate">{suggestion}</span>
                                </Button>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </Field>
                    </div>
                    <Field label="Senha">
                      <div className="space-y-3">
                        <div className="relative">
                          <Input
                            type={showRegisterPassword ? "text" : "password"}
                            required
                            minLength={8}
                            autoComplete="new-password"
                            value={registerForm.password}
                            onChange={(event) =>
                              setRegisterForm((current) => ({
                                ...current,
                                password: event.target.value,
                              }))
                            }
                            className="h-11 pr-11"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1.5 top-1.5 text-muted-foreground"
                            aria-label={
                              showRegisterPassword
                                ? "Ocultar senha"
                                : "Mostrar senha"
                            }
                            aria-pressed={showRegisterPassword}
                            onClick={() =>
                              setShowRegisterPassword((current) => !current)
                            }
                          >
                            {showRegisterPassword ? (
                              <EyeOff className="size-4" />
                            ) : (
                              <Eye className="size-4" />
                            )}
                          </Button>
                        </div>
                        {registerForm.password ? (
                          <div
                            className="space-y-2"
                            role="status"
                            aria-live="polite"
                          >
                            <div className="flex items-center justify-between gap-3 text-xs">
                              <span className="text-muted-foreground">
                                Força da senha
                              </span>
                              <span className="font-semibold text-foreground">
                                {passwordStrength.label}
                              </span>
                            </div>
                            <div className="grid grid-cols-4 gap-1.5">
                              {[1, 2, 3, 4].map((level) => (
                                <span
                                  key={level}
                                  className={`h-1.5 rounded-full ${
                                    level <= passwordStrength.level
                                      ? passwordStrength.color
                                      : "bg-muted"
                                  }`}
                                />
                              ))}
                            </div>
                            <p className="text-xs leading-5 text-muted-foreground">
                              Use 8 ou mais caracteres, com letras maiúsculas e
                              minúsculas, número e símbolo.
                            </p>
                          </div>
                        ) : null}
                      </div>
                    </Field>
                    <Field label="Confirmar senha">
                      <div className="space-y-2">
                        <div className="relative">
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            required
                            minLength={8}
                            autoComplete="new-password"
                            value={registerForm.confirmPassword}
                            aria-invalid={passwordsDoNotMatch}
                            aria-describedby={
                              passwordsDoNotMatch
                                ? "confirm-password-error"
                                : undefined
                            }
                            onBlur={() => setConfirmPasswordTouched(true)}
                            onChange={(event) =>
                              setRegisterForm((current) => ({
                                ...current,
                                confirmPassword: event.target.value,
                              }))
                            }
                            className="h-11 pr-11"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1.5 top-1.5 text-muted-foreground"
                            aria-label={
                              showConfirmPassword
                                ? "Ocultar confirmação da senha"
                                : "Mostrar confirmação da senha"
                            }
                            aria-pressed={showConfirmPassword}
                            onClick={() =>
                              setShowConfirmPassword((current) => !current)
                            }
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="size-4" />
                            ) : (
                              <Eye className="size-4" />
                            )}
                          </Button>
                        </div>
                        {passwordsDoNotMatch ? (
                          <p
                            id="confirm-password-error"
                            className="text-sm font-medium text-destructive"
                            role="alert"
                          >
                            As senhas não coincidem.
                          </p>
                        ) : null}
                      </div>
                    </Field>
                  </div>
                  <Button
                    type="button"
                    className="h-12 w-full rounded-xl"
                    onClick={handleContinueRegistration}
                  >
                    Continuar para o endereço
                    <ArrowRight className="size-4" />
                  </Button>
                    </>
                  ) : (
                    <>
                  <div className="grid gap-4 sm:grid-cols-2">
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
                  <div className="flex flex-col-reverse gap-3 sm:flex-row">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-12 rounded-xl sm:w-36"
                      disabled={authLoading}
                      onClick={() => {
                        setFormError(null);
                        setRegisterStage("identity");
                      }}
                    >
                      <ArrowLeft className="size-4" />
                      Voltar
                    </Button>
                    <Button
                      type="submit"
                      className="h-12 flex-1 rounded-xl"
                      disabled={authLoading || cepLoading}
                    >
                      {authLoading ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : null}
                      {authOrigin === "cart"
                        ? "Criar conta e continuar"
                        : "Criar conta e ir ao pagamento"}
                    </Button>
                  </div>
                    </>
                  )}
                </form>
              )}
                </>
              )}
            </div>
          ) : null}

          {step === "payment" && orderResponse ? (
            <div className="mx-auto max-w-4xl space-y-6">
              {isPaidStatus(paymentStatus) ? (
                <div className="rounded-[1.5rem] border border-[#147b29]/20 bg-[#147b29]/5 p-6 text-center">
                  <CheckCircle2 className="mx-auto size-14 text-[#147b29]" />
                  <h2 className="mt-4 font-heading text-3xl font-semibold tracking-[-0.03em] text-foreground">
                    Sua matrícula está confirmada
                  </h2>
                  <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
                    Enviamos os detalhes da matrícula por e-mail. Você já pode
                    acessar a área do aluno para acompanhar os próximos passos.
                  </p>
                  <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
                    {paymentStatus?.latest_charge?.payment_receipt_url ? (
                      <a
                        href={paymentStatus.latest_charge.payment_receipt_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border bg-white px-5 text-sm font-semibold text-foreground transition hover:bg-muted"
                      >
                        <ReceiptText className="size-4" />
                        Ver recibo
                      </a>
                    ) : null}
                    <a
                      href="https://aluno.escolaveli.com"
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/80"
                    >
                      <UserRound className="size-4" />
                      Acessar área do aluno
                    </a>
                  </div>
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
              ) : isFailedStatus(paymentStatus) && isSelectedCreditCard ? (
                <div className="rounded-[1.5rem] border border-destructive/20 bg-destructive/5 p-6 text-center">
                  <CreditCard className="mx-auto size-12 text-destructive" />
                  <h2 className="mt-4 font-heading text-3xl font-semibold tracking-[-0.03em] text-foreground">
                    Pagamento não aprovado
                  </h2>
                  <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
                    Revise os dados ou tente outro cartão.
                  </p>
                  <Button
                    type="button"
                    className="mt-5 h-11 rounded-full px-5"
                    onClick={() => {
                      setPaymentStatus(null);
                      setPaymentError(null);
                      setCardPaymentSubmitted(false);
                    }}
                  >
                    Tentar novamente
                  </Button>
                </div>
              ) : isSelectedCreditCard &&
                selectedBilling &&
                !cardPaymentSubmitted ? (
                <CreditCardPaymentForm
                  key={selectedBilling.code}
                  billingOption={selectedBilling}
                  contractUrl={orderResponse.contract?.contract_file_url}
                  loading={cardPaymentLoading}
                  error={paymentError}
                  onSubmit={handleStartCardPayment}
                />
              ) : isSelectedCreditCard ? (
                <div className="rounded-[1.5rem] border border-border bg-white p-8 text-center shadow-sm">
                  <Loader2 className="mx-auto size-12 animate-spin text-primary" />
                  <h2 className="mt-4 font-heading text-3xl font-semibold tracking-[-0.03em] text-foreground">
                    Processando pagamento
                  </h2>
                  <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
                    Os dados foram enviados. Aguarde enquanto confirmamos o
                    pagamento com a operadora do cartão.
                  </p>
                  {paymentError ? (
                    <p className="mx-auto mt-5 max-w-xl rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                      {paymentError}
                    </p>
                  ) : null}
                </div>
              ) : !pixContractAccepted ? (
                <div className="mx-auto max-w-xl rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
                  <ShieldCheck className="size-10 text-primary" />
                  <h2 className="mt-5 text-2xl font-semibold tracking-[-0.03em] text-foreground">
                    Revise antes de gerar o PIX
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Seu pedido foi criado. Confirme o contrato para visualizar o
                    QR code e concluir o pagamento.
                  </p>
                  <div className="mt-6 rounded-xl border border-border bg-muted/20 p-4 text-sm leading-6">
                    Ao continuar, você confirma que leu e aceita o{" "}
                    {orderResponse.contract?.contract_file_url ? (
                      <a
                        href={orderResponse.contract.contract_file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-primary underline underline-offset-4"
                      >
                        contrato da matrícula
                      </a>
                    ) : (
                      <span className="font-semibold">contrato da matrícula</span>
                    )}
                    .
                  </div>
                  <Button
                    type="button"
                    className="mt-5 h-12 w-full rounded-xl"
                    onClick={() => setPixContractAccepted(true)}
                  >
                    Li e aceito · mostrar PIX
                    <ArrowRight className="size-4" />
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
