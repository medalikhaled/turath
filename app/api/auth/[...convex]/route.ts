import { convexAuthNextjsMiddleware } from "@convex-dev/auth/nextjs/server";

const middleware = convexAuthNextjsMiddleware();

export const GET = middleware;
export const POST = middleware;