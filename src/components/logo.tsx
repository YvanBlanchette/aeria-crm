import Image from "next/image";
import Link from "next/link";

const Logo = ({ className = "", href = "/dashboard", variant = "white" }: { className?: string; href?: string; variant?: "white" | "black" }) => {
  return (
    <Link href={href} className={`flex items-center gap-2 ${className}`}>
      <Image
        src={`/images/logos/aeria-logo_${variant}.svg`}
        alt="AERIA Voyages Academy"
        width={409}
        height={80}
        priority
        className="h-10 w-auto max-w-[220px] shrink-0 md:h-12"
      />
    </Link>
  );
};

export default Logo;