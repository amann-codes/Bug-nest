import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const publicPaths = ["/signup", "/register", "/signin"];

const roleBasedAccess: Record<string, string[]> = {
  employee: ["/tasks"],
  manager: ["/team", "/tasks"],
};

const commonPaths = ["/api", "/favicon.ico", "/_next"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  if (commonPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }
  const token = await getToken({ req: request });
  console.log("token", token);

  if (!token) {
    const signInUrl = new URL("/signin", request.url);
    signInUrl.searchParams.set("callbackUrl", encodeURI(request.url));
    return NextResponse.redirect(signInUrl);
  }

  const role = token.role as string;
  const allowedPaths = roleBasedAccess[role] || [];

  const hasAccess = allowedPaths.some((path) => pathname.startsWith(path));

  if (!hasAccess && role === "manager") {
    return NextResponse.redirect(new URL("/team", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|public).*)"],
};
