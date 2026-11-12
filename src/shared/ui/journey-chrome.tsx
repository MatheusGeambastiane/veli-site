import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  CircleHelp,
  Plane,
  ShieldCheck,
} from "lucide-react";
import { BrandLogo } from "./brand-logo";
import styles from "@/shared/styles/veli-journey.module.css";

export function JourneyHeader({
  label,
  secure = false,
  accountActions,
}: {
  label: string;
  secure?: boolean;
  accountActions?: ReactNode;
}) {
  return (
    <header
      className={styles.header}
      data-account={accountActions ? "true" : undefined}
    >
      <a className={styles.skip} href="#conteudo">
        Pular para o conteúdo
      </a>
      <div className={styles.headerInner}>
        <div className={styles.brand}>
          <BrandLogo />
          <span>{label}</span>
        </div>
        <nav aria-label="Navegação de apoio">
          <Link href="/" className={styles.back}>
            <ArrowLeft size={16} aria-hidden="true" /> Voltar ao site
          </Link>
          {secure ? (
            <span className={styles.secure}>
              <ShieldCheck size={16} aria-hidden="true" /> Ambiente seguro
            </span>
          ) : null}
          <Link href="/suporte" aria-label="Precisa de ajuda? Acessar suporte">
            <CircleHelp size={18} aria-hidden="true" />
            <span>Precisa de ajuda?</span>
          </Link>
        </nav>
        {accountActions ? (
          <div className={styles.accountActions}>{accountActions}</div>
        ) : null}
      </div>
    </header>
  );
}

export function JourneyFooter() {
  return (
    <footer className={styles.footer}>
      <span>Veli · Speak beyond borders.</span>
      <Link href="/suporte">
        Fale com a gente <ArrowUpRight size={15} aria-hidden="true" />
      </Link>
    </footer>
  );
}

export function JourneyBanner() {
  return (
    <div className={styles.banner}>
      <div>
        <p className={styles.eyebrow}>Inglês e francês · Veli</p>
        <p className={styles.bannerTitle}>
          Sua próxima conversa
          <br />
          <span className={styles.script}>começa aqui.</span>
        </p>
      </div>
      <div className={styles.stamp} aria-hidden="true">
        <span>PRÓXIMA PARADA</span>
        <Plane size={32} />
        <span>SEU NOVO IDIOMA</span>
      </div>
    </div>
  );
}
