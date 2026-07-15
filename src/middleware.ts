import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Protège toutes les pages de l'application sauf /signin.
// La vérification cryptographique complète du JWT se fait côté serveur
// dans requireUser() ; ici on redirige simplement les visiteurs sans cookie.
export function middleware(request: NextRequest) {
  const hasSession = request.cookies.has("crm_session");
  const isAuthRoute =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/signup") ||
    request.nextUrl.pathname.startsWith("/signin");

  if (!hasSession && !isAuthRoute) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }
  if (hasSession && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
