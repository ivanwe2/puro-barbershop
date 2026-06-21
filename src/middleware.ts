import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// TODO: Implement locale routing + auth gating in Commits 5 & 13
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
