import Image from "next/image";
import Link from "next/link";

const Logo = ({
  className = "",
  href = "/dashboard",
  variant,
}: {
  className?: string;
  href?: string;
  variant?: string;
}) => {
  const imageURL =
    variant === "white"
      ? "/images/logos/aeria-logo_white.svg"
      : "/images/logos/aeria-logo_black.svg";

  return (
    <Link href={href} className={`flex items-center gap-2 ${className}`}>
      <Image
        src={imageURL}
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
