import Image from "next/image";
import Link from "next/link"

const Logo = ({ className = "", href = "/dashboard" }: { className?: string; href?: string }) => {
  return (
    <Link href={href} className={`flex items-center gap-2 ${className}`}>
      <Image src="/images/logos/aeria-logo_white.svg" alt="ÆRIA Voyages Academy" width={24} height={24} className="w-auto h-16" />
    </Link>
  )
}
export default Logo