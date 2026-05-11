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
        <div className="flex flex-col items-center justify-between gap-3 border-t border-border py-6 text-sm text-muted-foreground md:flex-row">
          <p>Português (Brasil)</p>
          <p>© 2026 Veli Idiomas.</p>
        </div>
      </div>
    </footer>
  );
}
