import { initTRPC } from "@trpc/server";
import { ZodError } from "zod";
import { cookies } from "next/headers";

export async function createTRPCContext() {
  const cookieStore = await cookies();
  const jwt = cookieStore.get(process.env.JWT_COOKIE_NAME || "token")?.value || null;
  return { jwt, cookies: cookieStore };
}

const t = initTRPC.context<typeof createTRPCContext>().create({
  errorFormatter({ shape, error }) {
    return { ...shape, zodError: error.cause instanceof ZodError ? error.cause.flatten() : null };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.jwt) throw new Error("UNAUTHORIZED");
  return next();
});
