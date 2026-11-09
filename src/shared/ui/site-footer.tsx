import { BrandLogo } from "@/shared/ui/brand-logo";
import { siteConfig } from "@/shared/config/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-white pt-14">
      <div className="page-shell">
        <div className="mb-12 grid gap-8 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <BrandLogo />
          </div>
          {siteConfig.footerGroups.map((group) => (
            <div key={group.title}>
              <h3 className="text-lg font-semibold text-foreground">
                {group.title}
              </h3>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                {group.links.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-4 border-t border-border py-6 text-sm text-muted-foreground md:flex-row md:items-end md:justify-between">
          <div className="space-y-1 text-center md:text-left">
            <p>CNPJ: 65.261.198/0001-02</p>
            <p>
              Telefone:{" "}
              <a className="hover:text-foreground" href="tel:+5571992997191">
                (71) 99299-7191
              </a>
            </p>
            <p>
              E-mail:{" "}
              <a
                className="hover:text-foreground"
                href="mailto:veliescola@gmail.com"
              >
                veliescola@gmail.com
              </a>
            </p>
          </div>
          <div className="space-y-1 text-center md:text-right">
            <p>Português (Brasil)</p>
            <p>© 2026 Veli Idiomas.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
