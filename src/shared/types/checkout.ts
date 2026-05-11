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

export type HotsiteCourse = {
  id: number;
  name: string;
  language: HotsiteLanguage;
  level: {
    id: number;
    level: string;
  };
  description: string;
  is_active: boolean;
};

export type HotsiteStudentClass = {
  id: number;
  course: HotsiteCourse;
  teacher_profile: number;
  teacher_full_name: string;
  start_date: string;
  finish_date: string;
  time: string;
  days_of_week: string[];
  duration: number;
  classroom_link: string;
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
  created_at: string;
  updated_at: string;
};

export type HotsiteOffersResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: HotsiteOffer[];
};

export type CreateHotsiteUserPayload = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone: string;
  cep: string;
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
  tax_id?: string;
  cep?: string;
  city?: string;
  state?: string;
  country?: string;
  address?: string;
  address_number?: string;
  province?: string;
  role?: string;
  access_token: string;
};

export type AuthenticateHotsiteUserPayload = {
  email: string;
  password: string;
};
