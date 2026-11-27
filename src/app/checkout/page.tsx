import type { Metadata } from "next";
import { CheckoutExperience } from "@/features/checkout/checkout-experience";
import {
  JourneyHeader,
  JourneyFooter,
  JourneyBanner,
} from "@/shared/ui/journey-chrome";
import { veliFontClassName } from "@/shared/ui/veli-fonts";
import styles from "@/shared/styles/veli-journey.module.css";

export const metadata: Metadata = {
  title: "Matrícula | Veli",
  description: "Escolha seu curso, horário e conclua sua matrícula na Veli.",
};

type CheckoutPageProps = {
  searchParams: Promise<{ order?: string | string[]; retorno?: string }>;
};

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const params = await searchParams;
  const rawOrderId = Array.isArray(params.order) ? params.order[0] : params.order;
  const parsedOrderId = Number(rawOrderId);
  const resumeOrderId =
    Number.isSafeInteger(parsedOrderId) && parsedOrderId > 0
      ? parsedOrderId
      : undefined;

  return (
    <div className={`${styles.theme} ${styles.page} ${veliFontClassName}`}>
      <JourneyHeader label="Sua matrícula" secure />
      <main id="conteudo">
        <JourneyBanner />
        <CheckoutExperience mode="page" resumeOrderId={resumeOrderId} gatewayReturn={params.retorno === "1"} />
      </main>
      <JourneyFooter />
    </div>
  );
}
