import { convexAuthNextjsMiddleware } from "@convex-dev/auth/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const middleware = convexAuthNextjsMiddleware();

export async function GET(request: NextRequest) {
  const response = await middleware(request, {} as any);
  return response || NextResponse.next();
}

export async function POST(request: NextRequest) {
  const response = await middleware(request, {} as any);
  return response || NextResponse.next();
}