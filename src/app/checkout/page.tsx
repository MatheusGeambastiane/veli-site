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

export default function CheckoutPage() {
  return (
    <div className={`${styles.theme} ${styles.page} ${veliFontClassName}`}>
      <JourneyHeader label="Sua matrícula" secure />
      <main id="conteudo">
        <JourneyBanner />
        <CheckoutExperience mode="page" />
      </main>
      <JourneyFooter />
    </div>
  );
}
