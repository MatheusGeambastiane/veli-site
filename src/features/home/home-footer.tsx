import Link from "next/link";
import { BrandLogo } from "@/shared/ui/brand-logo";

export function HomeFooter() {
  return (
    <footer className="v-footer">
      <div className="v-container">
        <div className="v-footer-top">
          <div>
            <BrandLogo />
            <p>Speak beyond borders.</p>
          </div>
          <nav aria-label="Links do rodapé">
            <Link href="/suporte">Suporte</Link>
            <Link href="/teste-de-nivel">Teste de nível</Link>
            <a
              href="https://www.instagram.com/cest.veli/"
              target="_blank"
              rel="noreferrer"
            >
              Instagram ↗
            </a>
          </nav>
          <div className="v-footer-contact">
            <a href="mailto:veliescola@gmail.com">veliescola@gmail.com</a>
            <a href="tel:+5571992997191">(71) 99299-7191</a>
          </div>
        </div>
        <div className="v-footer-bottom">
          <span>© 2026 Veli Idiomas.</span>
          <span>CNPJ: 65.261.198/0001-02</span>
          <span>Feito para aproximar.</span>
        </div>
      </div>
    </footer>
  );
}
