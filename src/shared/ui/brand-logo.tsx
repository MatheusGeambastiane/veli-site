import Image from "next/image";
import Link from "next/link";

type BrandLogoProps = {
  href?: string;
};

export function BrandLogo({ href = "/" }: BrandLogoProps) {
  return (
    <Link href={href} className="inline-flex items-center">
      <Image
        src="/Veli_logo azul medio.png"
        alt="Veli"
        width={168}
        height={48}
        priority
        className="h-10 w-auto sm:h-11"
      />
    </Link>
  );
}
