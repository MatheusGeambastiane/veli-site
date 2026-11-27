export type LanguageOption = {
  value: string;
  label: string;
};

export type ScheduleOption = {
  value: string;
  label: string;
  description: string;
  icon: "sunrise" | "sun" | "moon";
};

export type EnrollmentFormData = {
  languageId: string;
  offerId: string;
  studentClassId?: string;
  schedule: string;
  authMode: "register" | "login";
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  cep: string;
  city: string;
  state: string;
  country: string;
  address: string;
  addressNumber: string;
  province: string;
};

export type EnrollmentPayload = EnrollmentFormData;

export type CourseInquiryPayload = {
  courseId: string;
  email: string;
  notes?: string;
};

export type HotsiteLanguage = {
  id: number;
  name: string;
  lang_icon: string;
  lang_description: string;
};

export type HotsiteCourseLevel = {
  id: number;
  level: string;
};

export type HotsiteCourse = {
  id: number;
  name: string;
  language: HotsiteLanguage;
  level: HotsiteCourseLevel | null;
  levels?: HotsiteCourseLevel[];
  description: string;
  is_active: boolean;
};

export type HotsiteStudentClass = {
  id: number;
  course: HotsiteCourse;
  teacher_profile: number;
  teacher_full_name: string;
  teacher?: {
    id: number;
    full_name: string;
    bio: string;
    profile_pic: string | null;
  };
  start_date: string;
  finish_date: string;
  time: string;
  days_of_week: string[];
  duration: number;
  classroom_link: string;
  meet_link?: string;
  is_active: boolean;
  is_generic: boolean;
  created_at: string;
  updated_at: string;
};

export type HotsiteBillingOption = {
  id: number;
  code: string;
  type: "recurring" | "one_time";
  cycle: string;
  billing_method: "credit_card" | "pix";
  price: string;
  allowed_installments: number[];
  is_active: boolean;
};

export type HotsiteOffer = {
  description?: string;
  id: number;
  name: string;
  student_classes: HotsiteStudentClass[];
  languages: HotsiteLanguage[];
  access_days: number | null;
  access_duration_days: number | null;
  grace_period_days: number;
  price: string;
  is_active: boolean;
  plan_type: string;
  billing_interval_months: number | null;
  allow_cash_discount: boolean;
  cash_discount_type: string | null;
  cash_discount_value: string | null;
  billing_options: HotsiteBillingOption[];
  recurring_start_month?: string | null;
  stripe_recurring_start_month?: string | null;
  created_at: string;
  updated_at: string;
};

export type HotsiteOffersResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: HotsiteCheckoutOffer[];
};

export type HotsiteCheckoutLanguage = {
  id: number;
  name: string;
  image: string;
};

export type HotsiteLanguagesResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: HotsiteCheckoutLanguage[];
};

export type HotsiteCheckoutOffer = Pick<
  HotsiteOffer,
  "id" | "name" | "description" | "price" | "access_duration_days" | "student_classes" | "billing_options" | "recurring_start_month" | "stripe_recurring_start_month"
>;

export type HotsiteCheckoutOffersResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: HotsiteCheckoutOffer[];
};

export type CreateHotsiteUserPayload = {
  first_name: string;
  last_name: string;
  cpf: string;
  passport: string;
  is_foreign_without_cpf: boolean;
  is_brazil_resident: boolean;
  email: string;
  password: string;
  phone: string;
  zip_code: string;
  city: string;
  state: string;
  country: string;
  address: string;
  address_number: string;
  province: string;
};

export type HotsiteAuthenticatedUser = {
  id?: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  tax_id?: string | null;
  passport?: string;
  is_foreign_without_cpf?: boolean;
  is_brazil_resident?: boolean;
  cep?: string;
  zip_code?: string;
  city?: string;
  state?: string;
  country?: string;
  address?: string;
  address_number?: string;
  province?: string;
  role?: string;
  access_token?: string;
  refresh_token?: string;
  access?: string;
  refresh?: string;
  token?: string;
  profile_completed?: boolean;
  missing_fields?: string[];
  account_created?: boolean;
  linked_existing_user?: boolean;
  student_full_name?: string;
  profile_pic_url?: string | null;
  languages?: HotsiteLanguage[];
};

export type AuthenticateHotsiteUserPayload = {
  email: string;
  password: string;
};

export type AuthenticateHotsiteGooglePayload = {
  credential: string;
};

