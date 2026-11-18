import Link from "next/link";

type BrandLogoProps = {
  href?: string;
};

export function BrandLogo({ href = "/" }: BrandLogoProps) {
  return (
    <Link href={href} className="inline-flex items-center">
      <picture>
        <source
          type="image/webp"
          srcSet="/images/generated/veli-logo-160.webp 160w, /images/generated/veli-logo-320.webp 320w"
          sizes="143px"
        />
        <img
          src="/images/generated/veli-logo-320.png"
          srcSet="/images/generated/veli-logo-160.png 160w, /images/generated/veli-logo-320.png 320w"
          sizes="143px"
          alt="Veli"
          width={168}
          height={48}
          loading="eager"
          decoding="async"
          fetchPriority="high"
          className="h-10 w-auto sm:h-11"
        />
      </picture>
    </Link>
  );
}
