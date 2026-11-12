import type { ReactNode } from "react";
import { veliFontClassName } from "@/shared/ui/veli-fonts";
import journey from "@/shared/styles/veli-journey.module.css";
import { JourneyHeader, JourneyFooter } from "@/shared/ui/journey-chrome";
import { SiteFooter } from "@/shared/ui/site-footer";
import { SiteHeader } from "@/shared/ui/site-header";
import { SiteShell } from "@/shared/ui/site-shell";
import { HomeHeader } from "@/features/home/home-header";
import { HomeFooter } from "@/features/home/home-footer";
import styles from "@/features/home/home.module.css";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <SiteShell
      homeClassName={`${styles.root} ${veliFontClassName}`}
      journeyClassName={`${journey.theme} ${journey.page} ${veliFontClassName}`}
      journeyHeader={<JourneyHeader label="Teste de nível" />}
      journeyFooter={<JourneyFooter />}
      homeHeader={<HomeHeader />}
      homeFooter={<HomeFooter />}
      header={<SiteHeader />}
      footer={<SiteFooter />}
    >
      {children}
    </SiteShell>
  );
}