export type UpdateHotsiteUserPayload = {
  first_name: string;
  last_name: string;
  cpf: string;
  passport: string;
  is_foreign_without_cpf: boolean;
  is_brazil_resident: boolean;
  phone: string;
  cep: string;
  address: string;
  address_number: string;
  zip_code: string;
  province: string;
  city: string;
  state: string;
  country: string;
};

export type HotsiteOrderPayload = {
  offer_id: number;
  billing_option_code: string;
  enrollment_recurring_option_code?: string;
  installments?: number;
  student_class_id?: number;
  preference_period?: string[];
  coupon_code?: string;
};

export type CouponPreview = {
  offer_id: number;
  billing_option_code: string;
  amount_original: string;
  discount_amount: string;
  amount_total: string;
  coupon_code: string;
  installments: number;
  installment_amount: string;
};

export type HotsiteCreditCard = {
  name: string;
  number: string;
  cvv: string;
  expiration_date: string;
};

export type HotsiteStartCardPaymentPayload = {
  accept_contract: true;
  accept_recurring?: true;
  gateway_choice?: "abacatepay" | "asaas" | "stripe";
  holder_is_customer: boolean;
  credit_card?: HotsiteCreditCard;
  card_token?: string;
  installments?: number;
  name?: string;
  phone?: string;
  address?: string;
  address_number?: string;
  province?: string;
  postal_code?: string;
  city?: string;
  state?: string;
};

export type PaymentGatewayConfig = {
  checkout_mode?: "hosted" | "embedded";
  gateway: "abacatepay" | "asaas" | "stripe";
  methods: Array<"pix" | "credit_card">;
  capabilities: string[];
  public_key?: string;
  card_script_url?: string;
  gateways?: Array<{
    gateway: "abacatepay" | "asaas" | "stripe";
    methods: Array<"pix" | "credit_card">;
    capabilities: string[];
    is_default: boolean;
    checkout_mode: "embedded" | "hosted";
  }>;
};

export type HotsiteStartPaymentResponse = {
  order_id: number;
  checkout_status: string;
  gateway?: "abacatepay" | "asaas" | "stripe";
  checkout_url?: string;
  checkout_session_id?: string;
};

export type HotsiteOrderContract = {
  id: number;
  status: string;
  signed_at: string | null;
  activated_at: string | null;
  contract_file_url: string | null;
};

export type HotsiteOrderResponse = {
  order_id: number;
  enrollment_gateway?: "abacatepay" | "stripe" | "";
  automatic_pix?: boolean;
  enrollment_card_reuse?: boolean;
  enrollment_billing_method?: "pix" | "credit_card" | "";
  enrollment_monthly_amount?: string | null;
  enrollment_start_month?: string | null;
  enrollment_first_due_date?: string | null;
  enrollment_checkout_url?: string;
  status: string;
  contract_acceptance_status: string;
  contract?: HotsiteOrderContract;
  checkout_status: string;
  amount_original?: string;
  discount_amount?: string;
  amount_due?: string;
  payment_mode?: string;
  payment_type?: string;
  payment_installments?: number | null;
  coupon_code?: string | null;
  pix_qr_code_base64?: string;
  pix_qr_code?: string;
  pix_copy_paste?: string;
  mode?: string;
  charge_id?: number;
  gateway_charge_id?: string;
  raw?: {
    value?: number;
    description?: string;
    dueDate?: string;
    invoiceUrl?: string;
    pix_qr_code?: {
      encodedImage?: string;
      payload?: string;
      expirationDate?: string;
      description?: string;
    };
  };
};

export type HotsitePaymentStatusResponse = {
  immediate_subscription?: boolean;
  order_id: number;
  enrollment_gateway?: "abacatepay" | "stripe" | "";
  automatic_pix?: boolean;
  enrollment_card_reuse?: boolean;
  enrollment_billing_method?: "pix" | "credit_card" | "";
  enrollment_monthly_amount?: string | null;
  enrollment_start_month?: string | null;
  enrollment_first_due_date?: string | null;
  enrollment_checkout_url?: string;
  enrollment_paid_cycles?: number;
  order_status: string;
  checkout_status: string;
  contract_acceptance_status: string;
  payment_mode: string;
  payment_type: string;
  installments: number;
  latest_charge: {
    id: number;
    status: string;
    billing_method: string;
    amount_gross: string;
    installments: number | null;
    due_date: string | null;
    pix_qr_code: string | null;
    pix_copy_paste: string | null;
    payment_receipt_url: string | null;
  } | null;
  billing_subscription: unknown;
  payment_status: string;
  is_paid: boolean;
};

export type ViaCepResponse = {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
};
