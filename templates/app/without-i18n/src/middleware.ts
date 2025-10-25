import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  let response = NextResponse.next();
  // カスタムヘッダーを追加する処理
  response.headers.set("x-url", request.url);
  response.headers.set("x-origin", request.nextUrl.origin);
  response.headers.set("x-pathname", request.nextUrl.pathname);
  return response;
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
