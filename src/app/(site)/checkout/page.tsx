import type { Metadata } from "next";

import { CheckoutExperience } from "@/features/checkout/checkout-experience";

export const metadata: Metadata = {
  title: "Checkout | Veli",
  description: "Inicie sua matrícula online na Veli.",
};

export default function CheckoutPage() {
  return <CheckoutExperience mode="page" />;
}
